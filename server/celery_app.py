import json
import logging as log
import os
import shutil
import tempfile
import traceback
import zipfile
from datetime import datetime
from io import BytesIO

import pypdfium2 as pdfium
from celery import Celery
from celery import chord
from celery import group
from celery.canvas import Signature
from celery.schedules import crontab
from PIL import Image
from PIL import ImageDraw
from redbeat import RedBeatSchedulerEntry
from src.engines import ocr_pytesseract
from src.engines import ocr_tesserocr
from src.utils.export import export_csv
from src.utils.export import export_file
from src.utils.export import export_from_existing
from src.utils.export import load_invisible_font
from src.utils.file import ALLOWED_EXTENSIONS
from src.utils.file import generate_random_uuid
from src.utils.file import get_current_time
from src.utils.file import get_data
from src.utils.file import get_doc_len
from src.utils.file import get_file_basename
from src.utils.file import get_ner_file
from src.utils.file import get_ocr_size
from src.utils.file import get_page_count
from src.utils.file import get_size
from src.utils.file import PRIVATE_PATH
from src.utils.file import TIMEZONE
from src.utils.file import update_json_file
from src.utils.image import parse_images

OCR_ENGINES = (
    "pytesseract",
    "tesserocr",
)

DEFAULT_CONFIG_FILE = os.environ.get("DEFAULT_CONFIG_FILE", "_configs/default.json")

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

celery = Celery("celery_app", backend=CELERY_RESULT_BACKEND, broker=CELERY_BROKER_URL)

# celery.conf.beat_max_loop_interval = 30  # in seconds; default 5 seconds or 5 minutes depending on task schedule

load_invisible_font()


@celery.task(name="auto_segment")
def task_auto_segment(path):
    return parse_images(path)


@celery.task(name="export_file")
def task_export(path, filetype, delimiter=False, force_recreate=False, simple=False):
    return export_file(path, filetype, delimiter, force_recreate, simple)


@celery.task(name="make_changes")
def task_make_changes(path, data):
    export_folder = path + "/_export"
    created_time = get_current_time()

    if data["txt"]["complete"]:
        export_file(path, "txt", force_recreate=True)
        data["txt"] = {
            "complete": True,
            "size": get_size(export_folder + "/_txt.txt", path_complete=True),
            "creation": created_time,
        }

    if data["txt_delimited"]["complete"]:
        export_file(path, "txt", delimiter=True, force_recreate=True)
        data["txt_delimited"] = {
            "complete": True,
            "size": get_size(export_folder + "/_txt_delimited.txt", path_complete=True),
            "creation": created_time,
        }

    if data["pdf_indexed"]["complete"]:
        recreate_csv = data["csv"]["complete"]
        os.remove(export_folder + "/_pdf_indexed.pdf")
        export_file(path, "pdf", force_recreate=True, get_csv=recreate_csv)
        data["pdf_indexed"] = {
            "complete": True,
            "size": get_size(export_folder + "/_pdf_indexed.pdf", path_complete=True),
            "creation": created_time,
        }

    if data["pdf"]["complete"]:
        recreate_csv = data["csv"]["complete"] and not data["pdf_indexed"]["complete"]
        os.remove(export_folder + "/_pdf.pdf")
        export_file(path, "pdf", force_recreate=True, simple=True, get_csv=recreate_csv)
        data["pdf"] = {
            "complete": True,
            "size": get_size(export_folder + "/_pdf.pdf", path_complete=True),
            "creation": created_time,
        }

    if data["csv"]["complete"] and not (
        data["pdf_indexed"]["complete"] or data["pdf"]["complete"]
    ):
        export_csv(path, force_recreate=True)

    if data["csv"]["complete"]:
        data["csv"] = {
            "complete": True,
            "size": get_size(export_folder + "/_index.csv", path_complete=True),
            "creation": created_time,
        }

    try:
        task_request_ner(path)
    except Exception as e:
        print(e)
        data["ner"] = {"complete": False, "error": True}

    update_json_file(path + "/_data.json", data)
    return {"status": "success"}


