import os

from celery import Celery, shared_task
from flask import Flask
from flask_cors import CORS
import logging as log
from PIL import Image

from src.algorithms import tesseract
from src.algorithms import easy_ocr

from src.utils.file import get_current_time
from src.utils.file import export_file
from src.utils.file import get_size
from src.utils.file import update_data
from src.utils.file import get_data
from src.utils.file import prepare_file_ocr
from src.utils.file import save_json_structure
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

    export_file(data_folder, "txt")
    data["txt"]["complete"] = True
    data["txt"]["creation"] = current_date
    data["txt"]["size"] = get_size(data_folder + "/_text.txt", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    os.remove(data_folder + "/_search.pdf")
    export_file(data_folder, "pdf")
    data["pdf"]["complete"] = True
    data["pdf"]["creation"] = current_date
    data["pdf"]["size"] = get_size(data_folder + "/_search.pdf", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    return {"status": "success"}

@celery.task(name="file_ocr")
def task_file_ocr(path, config, ocr_algorithm):
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

        log.info("{path}: A começar OCR")

        for image in images:
            task_page_ocr.delay(path, image, config, ocr_algorithm)

        return {"status": "success"}

    except Exception as e:
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

        json_d = ocr_algorithm.get_structure(Image.open(f"{path}/{filename}"), config)
        save_json_structure(
            json_d, f"{path}/ocr_results/{get_file_basename(filename)}.json"
        )

        files = os.listdir(f"{path}/ocr_results")

        data = get_data(data_folder)
        data["ocr"]["progress"] = len(files)
        update_data(data_folder, data)

        if data["pages"] == len(files):
            log.info("{path}: Acabei OCR")

            creation_date = get_current_time()

            data["ocr"]["progress"] = len(files)
            data["ocr"]["size"] = get_ocr_size(f"{path}/ocr_results")
            data["ocr"]["creation"] = creation_date

            update_data(data_folder, data)

            export_file(path, "txt")
            export_file(path, "pdf")

            creation_date = get_current_time()

            data["txt"]["complete"] = True
            data["txt"]["size"] = get_size(f"{path}/_text.txt", path_complete=True)
            data["txt"]["creation"] = creation_date

            data["pdf"]["complete"] = True
            data["pdf"]["size"] = get_size(f"{path}/_search.pdf", path_complete=True)
            data["pdf"]["creation"] = creation_date
            data["pdf"]["pages"] = get_page_count(f"{path}/_search.pdf")

            data["indexed"] = False
            update_data(data_folder, data)

        return {"status": "success"}

    except Exception as e:
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in performing a page's OCR for file at {path}: {e}")

        return {"status": "error"}