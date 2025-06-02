import json
import os
import time

from io import BytesIO
import tempfile
import shutil

import traceback

from tesserocr import PyTessBaseAPI
import pypdfium2 as pdfium
from celery import chord, group
from celery import Celery
from flask import Flask
from flask_cors import CORS
import logging as log
from PIL import Image, ImageDraw
import json

from src.algorithms import tesserOCR
from src.algorithms import tesseract
from src.algorithms import easy_ocr

from src.utils.file import get_current_time
from src.utils.file import export_file
from src.utils.file import get_size
from src.utils.file import update_data
from src.utils.file import get_data
from src.utils.file import get_file_basename
from src.utils.file import get_ocr_size
from src.utils.file import get_page_count
from src.utils.file import get_ner_file

app = Flask(__name__)
CORS(app)

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

    try:
        metrics = {}

        log.info(f"Starting OCR process for file: {path}")
        start_total = time.time()

        log.info("Validating input file...")
        validation_start = time.time()
        #prepare_file_ocr(path)
        validation_time = time.time() - validation_start
        metrics['file_validation_time'] = validation_time
        log.info(f"File validation completed in {validation_time:.2f}s")

        log.info("Starting PDF split process...")
        split_start = time.time()
        images = sorted([x for x in os.listdir(path) if x.endswith(".png")])
        split_time = time.time() - split_start
        metrics['pdf_split_time'] = split_time
        log.info(f"PDF split completed in {split_time:.2f}s. Generated {len(images)} pages.")

        if not os.path.exists(f"{path}/ocr_results"):
            os.mkdir(f"{path}/ocr_results")

        log.info("Queuing OCR tasks for each page...")
        queue_start = time.time()
        tasks = [task_page_ocr.s(path, image, config, ocr_algorithm) for image in images]
        log.info(f"Queuing {len(images)} OCR tasks.")
        queue_time = time.time() - queue_start
        metrics['task_queue_time'] = queue_time
        log.info(f"Task queue creation completed in {queue_time:.2f}s")

        chord(tasks)(task_ocr_complete.s(path, start_total, metrics))

        return {"status": "success"}

    except Exception as e:
        print(e)
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in performing OCR for file at {path}: {e}")

        return {"status": "error"}





# DONE
def prepare_file_ocr(path):
    """
    Prepare the OCR of a file
    @param path: path to the file
    @param ocr_folder: folder to save the results
    """
    try:
        extension = path.split(".")[-1]
        basename = get_file_basename(path)

        log.info("{path}: A preparar páginas")

        if extension == "pdf":
            pdf = pdfium.PdfDocument(f"{path}/{basename}.pdf")
            num_pages = len(pdf)
            pdf.close()

            tasks = group(task_extract_pdf_page.s(path, basename, i) for i in range(num_pages))
            
            tasks.apply_async()

            pdf.close()

        elif extension in ["jpeg", "jpg"]:
            img = Image.open(f"{path}/{basename}.{extension}")
            img.save(f"{path}/{basename}.png", "PNG")
    except Exception as e:

        
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in preparing OCR for file at {path}: {e}")



@celery.task(name="extract_pdf_page")
def task_extract_pdf_page(path, basename, i):
    """
    Extracts a single PDF page and saves it as a PNG file.
    This runs on separate Celery workers for parallelization.
    """
    try:
        pdf = pdfium.PdfDocument(f"{path}/{basename}.pdf")
        page = pdf[i]
        bitmap = page.render(300 / 72)  # You can adjust DPI here (e.g., 150 / 72 for smaller files)
        pil_image = bitmap.to_pil()
        output_path = f"{path}/{basename}_{i}.png"

        # Use BytesIO for buffered I/O
        buffer = BytesIO()
        pil_image.save(buffer, format="PNG", compress_level=0, optimize=False)  # Use compression for smaller files
        buffer.seek(0)

        # Use temporary file for atomic write
        with tempfile.NamedTemporaryFile(delete=False, suffix='.png', dir=path) as temp:
            temp.write(buffer.getvalue())
        
        # Atomically move the temporary file to the final location
        shutil.move(temp.name, output_path)

        # Verify the PNG to ensure it’s not truncated
        try:
            with Image.open(output_path) as img:
                img.load()  # Force load to check for truncation
            log.info(f"Verified page {i} from {basename}.pdf is valid (size: {os.path.getsize(output_path)} bytes)")
        except Exception as e:
            log.error(f"Invalid PNG generated for page {i}: {e}")
            os.remove(output_path)  # Remove truncated file
            raise

        pdf.close()
        log.info(f"Extracted page {i} from {basename}.pdf")
    
    except Exception as e:
        log.error(f"Error extracting page {i} from {basename}.pdf: {e}")