@celery.task(name="count_doc_pages")
def task_count_doc_pages(path: str, extension: str):
    """
    Updates the metadata of the document at the given path with its page count.
    :param path: the document's path
    :param extension: the document's extension
    """
    update_json_file(
        f"{path}/_data.json",
        {
            "pages": get_page_count(path, extension),
            "stored": True,
            "creation": get_current_time(),
        },
    )


@celery.task(name="ocr_from_api")
def task_perform_direct_ocr(
    path: str, config: dict | None, delete_on_finish: bool = False
):
    async_ocr = task_file_ocr.si(
        path=path, config=config, delete_on_finish=delete_on_finish
    )
    task_prepare_file_ocr(path=path, callback=async_ocr)


@celery.task(name="prepare_file")
def task_prepare_file_ocr(path: str, callback: Signature | None = None):
    try:
        log.debug(f"Creating {path}/_pages")
        if not os.path.exists(f"{path}/_pages"):
            os.mkdir(f"{path}/_pages")

        data = get_data(f"{path}/_data.json")
        extension = data["extension"]

        basename = get_file_basename(path)

        log.debug(f"Path: {path}")
        log.debug(f"Extensao: {extension}")
        log.debug(f"Basename: {basename}")
        log.debug(f"{path}: A preparar páginas")

        if extension == "pdf":
            pdf = pdfium.PdfDocument(f"{path}/{basename}.pdf")
            num_pages = len(pdf)
            pdf.close()

            pdf_prep_callback = task_count_doc_pages.si(
                path=path, extension=extension
            ).set(link=callback)
            chord(
                task_extract_pdf_page.si(path, basename, i) for i in range(num_pages)
            )(pdf_prep_callback)

        elif extension == "zip":
            temp_folder_name = f"{path}/{generate_random_uuid()}"
            os.mkdir(temp_folder_name)

            with zipfile.ZipFile(f"{path}/{basename}.zip", "r") as zip_ref:
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
                im.save(
                    f"{path}/_pages/{basename}_{i}.png", format="PNG"
                )  # using PNG to keep RGBA
            shutil.rmtree(temp_folder_name)
            task_count_doc_pages(path=path, extension=extension)
            if callback is not None:
                callback.apply_async()

        elif extension in ALLOWED_EXTENSIONS:  # some other than pdf
            original_path = f"{path}/{basename}.{extension}"
            link_path = f"{path}/_pages/{basename}_0.{extension}"
            if not os.path.exists(link_path):
                os.link(original_path, link_path)
            task_count_doc_pages(path=path, extension=extension)
            if callback is not None:
                callback.apply_async()

        else:
            raise FileNotFoundError("No file with a valid extension was found")

    except Exception as e:
        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["exceptions"] = str(e)
        update_json_file(data_folder, data)
        log.error(f"Error in preparing OCR for file at {path}: {e}")
        raise e


@celery.task(name="request_ner")
def task_request_ner(path):
    data = get_data(path + "/_data.json")

    success = get_ner_file(path)
    creation_date = get_current_time()
    if success:
        data["ner"] = {
            "complete": True,
            "size": get_size(f"{path}/_export/_entities.json", path_complete=True),
            "creation": creation_date,
        }
    else:
        data["ner"] = {"complete": False, "error": True}

    update_json_file(path + "/_data.json", data)


