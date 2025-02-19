import json
import os
import eventlet
import traceback

from celery import Celery
from flask import Flask
from flask_cors import CORS
import logging as log
from PIL import Image, ImageDraw
import json

from src.algorithms import tesseract
from src.algorithms import easy_ocr

from src.utils.file import get_current_time
from src.utils.file import export_file
from src.utils.file import get_size
from src.utils.file import update_data
from src.utils.file import get_data
from src.utils.file import prepare_file_ocr
from src.utils.file import get_file_basename
from src.utils.file import get_ocr_size
from src.utils.file import get_page_count
from src.utils.file import get_ner_file

app = Flask(__name__)
CORS(app)

eventlet.monkey_patch()

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://ocr-redis-1:6379'),
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://ocr-redis-1:6379')
celery = Celery("celery_app", broker=CELERY_BROKER_URL)

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
def task_file_ocr(path, config, ocr_algorithm, testing=False):
    """
    Prepare the OCR of a file
    @param path: path to the file
    @param config: config to use
    @param ocr_algorithm: algorithm to use
    """

    # Generate the images
    try:
        prepare_file_ocr(path)
        images = sorted([x for x in os.listdir(path) if x.endswith(".jpg")])

        if not os.path.exists(f"{path}/ocr_results"):
            os.mkdir(f"{path}/ocr_results")

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

    if filename.split(".")[0][-1] == "$": return

    

    try:
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)

        # Convert the ocr_algorithm to the correct class
        ocr_algorithm = globals()[ocr_algorithm]

        layout_path = f"{path}/layouts/{get_file_basename(filename)}.json"
        segment_ocr_flag = False

        parsed_json = []
        if os.path.exists(layout_path):
            with open(layout_path, "r", encoding="utf-8") as json_file:
                parsed_json = json.load(json_file)

                all_but_ignore = [x for x in parsed_json if x["type"] != "remove"]

                if all_but_ignore:
                    segment_ocr_flag = True

        if not segment_ocr_flag:
            image = Image.open(f"{path}/{filename}")

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
            with open(f"{path}/ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(json_d, f, indent=2, ensure_ascii=False)
        else:
            with open(layout_path, "r", encoding="utf-8") as json_file:
                parsed_json = json.load(json_file)

            text_groups = [x for x in parsed_json if x["type"] == "text"]
            image_groups = [x for x in parsed_json if x["type"] == "image"]
            ignore_groups = [x for x in parsed_json if x["type"] == "remove"]

            image = Image.open(f"{path}/{filename}")
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
                if not os.path.exists(f"{path}/images"):
                    os.mkdir(f"{path}/images")

                for id, item in enumerate(image_groups):
                    for sq in item["squares"]:
                        left = sq["left"]
                        top = sq["top"]
                        right = sq["right"]
                        bottom = sq["bottom"]

                        box_coords = (left, top, right, bottom)
                        cropped_image = image.crop(box_coords)
                        cropped_image.save(f"{path}/images/page{page_id}_{id+1}.jpg")


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
                json_d = ocr_algorithm.get_structure(image, config, box)
                if json_d:
                    all_jsons.append(json_d)

            page_json = []
            for sublist in all_jsons:
                page_json.append(sublist)
            
            with open(f"{path}/ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(page_json, f, indent=2, ensure_ascii=False)

        files = os.listdir(f"{path}/ocr_results")

        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["progress"] = len(files)
        update_data(data_folder, data)

        
        if data["pages"] == len(files):
            log.info(f"{path}: Acabei OCR")

            creation_date = get_current_time()

            data["ocr"] = {
                "progress": len(files),
                "size": get_ocr_size(f"{path}/ocr_results"),
                "creation": creation_date,
            }

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

            if os.path.exists(f"{path}/images") and os.listdir(f"{path}/images"):
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
                "pages": get_page_count(f"{path}/_search.pdf"),
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
                "pages": get_page_count(f"{path}/_simple.pdf"),
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