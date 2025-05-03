import json
import os
import traceback

from celery import Celery
from flask import Flask
from flask_cors import CORS
import logging as log
from PIL import Image, ImageDraw

from src.engines import tesseract
from src.engines import easy_ocr

from src.utils.export import load_invisible_font
from src.utils.export import export_csv
from src.utils.export import export_file
from src.utils.file import get_current_time
from src.utils.file import get_doc_len
from src.utils.file import get_size
from src.utils.file import update_data
from src.utils.file import get_data
from src.utils.file import prepare_file_ocr
from src.utils.file import get_file_basename
from src.utils.file import get_ocr_size
from src.utils.file import get_page_count
from src.utils.file import get_ner_file

OCR_ENGINES = {
    0: "tesseract",
    1: "tesserOCR",
}

DEFAULT_OCR_OUTPUTS = os.environ.get('DEFAULT_OCR_OUTPUTS', "pdf").split(',')
DEFAULT_OCR_ENGINE = os.environ.get('DEFAULT_OCR_ENGINE', "tesseract")
DEFAULT_OCR_LANG = os.environ.get('DEFAULT_OCR_LANG', "por")
DEFAULT_OCR_ENGINE_MODE = int(os.environ.get('DEFAULT_OCR_', '3'))
DEFAULT_OCR_SEGMENTATION_MODE = int(os.environ.get('DEFAULT_OCR_DEFAULT_OCR_SEGMENTATION_MODE', '3'))
DEFAULT_OCR_THRESHOLDING_METHOD = int(os.environ.get('DEFAULT_OCR_THRESHOLDING_METHOD', '0'))

app = Flask(__name__)
CORS(app)

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://ocr-redis-1:6379'),
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://ocr-redis-1:6379')
celery = Celery("celery_app", broker=CELERY_BROKER_URL)

load_invisible_font()  # TODO: can it be loaded once at startup of the OCR worker?


@celery.task(name="changes")
def make_changes(data_folder, data):
    current_date = get_current_time()

    export_file(data_folder, "txt", force_recreate=True)
    data["txt"] = {
        "complete": True,
        "size": get_size(data_folder + "/_txt.txt", path_complete=True),
        "creation": current_date,
    }

    export_file(data_folder, "txt", delimiter=True, force_recreate=True)
    data["txt_delimited"] = {
        "complete": True,
        "size": get_size(data_folder + "/_txt_delimited.txt", path_complete=True),
        "creation": current_date
    }

    os.remove(data_folder + "/_pdf_indexed.pdf")
    export_file(data_folder, "pdf", force_recreate=True)
    data["pdf_indexed"] = {
        "complete": True,
        "size": get_size(data_folder + "/_pdf_indexed.pdf", path_complete=True),
        "creation": current_date
    }

    os.remove(data_folder + "/_pdf.pdf")
    export_file(data_folder, "pdf", force_recreate=True, simple=True)
    data["pdf"] = {
        "complete": True,
        "size": get_size(data_folder + "/_pdf.pdf", path_complete=True),
        "creation": current_date
    }
    # CSV exported as part of PDF export
    data["csv"] = {
        "complete": True,
        "size": get_size(data_folder + "/_index.csv", path_complete=True),
        "creation": current_date
    }

    try:
        request_ner(data_folder)
    except Exception as e:
        print(e)
        data["ner"] = {
            "complete": False,
            "error": True
        }

    update_data(data_folder + "/_data.json", data)
    return {"status": "success"}


@celery.task(name="request_ner")
def request_ner(data_folder):
    data = get_data(data_folder + "/_data.json")

    current_date = get_current_time()

    os.remove(data_folder + "/_entities.json")
    success = get_ner_file(data_folder)
    if success:
        data["ner"] = {
            "complete": True,
            "size": get_size(f"{data_folder}/_entities.json", path_complete=True),
            "creation": current_date,
        }
    else:
        data["ner"] = {
            "complete": False,
            "error": True
        }

    update_data(data_folder + "/_data.json", data)