@celery.task(name="file_ocr")
def task_file_ocr(
    path: str, config: dict | str | None = None, delete_on_finish: bool = False
):
    """
    Prepare the OCR of a file
    :param path: path to the file
    :param config: config to use
    :param delete_on_finish: whether the original file and pages should be deleted after processing, keeping only the results
    """
    data_folder = f"{path}/_data.json"
    try:
        with open(DEFAULT_CONFIG_FILE) as f:
            default_config = json.load(f)

        if config is None or isinstance(config, str) and config == "default":
            config = default_config
        else:
            # Build string with Tesseract run configuration
            if "engine" in config:
                if config["engine"].lower() not in OCR_ENGINES:
                    raise ValueError(
                        f"Invalid OCR engine value; possible values are {OCR_ENGINES}",
                        config["engine"],
                    )
            else:
                config["engine"] = default_config["engine"]
            if "lang" not in config:
                config["lang"] = default_config["lang"]
            if "engineMode" not in config:
                config["engineMode"] = default_config["engineMode"]
            if "segmentMode" not in config:
                config["segmentMode"] = default_config["segmentMode"]
            if "thresholdMethod" not in config:
                config["thresholdMethod"] = default_config["thresholdMethod"]
            if "outputs" not in config:
                config["outputs"] = default_config["outputs"]

            if "dpi" not in config and "dpi" in default_config:
                config["dpi"] = default_config["dpi"]
            if "otherParams" not in config and "otherParams" in default_config:
                config["otherParams"] = default_config["otherParams"]

        # ensure other params are defined as a dict of names to values
        other_params = config.get("otherParams", None)
        if (
            other_params is not None
            and not isinstance(other_params, dict)
            and isinstance(other_params, str)
        ):
            other_params_dict = {}
            for param in other_params.split(";"):
                n, v = param.split("=")
                other_params_dict[n.strip()] = v.strip()
            config["otherParams"] = other_params_dict

        # Verify parameter values
        ocr_engine = globals()[f'ocr_{config["engine"]}'.lower()]
        valid, errors = ocr_engine.verify_params(config)
        if not valid:
            data = get_data(data_folder)
            data["ocr"].update(
                {"progress": 0, "exceptions": {"Parâmetros inválidos:": errors}}
            )
            update_json_file(data_folder, data)
            log.error(
                f'Error in performing OCR for file at {path}: {data["ocr"]["exceptions"]}'
            )
            return {"status": "error", "errors": errors}

        # Update the information related to the OCR
        data = get_data(data_folder)
        data["ocr"] = {
            "config": config,
            "progress": 0,
        }
        update_json_file(data_folder, data)

        # Build config according to specified engine
        lang, config_formatted = ocr_engine.build_ocr_config(config)

        # Generate the images
        """
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
        """

        if not os.path.exists(f"{path}/_ocr_results"):
            os.mkdir(f"{path}/_ocr_results")
        if not os.path.exists(f"{path}/_export"):
            os.mkdir(f"{path}/_export")

        # This should not be necessary as images for OCR are extracted on document upload
        # task_prepare_file_ocr(path)

        pages_path = f"{path}/_pages"
        images = sorted([x for x in os.listdir(pages_path)])

        if not images:
            raise FileNotFoundError("Page folder is empty")

        log.debug(f"{path}: A começar OCR")

        tasks = group(
            task_page_ocr.s(
                path=path,
                filename=image,
                ocr_engine_name=f'ocr_{config["engine"]}',
                lang=lang,
                config=config_formatted,
                output_types=config["outputs"],
                delete_on_finish=delete_on_finish,
            )
            for image in images
        )
        tasks.apply_async()

        return {"status": "success"}

    except Exception as e:
        data = get_data(data_folder)
        data["ocr"]["exceptions"] = str(e)
        update_json_file(data_folder, data)
        log.error(f"Error in performing OCR for file at {path}: {e}")

        return {"status": "error"}


@celery.task(name="extract_pdf_page")
def task_extract_pdf_page(path, basename, i):
    #
    # Extracts a single PDF page and saves it as a PNG file.
    # This runs on separate Celery workers for parallelization.
    #
    try:
        pdf = pdfium.PdfDocument(f"{path}/{basename}.pdf")
        page = pdf[i]
        bitmap = page.render(
            300 / 72
        )  # You can adjust DPI here (e.g., 150 / 72 for smaller files)
        pdf.close()
        pil_image = bitmap.to_pil()
        output_path = f"{path}/_pages/{basename}_{i}.png"

        # Use BytesIO for buffered I/O
        buffer = BytesIO()
        pil_image.save(buffer, format="PNG", compress_level=6)
        buffer.seek(0)

        # Use temporary file for atomic write
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png", dir=path) as temp:
            temp.write(buffer.getvalue())

        # Atomically move the temporary file to the final location
        shutil.move(temp.name, output_path)

        # Ensure file read access permissions are set
        os.chmod(output_path, 0o644)  # rw-r--r--

        # Verify the PNG to ensure it’s not truncated
        try:
            with Image.open(output_path) as img:
                img.load()  # Force load to check for truncation
            log.debug(
                f"Verified page {i} from {basename}.pdf is valid (size: {os.path.getsize(output_path)} bytes)"
            )
        except Exception as e:
            log.error(f"Invalid PNG generated for page {i}: {e}")
            os.remove(output_path)  # Remove truncated file
            raise

        log.debug(f"Extracted page {i} from {basename}.pdf")

    except Exception as e:
        log.error(f"Error extracting page {i} from {basename}.pdf: {e}")


