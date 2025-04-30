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

from src.utils.export import export_file, load_invisible_font
from src.utils.file import get_current_time
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
    1: "tesserOCR"
}

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
    data["txt"]["complete"] = True
    data["txt"]["creation"] = current_date
    data["txt"]["size"] = get_size(data_folder + "/_text.txt", path_complete=True)

    export_file(data_folder, "txt", delimiter=True, force_recreate=True)
    data["delimiter_txt"]["complete"] = True
    data["delimiter_txt"]["creation"] = current_date
    data["delimiter_txt"]["size"] = get_size(data_folder + "/_text_delimiter.txt", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    os.remove(data_folder + "/_search.pdf")
    export_file(data_folder, "pdf", force_recreate=True)
    data["pdf"]["complete"] = True
    data["pdf"]["creation"] = current_date
    data["pdf"]["size"] = get_size(data_folder + "/_search.pdf", path_complete=True)

    os.remove(data_folder + "/_simple.pdf")
    export_file(data_folder, "pdf", force_recreate=True, simple=True)
    data["pdf_simples"]["complete"] = True
    data["pdf_simples"]["creation"] = current_date
    data["pdf_simples"]["size"] = get_size(data_folder + "/_simple.pdf", path_complete=True)

    data["csv"]["complete"] = True
    data["csv"]["creation"] = current_date
    data["csv"]["size"] = get_size(data_folder + "/_index.csv", path_complete=True)

    try:
        request_ner(data_folder)
    except Exception as e:
        print(e)
        data["ner"] = {
            "complete": False,
            "error": True
        }

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

        log.info("{path}: A começar OCR")

        for image in images:
            if testing:
                task_page_ocr(path, image, config["engineName"], config["lang"], config_str)
            else:
                task_page_ocr.delay(path, image, config["engineName"], config["lang"], config_str)

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
def task_page_ocr(path: str, filename: str, ocr_engine_name: str, lang: str = 'por', config_str: str = ''):
    """
    Perform the page OCR

    :param path: path to the file
    :param filename: filename of the page
    :param config_str: config string to use
    :param lang: string of languages to use
    :param ocr_engine_name: name of the OCR module to use
    """

    if filename.split(".")[0][-1] == "$": return

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

            json_d = ocr_engine.get_structure(image, lang, config_str)
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
                json_d = ocr_engine.get_structure(image, lang, config_str, box)
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

            if os.path.exists(f"{path}/_images") and os.listdir(f"{path}/_images"):
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
                "pages": get_page_count(path, f"{path}/_search.pdf"),
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
                "pages": get_page_count(path, f"{path}/_simple.pdf"),
            }

            update_data(data_folder, data)

            success = get_ner_file(path)
            if success:
                data["ner"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_entities.json", path_complete=True),
                    "creation": creation_date,
                }
            else:
                data["ner"] = {
                    "complete": False,
                    "error": True
                }

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
