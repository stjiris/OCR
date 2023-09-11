import json
import os

from celery import Celery
from flask import Flask
from flask_cors import CORS
import logging as log
from PIL import Image
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

app = Flask(__name__)
CORS(app)

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://dissertacao-ocr-redis-1:6379'),
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://dissertacao-ocr-redis-1:6379')
celery = Celery("celery_app", broker=CELERY_BROKER_URL)

@celery.task(name="changes")
def make_changes(data_folder, data):
    current_date = get_current_time()

    export_file(data_folder, "txt", force_recreate=True)
    data["txt"]["complete"] = True
    data["txt"]["creation"] = current_date
    data["txt"]["size"] = get_size(data_folder + "/_text.txt", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    os.remove(data_folder + "/_search.pdf")
    export_file(data_folder, "pdf", force_recreate=True)
    data["pdf"]["complete"] = True
    data["pdf"]["creation"] = current_date
    data["pdf"]["size"] = get_size(data_folder + "/_search.pdf", path_complete=True)
    data["csv"]["complete"] = True
    data["csv"]["creation"] = current_date
    data["csv"]["size"] = get_size(data_folder + "/_index.csv", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    return {"status": "success"}

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

    try:
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)

        # Convert the ocr_algorithm to the correct class
        ocr_algorithm = globals()[ocr_algorithm]

        layout_path = f"{path}/layouts/{get_file_basename(filename)}.json"
        segment_ocr_flag = False

        if os.path.exists(layout_path):
            with open(layout_path, "r") as f:
                contents = f.read().strip()
                if contents != "[]":
                    segment_ocr_flag = True

        if segment_ocr_flag == False:
            json_d = ocr_algorithm.get_structure(Image.open(f"{path}/{filename}"), config)
            json_d = [[x] for x in json_d]
            with open(f"{path}/ocr_results/{get_file_basename(filename)}.json", "w") as f:
                json.dump(json_d, f, indent=2)
        else:
            with open(layout_path, "r") as json_file:
                parsed_json = json.load(json_file)

            box_coordinates_list = []
            for item in parsed_json:
                left = item["left"]
                top = item["top"]
                right = item["right"]
                bottom = item["bottom"]
                
                box_coords = (left, top, right, bottom)
                box_coordinates_list.append(box_coords)

            all_jsons = []
            for box in box_coordinates_list:                
                json_d = ocr_algorithm.get_structure(Image.open(f"{path}/{filename}"), config, box)
                all_jsons.append(json_d)

            page_json = []
            for sublist in all_jsons:
                page_json.append(sublist)
            
            with open(f"{path}/ocr_results/{get_file_basename(filename)}.json", "w") as f:
                json.dump(page_json, f, indent=2)

        files = os.listdir(f"{path}/ocr_results")

        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["progress"] = len(files)
        update_data(data_folder, data)

        if data["pages"] == len(files):
            log.info(f"{path}: Acabei OCR")

            creation_date = get_current_time()

            data["ocr"]["progress"] = len(files)
            data["ocr"]["size"] = get_ocr_size(f"{path}/ocr_results")
            data["ocr"]["creation"] = creation_date

            update_data(data_folder, data)

            log.info("Txt")

            export_file(path, "txt")
            creation_date = get_current_time()
            data["txt"]["complete"] = True
            data["txt"]["size"] = get_size(f"{path}/_text.txt", path_complete=True)
            data["txt"]["creation"] = creation_date

            log.info("Txt finished")

            export_file(path, "pdf")
            creation_date = get_current_time()

            data["pdf"]["complete"] = True
            data["pdf"]["size"] = get_size(f"{path}/_search.pdf", path_complete=True)
            data["pdf"]["creation"] = creation_date
            data["pdf"]["pages"] = get_page_count(f"{path}/_search.pdf")
            data["csv"]["complete"] = True
            data["csv"]["creation"] = creation_date
            data["csv"]["size"] = get_size(f"{path}/_index.csv", path_complete=True)

            data["indexed"] = False
            update_data(data_folder, data)

        return {"status": "success"}

    except Exception as e:
        print(e)
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in performing a page's OCR for file at {path}: {e}")

        return {"status": "error"}