"""
@celery.task(name="ocr_complete")
def task_ocr_complete(results, path, start_time, initial_metrics):
    #
    # Callback task executed after all OCR tasks for a PDF are complete.
    # Calculates the total processing time.
    #
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
"""


@celery.task(name="page_ocr")
def task_page_ocr(
    path: str,
    filename: str,
    ocr_engine_name: str,
    lang: str,
    output_types: list[str],
    config: str | dict | None = None,
    delete_on_finish: bool = False,
):
    """
    Perform the page OCR

    :param path: path to the file
    :param filename: filename of the page
    :param ocr_engine_name: name of the OCR module to use
    :param lang: string of languages to use
    :param config: config to use
    :param output_types: output types to generate directly, if the file is a single page without user-defined text boxes
    :param delete_on_finish: whether the original file and pages should be deleted on finish, keeping only the results
    """
    data_file = f"{path}/_data.json"
    try:
        if filename.split(".")[0][-1] == "$":
            return None

        # hacky way of aborting if another task_page_ocr previously raised an error
        if "exceptions" in get_data(data_file)["ocr"]:
            return {"status": "aborted"}

        n_doc_pages = get_doc_len(data_file)
        raw_results = None

        """
        page_metrics = {}
        """

        # Convert the ocr_algorithm to the correct class
        ocr_engine = globals()[ocr_engine_name.lower()]

        layout_path = f"{path}/_layouts/{get_file_basename(filename)}.json"

        parsed_json = []
        text_groups = []
        image_groups = []
        ignore_groups = []
        if os.path.exists(layout_path):
            with open(layout_path, encoding="utf-8") as json_file:
                parsed_json = json.load(json_file)

        for item in parsed_json:
            area_type = item["type"]
            if area_type == "text":
                text_groups.append(item)
            elif area_type == "image":
                image_groups.append(item)
            elif area_type == "remove":
                ignore_groups.append(item)

        image_filename = f"{path}/_pages/{filename}"
        image = None

        # extract images, if any selected
        if image_groups:
            image = Image.open(image_filename)

            if not os.path.exists(f"{path}/_images"):
                os.mkdir(f"{path}/_images")

            basename = get_file_basename(filename)
            page_number = int(basename.split("_")[-1]) + 1

            for item_id, item in enumerate(image_groups):
                for sq in item["squares"]:
                    left = sq["left"]
                    top = sq["top"]
                    right = sq["right"]
                    bottom = sq["bottom"]

                    box_coords = (left, top, right, bottom)
                    cropped_image = image.crop(box_coords)
                    cropped_image.save(
                        f"{path}/_images/page{page_number}_{item_id + 1}.{filename.split('.')[-1].lower()}"
                    )

        # cover ignored segments, if any selected
        if ignore_groups:
            if image is None:
                image = Image.open(image_filename)

            img_draw = ImageDraw.Draw(image)
            for item in ignore_groups:
                for sq in item["squares"]:
                    box_coords = ((sq["left"], sq["top"]), (sq["right"], sq["bottom"]))
                    img_draw.rectangle(box_coords, fill="white")

        box_coordinates_list = []
        for item in text_groups:
            for sq in item["squares"]:
                left = sq["left"]
                top = sq["top"]
                right = sq["right"]
                bottom = sq["bottom"]

                box_coords = (left, top, right, bottom)
                box_coordinates_list.append(box_coords)

        page_json = []
        if box_coordinates_list:
            if image is None:
                image = Image.open(image_filename)
            # Must OCR each text box. raw_results received but not expected, as currently can only be done with full page

            if ocr_engine_name.lower() == "ocr_tesserocr":
                # TesserOCR can load an image once and OCR multiple segments within it
                page_json, raw_results = ocr_engine.get_structure(
                    page=image,
                    lang=lang,
                    config=config,
                    doc_path=path,
                    segment_box=box_coordinates_list,
                )
            else:
                all_jsons = []
                # Get JSON result for each box and append to final list
                for box in box_coordinates_list:
                    box_json, raw_results = ocr_engine.get_structure(
                        page=image,
                        lang=lang,
                        config=config,
                        doc_path=path,
                        segment_box=box,
                    )
                    if box_json:
                        all_jsons.append(box_json)

                for sublist in all_jsons:
                    page_json.append(sublist)
        else:
            # OCR entire page, may have covered ignored areas

            if (
                n_doc_pages == 1
                and not ignore_groups
                and ocr_engine_name.lower() == "ocr_tesserocr"
            ):
                # TesserOCR needs stored file to generate direct results
                # Use original filename if no ignored areas were covered in memory, else memory data will be stored in /tmp
                image = image_filename
            elif image is None:
                image = Image.open(image_filename)

            json_results, raw_results = ocr_engine.get_structure(
                page=image,
                lang=lang,
                config=config,
                doc_path=path,
                output_types=output_types,
                # If single-page document, take advantage of output types to immediately generate results with Tesseract
                single_page=n_doc_pages == 1,
            )
            page_json = [[x] for x in json_results]

        # Store formatted OCR output for the page in JSON
        with open(
            f"{path}/_ocr_results/{get_file_basename(filename)}.json",
            "w",
            encoding="utf-8",
        ) as f:
            json.dump(page_json, f, indent=2, ensure_ascii=False)

        # Performed OCR of page, update data
        files = os.listdir(f"{path}/_ocr_results")

        data = get_data(data_file)
        data["ocr"]["progress"] = len(files)
        update_json_file(data_file, data)

        # If last page has been processed, generate results
        if len(files) == n_doc_pages:
            # If single-page document, directly store results generated by Tesseract
            if n_doc_pages == 1 and raw_results:
                export_from_existing(path, raw_results, output_types)

            finish_ocr_data = {
                "ocr": {
                    "progress": len(files),
                    "size": get_ocr_size(f"{path}/_ocr_results"),
                    "creation": get_current_time(),
                }
            }

            update_json_file(data_file, finish_ocr_data)

            if delete_on_finish:
                callback = task_delete_file.si(
                    path=f"{path}/{get_file_basename(path)}.{data['extension']}"
                )
                task_export_results.apply_async((path, output_types), link=callback)
            else:
                task_export_results.delay(path, output_types)

        return {"status": "success"}

    except Exception as e:
        traceback.print_exc()
        data = get_data(data_file)
        data["ocr"]["exceptions"] = str(e)
        update_json_file(data_file, data)
        log.error(f"Error in performing a page's OCR for file at {path}: {e}")

        return {"status": "error"}