@celery.task(name="file_ocr")
def task_file_ocr(path: str, config: dict, testing=False):
    """
    Prepare the OCR of a file
    :param path: path to the file
    :param config: config to use
    """
    data_folder = f"{path}/_data.json"
    try:
        # Build string with Tesseract run configuration
        if "engine" in config:
            if config["engine"] not in OCR_ENGINES.keys():
                raise ValueError("Invalid OCR engine value", config["engine"])
            config["engineName"] = OCR_ENGINES[config["engine"]]
        else:
            config["engineName"] = DEFAULT_OCR_ENGINE
        if "lang" not in config:
            config["lang"] = DEFAULT_OCR_LANG
        if "engineMode" not in config:
            config["engineMode"] = DEFAULT_OCR_ENGINE_MODE
        if "segmentMode" not in config:
            config["segmentMode"] = DEFAULT_OCR_SEGMENTATION_MODE
        if "thresholdMethod" not in config:
            config["thresholdMethod"] = DEFAULT_OCR_THRESHOLDING_METHOD
        if "outputs" not in config:
            config["outputs"] = DEFAULT_OCR_OUTPUTS

        config_str = f'-l {config["lang"]}'
        if "dpi" in config:
            ' '.join([config_str, f'--dpi {config["dpi"]}'])

        ' '.join([config_str,
                 f'--oem {config["engineMode"]}',
                 f'--psm {config["segmentMode"]}',
                 f'-c thresholding_method={config["thresholdMethod"]}',
                 ])

        if "otherParams" in config:
            ' '.join([config_str, config["otherParams"]])

        # Update the information related to the OCR
        data = get_data(data_folder)
        data["ocr"] = {
            "config": config,
            "progress": 0,
        }
        update_data(data_folder, data)

        # Generate the images
        if not os.path.exists(f"{path}/_ocr_results"):
            os.mkdir(f"{path}/_ocr_results")

        prepare_file_ocr(path)
        pages_path = f"{path}/_pages"
        images = sorted([x for x in os.listdir(pages_path)])

        log.info(f"{path}: A começar OCR")

        for image in images:
            if testing:
                task_page_ocr(path, image, config["engineName"], config["lang"], config_str, config["outputs"])
            else:
                task_page_ocr.delay(path, image, config["engineName"], config["lang"], config_str, config["outputs"])

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
def task_page_ocr(
    path: str,
    filename: str,
    ocr_engine_name: str = DEFAULT_OCR_ENGINE,
    lang: str = DEFAULT_OCR_LANG,
    config_str: str = '',
    output_types: list[str] = None):
    """
    Perform the page OCR

    :param path: path to the file
    :param filename: filename of the page
    :param ocr_engine_name: name of the OCR module to use
    :param lang: string of languages to use
    :param config_str: config string to use
    :param output_types: output types to generate directly, if the file is a single page without user-defined text boxes
    """
    if filename.split(".")[0][-1] == "$": return None
    if output_types is None:
        output_types = DEFAULT_OCR_OUTPUTS

    data_file = f"{path}/_data.json"
    n_doc_pages = get_doc_len(data_file)
    raw_results = None

    try:
        # Convert the ocr_algorithm to the correct class
        ocr_engine = globals()[ocr_engine_name]

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

            # If single-page document, take advantage of output types to immediately generate results with Tesseract
            if n_doc_pages == 1:
                json_d, raw_results = ocr_engine.get_structure(image, lang, config_str, output_types=output_types)
            else:
                json_d, _ = ocr_engine.get_structure(image, lang, config_str)
            json_d = [[x] for x in json_d]

            # Store formatted OCR output for the page in JSON
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
                if item["type"] != "text": continue
                for sq in item["squares"]:
                    left = sq["left"]
                    top = sq["top"]
                    right = sq["right"]
                    bottom = sq["bottom"]

                    box_coords = (left, top, right, bottom)
                    box_coordinates_list.append(box_coords)

            all_jsons = []
            for box in box_coordinates_list:
                json_d, _ = ocr_engine.get_structure(image, lang, config_str, segment_box=box)
                if json_d:
                    all_jsons.append(json_d)

            page_json = []
            for sublist in all_jsons:
                page_json.append(sublist)

            with open(f"{path}/_ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(page_json, f, indent=2, ensure_ascii=False)

        files = os.listdir(f"{path}/_ocr_results")

        data = get_data(data_file)
        data["ocr"]["progress"] = len(files)
        update_data(data_file, data)

        # If last page has been processed, generate results
        if len(files) == n_doc_pages:
            log.info(f"{path}: Acabei OCR")

            data["ocr"].update({
                "progress": len(files),
                "size": get_ocr_size(f"{path}/_ocr_results"),
                "creation": get_current_time(),
            })
            update_data(data_file, data)

            # If single-page document, directly store results generated by Tesseract
            if n_doc_pages == 1 and raw_results:
                for extension in raw_results.keys():
                    file_path = f"{path}/_{extension}.{extension}"
                    with open(file_path, "wb") as f:
                        f.write(raw_results[extension])
                    creation_date = get_current_time()
                    data[extension] = {
                        "complete": True,
                        "size": get_size(file_path, path_complete=True),
                        "creation": creation_date,
                    }
                    if extension == "pdf":
                        data[extension]["pages"] = get_page_count(path, file_path)
                    update_data(data_file, data)

            task_export_results.delay(path, output_types)

        return {"status": "success"}

    except Exception as e:
        traceback.print_exc()
        data = get_data(data_file)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_file, data)
        log.error(f"Error in performing a page's OCR for file at {path}: {e}")

        return {"status": "error"}