@celery.task(name="ocr_complete")
def task_ocr_complete(results, path, start_time, initial_metrics):
    """
    Callback task executed after all OCR tasks for a PDF are complete.
    Calculates the total processing time.
    """
    try:
        total_time = time.time() - start_time
        log.info(f"{path}: Total OCR time for the entire PDF: {total_time:.2f} seconds")

        valid_results = [r.get("metricas") for r in results if isinstance(r, dict) and "metricas" in r]

        if not valid_results:
            log.warning(f"{path}: No valid OCR results to process. Skipping metric calculations.")
            return {
                "status": "success",
                "metrics": {
                    "total_time": total_time,
                    "file_validation_time": initial_metrics.get('file_validation_time'),
                    "pdf_split_time": initial_metrics.get('pdf_split_time'),
                    "task_queue_time": initial_metrics.get('task_queue_time'),
                    "average_image_load_time": 0,
                    "average_ocr_time": 0,
                    "average_save_time": 0,
                }
            }


        # Calculate averages correctly
        avg_image_load_time = sum(r.get('image_load_time', 0) for r in valid_results) / len(valid_results)
        avg_ocr_time = sum(r.get('ocr_time', 0) for r in valid_results) / len(valid_results)
        avg_save_time = sum(r.get('save_time', 0) for r in valid_results) / len(valid_results)

        final_metrics = {
            "total_time": total_time,
            "file_validation_time": initial_metrics.get('file_validation_time'),
            "pdf_split_time": initial_metrics.get('pdf_split_time'),
            "task_queue_time": initial_metrics.get('task_queue_time'),
            "average_image_load_time": avg_image_load_time,
            "average_ocr_time": avg_ocr_time,
            "average_save_time": avg_save_time,
        }

        log.info(f"Final metrics for {path}: {json.dumps(final_metrics, indent=2)}")
        return {"status": "success", "metrics": final_metrics}

    except Exception as e:
        log.error(f"Error calculating total OCR time for {path}: {e}")
        return {"status": "error", "error": str(e)}


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

    log.info(f"OCR da pagina {filename}")
    
    try:
        page_metrics = {}
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)

        # Convert the ocr_algorithm to the correct class
        ocr_algorithm = globals()["tesserOCR"]
        #ocr_algorithm = "tesserOCR"
        #ocr_algorithm = globals()[ocr_algorithm]

        log.info(ocr_algorithm)

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
            # Measure image load time
            load_start = time.time()
            image = Image.open(f"{path}/{filename}")
            load_time = time.time() - load_start
            page_metrics["image_load_time"] = load_time

            for item in [x for x in parsed_json if x["type"] == "remove"]:
                for sq in item["squares"]:
                    left = sq["left"]
                    top = sq["top"]
                    right = sq["right"]
                    bottom = sq["bottom"]

                    box_coords = ((left, top), (right, bottom))
                    img_draw = ImageDraw.Draw(image)
                    img_draw.rectangle(box_coords, fill="white")

            # Perform OCR
            ocr_start = time.time()
            json_d = ocr_algorithm.get_structure(image, config)
            ocr_time = time.time() - ocr_start
            page_metrics["ocr_time"] = ocr_time
            json_d = [[x] for x in json_d]
            # Save results
            save_start = time.time()
            with open(f"{path}/ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(json_d, f, indent=2, ensure_ascii=False)
            save_time = time.time() - save_start
            page_metrics["save_time"] = save_time
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
                        cropped_image.save(f"{path}/images/page{page_id}_{id+1}.png")


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
                #Perform OCR
                ocr_start = time.time()
                json_d = ocr_algorithm.get_structure(image, config, box)
                ocr_time = time.time() - ocr_start
                page_metrics["ocr_time"] = ocr_time
                if json_d:
                    all_jsons.append(json_d)

            page_json = []
            for sublist in all_jsons:
                page_json.append(sublist)
            
            # Save results
            save_start = time.time()
            with open(f"{path}/ocr_results/{get_file_basename(filename)}.json", "w", encoding="utf-8") as f:
                json.dump(page_json, f, indent=2, ensure_ascii=False)
            save_time = time.time() - save_start
            page_metrics["save_time"] = save_time

        files = os.listdir(f"{path}/ocr_results")

        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["progress"] = len(files)
        update_data(data_folder, data)
        
        time.sleep(0.4)
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

            #success = get_ner_file(path)
            """if success:
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
"""

            update_data(data_folder, data)

        return {"status": "success", "metricas": page_metrics}

    except Exception as e:
        print(e)
        
        traceback.print_exc()

        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in performing a page's OCR for file at {path}: {e}")

        return {"status": "error", "metricas": page_metrics}