@celery.task(name="export_results")
def task_export_results(path: str, output_types: list[str]):
    data_file = f"{path}/_data.json"
    data = get_data(data_file)

    try:
        if ("ner" in output_types or "txt" in output_types) and not data["txt"][
            "complete"
        ]:
            export_file(path, "txt")
            data["txt"] = {
                "complete": True,
                "size": get_size(f"{path}/_export/_txt.txt", path_complete=True),
                "creation": get_current_time(),
            }

        if "txt_delimited" in output_types and not data["txt_delimited"]["complete"]:
            export_file(path, "txt", delimiter=True)
            data["txt_delimited"] = {
                "complete": True,
                "size": get_size(
                    f"{path}/_export/_txt_delimited.txt", path_complete=True
                ),
                "creation": get_current_time(),
            }

        if os.path.exists(f"{path}/_images") and os.listdir(f"{path}/_images"):
            export_file(path, "imgs")
            data["zip"] = {
                "complete": True,
                "size": get_size(f"{path}/_export/_images.zip", path_complete=True),
                "creation": get_current_time(),
            }

        if "pdf_indexed" in output_types and not data["pdf_indexed"]["complete"]:
            export_file(path, "pdf", get_csv=("csv" in output_types))
            creation_time = get_current_time()
            data["pdf_indexed"] = {
                "complete": True,
                "size": get_size(
                    f"{path}/_export/_pdf_indexed.pdf", path_complete=True
                ),
                "creation": creation_time,
                "pages": get_page_count(path, "pdf") + 1,
            }
            if "csv" in output_types:
                # CSV exported as part of PDF export
                data["csv"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_export/_index.csv", path_complete=True),
                    "creation": creation_time,
                }

        if "pdf" in output_types and not data["pdf"]["complete"]:
            export_file(path, "pdf", simple=True, get_csv=("csv" in output_types))
            creation_time = get_current_time()
            data["pdf"] = {
                "complete": True,
                "size": get_size(f"{path}/_export/_pdf.pdf", path_complete=True),
                "creation": creation_time,
                "pages": get_page_count(path, "pdf"),
            }
            if "csv" in output_types:
                # CSV exported as part of PDF export
                data["csv"] = {
                    "complete": True,
                    "size": get_size(f"{path}/_export/_index.csv", path_complete=True),
                    "creation": creation_time,
                }

        if "csv" in output_types and not data["csv"]["complete"]:
            export_csv(path)
            data["csv"] = {
                "complete": True,
                "size": get_size(f"{path}/_export/_index.csv", path_complete=True),
                "creation": get_current_time(),
            }

        if "ner" in output_types:
            success = get_ner_file(path)
            if success:
                data["ner"] = {
                    "complete": True,
                    "size": get_size(
                        f"{path}/_export/_entities.json", path_complete=True
                    ),
                    "creation": get_current_time(),
                }
            else:
                data["ner"] = {"complete": False, "error": True}

        update_json_file(data_file, data)
        # return {"status": "success", "metricas": page_metrics}
        return {"status": "success"}
    except Exception as e:
        traceback.print_exc()
        data = get_data(data_file)
        data["ocr"]["exceptions"] = str(e)
        update_json_file(data_file, data)
        log.error(f"Error in exporting results for file at {path}: {e}")

        # return {"status": "error", "metricas": page_metrics}
        return {"status": "error"}