@celery.task(name="export_results")
def task_export_results(path: str, output_types: list[str]):
    data_file = f"{path}/_data.json"
    data = get_data(data_file)

    try:
        if "txt" in output_types and not data["txt"]["complete"]:
            export_file(path, "txt")
            data["txt"] = {
                "complete": True,
                "size": get_size(f"{path}/_txt.txt", path_complete=True),
                "creation": get_current_time(),
            }

        if "txt_delimited" in output_types and not data["txt_delimited"]["complete"]:
            export_file(path, "txt", delimiter=True)
            data["txt_delimited"] = {
                "complete": True,
                "size": get_size(f"{path}/_txt_delimited.txt", path_complete=True),
                "creation": get_current_time(),
            }

        if os.path.exists(f"{path}/_images") and os.listdir(f"{path}/_images"):
            export_file(path, "imgs")
            data["zip"] = {
                "complete": True,
                "size": get_size(f"{path}/_images.zip", path_complete=True),
                "creation": get_current_time(),
            }

        if "pdf_indexed" in output_types and not data["pdf_indexed"]["complete"]:
            export_file(path, "pdf", get_csv=("csv" in output_types))
            creation_time = get_current_time()
            data["pdf_indexed"] = {
                "complete": True,
                "size": get_size(f"{path}/_pdf_indexed.pdf", path_complete=True),
                "creation": creation_time,
                "pages": get_page_count(path, f"{path}/_pdf_indexed.pdf"),
            }
            if "csv" in output_types:
                # CSV exported as part of PDF export
                data["csv"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_index.csv", path_complete=True),
                    "creation": creation_time,
                }

        if "pdf" in output_types and not data["pdf"]["complete"]:
            export_file(path, "pdf", simple=True, get_csv=("csv" in output_types))
            creation_time = get_current_time()
            data["pdf"] = {
                "complete": True,
                "size": get_size(f"{path}/_pdf.pdf", path_complete=True),
                "creation": creation_time,
                "pages": get_page_count(path, f"{path}/_pdf.pdf"),
            }
            if "csv" in output_types:
                # CSV exported as part of PDF export
                data["csv"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_index.csv", path_complete=True),
                    "creation": creation_time,
                }

        if "csv" in output_types and not data["csv"]["complete"]:
            export_csv(path)
            data["csv"] = {
                "complete": True,
                "size": get_size(f"{path}/_index.csv", path_complete=True),
                "creation": get_current_time(),
            }

        success = get_ner_file(path)
        if success:
            data["ner"] = {
                "complete": True,
                "size": get_size(f"{path}/_entities.json", path_complete=True),
                "creation": get_current_time(),
            }
        else:
            data["ner"] = {
                "complete": False,
                "error": True
            }

        update_data(data_file, data)
        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        data = get_data(data_file)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_file, data)
        log.error(f"Error in exporting results for file at {path}: {e}")

        return {"status": "error"}
