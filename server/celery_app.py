import json
import logging as log
import os
import shutil
import traceback
import zipfile

from celery import Celery
from PIL import Image
from PIL import ImageDraw
import pypdfium2 as pdfium

from src.algorithms import tesseract
from src.utils.export import export_file
from src.utils.export import load_invisible_font

from src.utils.file import ALLOWED_EXTENSIONS
from src.utils.file import generate_random_uuid
from src.utils.file import get_current_time
from src.utils.file import get_data
from src.utils.file import get_file_basename
from src.utils.file import get_ner_file
from src.utils.file import get_ocr_size
from src.utils.file import get_page_count
from src.utils.file import get_size
from src.utils.file import update_data

from src.utils.image import parse_images

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
celery = Celery("celery_app", backend=CELERY_RESULT_BACKEND, broker=CELERY_BROKER_URL)

load_invisible_font()


@celery.task(name="auto_segment")
def auto_segment(path):
    return parse_images(path)


@celery.task(name="export_file")
def task_export(path, filetype, delimiter=False, force_recreate=False, simple=False):
    return export_file(path, filetype, delimiter, force_recreate, simple)


@celery.task(name="make_changes")
def task_make_changes(data_folder, data):
    export_file(data_folder, "txt", force_recreate=True)
    data["txt"]["complete"] = True
    data["txt"]["creation"] = get_current_time()
    data["txt"]["size"] = get_size(data_folder + "/_text.txt", path_complete=True)

    export_file(data_folder, "txt", delimiter=True, force_recreate=True)
    data["delimiter_txt"]["complete"] = True
    data["delimiter_txt"]["creation"] = get_current_time()
    data["delimiter_txt"]["size"] = get_size(data_folder + "/_text_delimiter.txt", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    os.remove(data_folder + "/_search.pdf")
    export_file(data_folder, "pdf", force_recreate=True)
    data["pdf"]["complete"] = True
    data["pdf"]["creation"] = get_current_time()
    data["pdf"]["size"] = get_size(data_folder + "/_search.pdf", path_complete=True)

    os.remove(data_folder + "/_simple.pdf")
    export_file(data_folder, "pdf", force_recreate=True, simple=True)
    data["pdf_simples"]["complete"] = True
    data["pdf_simples"]["creation"] = get_current_time()
    data["pdf_simples"]["size"] = get_size(data_folder + "/_simple.pdf", path_complete=True)

    data["csv"]["complete"] = True
    data["csv"]["creation"] = get_current_time()
    data["csv"]["size"] = get_size(data_folder + "/_index.csv", path_complete=True)

    try:
        task_request_ner(data_folder)
    except Exception as e:
        print(e)
        data["ner"] = {"complete": False, "error": True}

    return {"status": "success"}


@celery.task(name="prepare_file")
def task_prepare_file_ocr(path):
    try:
        if not os.path.exists(f"{path}/_pages"):
            os.mkdir(f"{path}/_pages")

        extension = path.split(".")[-1].lower()
        basename = get_file_basename(path)

        log.info(f"{path}: A preparar páginas")

        if extension == "pdf":
            pdf = pdfium.PdfDocument(f"{path}/{basename}.pdf")
            for i in range(len(pdf)):
                page = pdf[i]
                bitmap = page.render(300 / 72)  # turn PDF page into 300 DPI bitmap
                pil_image = bitmap.to_pil()
                pil_image.save(f"{path}/_pages/{basename}_{i}.jpg", quality=95, dpi=(300, 300))

            pdf.close()

        elif extension == "zip":
            temp_folder_name = f"{path}/{generate_random_uuid()}"
            os.mkdir(temp_folder_name)

            with zipfile.ZipFile(f"{path}/{basename}.zip", 'r') as zip_ref:
                zip_ref.extractall(temp_folder_name)

            page_paths = [
                f"{temp_folder_name}/{file}"
                for file in os.listdir(temp_folder_name)
                if os.path.isfile(os.path.join(temp_folder_name, file))
            ]

            # sort pages alphabetically, case-insensitive
            # casefold for better internationalization, original string appended as fallback
            page_paths.sort(key=lambda s: (s.casefold(), s))

            for i, page in enumerate(page_paths):
                im = Image.open(page)
                im.save(f"{path}/_pages/{basename}_{i}.png", format="PNG")  # using PNG to keep RGBA
            shutil.rmtree(temp_folder_name)

        elif extension in ALLOWED_EXTENSIONS:  # some other than pdf
            original_path = f"{path}/{basename}.{extension}"
            link_path = f"{path}/_pages/{basename}_0.{extension}"
            if not os.path.exists(link_path):
                os.link(original_path, link_path)


        update_data(f"{path}/_data.json", {
            "pages": get_page_count(path, extension),
            "stored": True,
            "creation": get_current_time()
        })

    except Exception as e:
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in preparing OCR for file at {path}: {e}")
        raise e


@celery.task(name="request_ner")
def task_request_ner(data_folder):
    data = get_data(data_folder + "/_data.json")

    os.remove(data_folder + "/_entities.json")
    success = get_ner_file(data_folder)
    creation_date = get_current_time()
    if success:
        data["ner"] = {
            "complete": True,
            "size": get_size(f"{data_folder}/_entities.json", path_complete=True),
            "creation": creation_date
        }
    else:
        data["ner"] = {"complete": False, "error": True}

    update_data(data_folder + "/_data.json", data)


@celery.task(name="file_ocr")
def task_file_ocr(path, config, ocr_algorithm, testing=False):
    """
    Prepare the OCR of a file
    @param path: path to the file
    @param config: config to use
    @param ocr_algorithm: algorithm to use
    """

    # Generate the images
    try:
        if not os.path.exists(f"{path}/_ocr_results"):
            os.mkdir(f"{path}/_ocr_results")

        #TODO: remove this possible duplicate generation of files for OCR?
        task_prepare_file_ocr(path)
        pages_path = f"{path}/_pages"
        images = sorted([x for x in os.listdir(pages_path)])

        log.info("{path}: A começar OCR")

        for image in images:
            if testing:
                task_page_ocr(path, image, config, ocr_algorithm)
            else:
                task_page_ocr.delay(path, image, config, ocr_algorithm)

        return {"status": "success"}

    except Exception as e:
        print(e)
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in performing OCR for file at {path}: {e}")

        return {"status": "error"}


@celery.task(name="page_ocr")
def task_page_ocr(path, filename, config, ocr_algorithm):
    """
    Perform the page OCR

    :param path: path to the file
    :param filename: filename of the page
    :param config: config to use
    :param ocr_algorithm: algorithm to use
    """

    if filename.split(".")[0][-1] == "$":
        return

    try:
        # Convert the ocr_algorithm to the correct class
        ocr_algorithm = globals()[ocr_algorithm]

        layout_path = f"{path}/_layouts/{get_file_basename(filename)}.json"
        segment_ocr_flag = False

        parsed_json = []
        if os.path.exists(layout_path):
            with open(layout_path, "r", encoding="utf-8") as json_file:
                parsed_json = json.load(json_file)

                all_but_ignore = [x for x in parsed_json if x["type"] != "remove"]

                if all_but_ignore:
                    segment_ocr_flag = True

        if not segment_ocr_flag:
            image = Image.open(f"{path}/_pages/{filename}")

            for item in [x for x in parsed_json if x["type"] == "remove"]:
                for sq in item["squares"]:
                    left = sq["left"]
                    top = sq["top"]
                    right = sq["right"]
                    bottom = sq["bottom"]

                    box_coords = ((left, top), (right, bottom))
                    img_draw = ImageDraw.Draw(image)
                    img_draw.rectangle(box_coords, fill="white")

            json_d = ocr_algorithm.get_structure(image, config)
            json_d = [[x] for x in json_d]
            with open(f"{path}/_ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(json_d, f, indent=2, ensure_ascii=False)
        else:
            with open(layout_path, "r", encoding="utf-8") as json_file:
                parsed_json = json.load(json_file)

            text_groups = [x for x in parsed_json if x["type"] == "text"]
            image_groups = [x for x in parsed_json if x["type"] == "image"]
            ignore_groups = [x for x in parsed_json if x["type"] == "remove"]

            image = Image.open(f"{path}/_pages/{filename}")
            basename = get_file_basename(filename)
            page_id = int(basename.split("_")[-1]) + 1

            if ignore_groups:
                for item in ignore_groups:
                    for sq in item["squares"]:
                        left = sq["left"]
                        top = sq["top"]
                        right = sq["right"]
                        bottom = sq["bottom"]

                        box_coords = ((left, top), (right, bottom))
                        img_draw = ImageDraw.Draw(image)
                        img_draw.rectangle(box_coords, fill="white")

            if image_groups:
                if not os.path.exists(f"{path}/_images"):
                    os.mkdir(f"{path}/_images")

                for id, item in enumerate(image_groups):
                    for sq in item["squares"]:
                        left = sq["left"]
                        top = sq["top"]
                        right = sq["right"]
                        bottom = sq["bottom"]

                        box_coords = (left, top, right, bottom)
                        cropped_image = image.crop(box_coords)
                        cropped_image.save(f"{path}/_images/page{page_id}_{id+1}.{filename.split('.')[-1].lower()}")

            box_coordinates_list = []
            for item in text_groups:
                if item["type"] != "text":
                    continue
                for sq in item["squares"]:
                    left = sq["left"]
                    top = sq["top"]
                    right = sq["right"]
                    bottom = sq["bottom"]

                    box_coords = (left, top, right, bottom)
                    box_coordinates_list.append(box_coords)

            all_jsons = []
            for box in box_coordinates_list:
                json_d = ocr_algorithm.get_structure(image, config, box)
                if json_d:
                    all_jsons.append(json_d)

            page_json = []
            for sublist in all_jsons:
                page_json.append(sublist)

            with open(f"{path}/_ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(page_json, f, indent=2, ensure_ascii=False)

        files = os.listdir(f"{path}/_ocr_results")

        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["progress"] = len(files)
        update_data(data_folder, data)

        if data["pages"] == len(files):
            log.info(f"{path}: Acabei OCR")
            creation_date = get_current_time()

            data["ocr"].update({
                "progress": len(files),
                "size": get_ocr_size(f"{path}/_ocr_results"),
                "creation": creation_date,
            })

            update_data(data_folder, data)

            export_file(path, "txt")
            export_file(path, "txt", delimiter=True)
            creation_date = get_current_time()

            data["indexed"] = False

            data["txt"] = {
                "complete": True,
                "size": get_size(f"{path}/_text.txt", path_complete=True),
                "creation": creation_date,
            }

            data["delimiter_txt"] = {
                "complete": True,
                "size": get_size(f"{path}/_text_delimiter.txt", path_complete=True),
                "creation": creation_date,
            }

            if os.path.exists(f"{path}/_images") and os.listdir(f"{path}/images"):
                export_file(path, "imgs")
                data["zip"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_images.zip", path_complete=True),
                    "creation": creation_date,
                }

            update_data(data_folder, data)

            export_file(path, "pdf")
            creation_date = get_current_time()
            data["pdf"] = {
                "complete": True,
                "size": get_size(f"{path}/_search.pdf", path_complete=True),
                "creation": creation_date,
                "pages": get_page_count(path, "pdf"),
            }
            data["csv"] = {
                "complete": True,
                "size": get_size(f"{path}/_index.csv", path_complete=True),
                "creation": creation_date,
            }

            export_file(path, "pdf", simple=True)
            creation_date = get_current_time()
            data["pdf_simples"] = {
                "complete": True,
                "size": get_size(f"{path}/_simple.pdf", path_complete=True),
                "creation": creation_date,
                "pages": get_page_count(path, "pdf"),
            }

            update_data(data_folder, data)

            success = get_ner_file(path)
            creation_date = get_current_time()
            if success:
                data["ner"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_entities.json", path_complete=True),
                    "creation": creation_date,
                }
            else:
                data["ner"] = {"complete": False, "error": True}

            update_data(data_folder, data)

        return {"status": "success"}

    except Exception as e:
        print(e)

        traceback.print_exc()

        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in performing a page's OCR for file at {path}: {e}")

        return {"status": "error"}