@celery.task(name="async_delete_file")
def task_delete_file(path: str):
    log.debug(f"Deleting {path}")
    os.remove(path)


#####################################
# SCHEDULED TASKS
#####################################
@celery.on_after_configure.connect
def setup_periodic_tasks(sender: Celery, **kwargs):
    # Clean up old private sessions daily at midnight
    entry = RedBeatSchedulerEntry(
        "cleanup_private_sessions",
        task_delete_old_private_sessions.s().task,
        crontab(minute="0", hour="0"),
        # args=["first", "second"], # example of sending args to task scheduled with redbeat
        app=celery,
    )
    entry.save()
    log.info(f"Created periodic task {entry}")


@celery.task(name="set_max_private_session_age")
def task_set_max_private_session_age(new_max_age: int | str):
    try:
        os.environ["MAX_PRIVATE_SESSION_AGE"] = str(int(new_max_age))
        return {"status": "success"}
    except ValueError:
        return {"status": "error"}


@celery.task(name="cleanup_private_sessions")
def task_delete_old_private_sessions():
    max_private_session_age = int(
        os.environ.get("MAX_PRIVATE_SESSION_AGE", "5")
    )  # days
    log.info(f"Deleting private sessions older than {max_private_session_age} days")

    priv_sessions = [f.path for f in os.scandir(f"./{PRIVATE_PATH}/") if f.is_dir()]
    n_deleted = 0
    for folder in priv_sessions:
        data = get_data(f"{folder}/_data.json")
        created_time = data["creation"]
        as_datetime = datetime.strptime(created_time, "%d/%m/%Y %H:%M:%S").astimezone(
            TIMEZONE
        )
        now = datetime.now().astimezone(TIMEZONE)
        log.debug(
            f"{folder} AGE: {(now - as_datetime).days} days. Older than 5? {(now - as_datetime).days > max_private_session_age}"
        )
        if (now - as_datetime).days > max_private_session_age:
            shutil.rmtree(folder)
            n_deleted += 1

    update_json_file(
        f"./{PRIVATE_PATH}/_data.json", {"last_cleanup": get_current_time()}
    )
    return f"{n_deleted} private session(s) deleted"
