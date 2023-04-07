import json
import os
import re
import shutil
from datetime import datetime
from threading import Lock

from flask import Flask
from flask import request
from flask import send_file
from flask_cors import CORS  # permitir requests de outros ips alem do servidor
from src.algorithms import tesseract
from src.algorithms import easy_ocr
from src.elastic_search import *
from src.evaluate import evaluate
from src.thread_pool import ThreadPool
from src.utils.export import export_file
from src.utils.file import delete_structure
from src.utils.file import fix_ocr
from src.utils.file import generate_uuid
from src.utils.file import get_data
from src.utils.file import get_file_basename
from src.utils.file import get_file_extension
from src.utils.file import get_file_parsed
from src.utils.file import get_filesystem
from src.utils.file import get_page_count
from src.utils.file import get_size
from src.utils.file import get_structure_info
from src.utils.file import json_to_text
from src.utils.file import perform_file_ocr
from src.utils.file import perform_page_ocr
from src.utils.file import update_data

es = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

app = Flask(__name__)   # Aplicação em si
log = app.logger
CORS(app)

lock_system = dict()

def make_changes(data_folder, data, pool: ThreadPool):
    current_date = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    export_file(data_folder, "txt")
    data["txt"]["complete"] = True
    data["txt"]["creation"] = current_date
    data["txt"]["size"] = get_size(data_folder + "/_text.txt", path_complete=True)

    update_data(data_folder + "/_data.json", data)

    export_file(data_folder, "pdf")
    data["pdf"]["complete"] = True
    data["pdf"]["creation"] = current_date
    data["pdf"]["size"] = get_size(data_folder + "/_search.pdf", path_complete=True)

    update_data(data_folder + "/_data.json", data)
    pool.update(finished=data_folder)


#####################################
# FILE SYSTEM ROUTES
#####################################
@app.route("/files", methods=["GET"])
def get_file_system():
    return get_filesystem("files")


@app.route("/info", methods=["GET"])
def get_info():
    return {"info": get_structure_info("files")}


@app.route("/create-folder", methods=["POST"])
def create_folder():
    data = request.json

    path = data["path"]
    folder = data["folder"]

    if os.path.exists(path + "/" + folder):
        return {"success": False, "error": "Já existe uma pasta com esse nome"}

    os.mkdir(path + "/" + folder)

    with open(f"{path}/{folder}/_data.json", "w") as f:
        json.dump(
            {
                "type": "folder",
                "creation": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            },
            f,
        )

    return {"success": True, "files": get_filesystem("files")}


@app.route("/get-file", methods=["GET"])
def get_file():
    path = request.values["path"]
    doc = get_file_parsed(path)
    return {"doc": doc}


@app.route("/get_txt", methods=["GET"])
def get_txt():
    path = request.values["path"]
    return send_file(f"{path}/_text.txt")


@app.route("/get_pdf", methods=["GET"])
def get_pdf():
    path = request.values["path"]
    file = export_file(path, "pdf")
    return send_file(file)


@app.route("/delete-path", methods=["POST"])
def delete_path():
    data = request.json
    path = data["path"] 

    delete_structure(es, path)
    shutil.rmtree(path)

    return {
        "success": True,
        "message": "Apagado com sucesso",
        "files": get_filesystem("files"),
    }


#####################################
# FILES ROUTES
#####################################
def find_valid_filename(path, basename, extension):
    """
    Find valid name for a file so it doesn't overwrite another file

    :param path: path to the file
    :param basename: basename of the file
    :param extension: extension of the file

    :return: valid filename
    """
    id = 1
    while os.path.exists(f"{path}/{basename} ({id}).{extension}"):
        id += 1

    return f"{basename} ({id}).{extension}"


@app.route("/upload-file", methods=["POST"])
def upload_file():
    file = request.files["file"]
    path = request.form["path"]
    filename = request.form["name"]
    fileID = request.form["fileID"]
    counter = int(request.form["counter"])
    total_count = int(request.form["totalCount"])

    log.info(f"Uploading file {filename} ({counter}/{total_count})")

    # If only one chunk, save the file directly
    if total_count == 1:
        if os.path.exists(f"{path}/{filename}"):
            basename = get_file_basename(filename)
            extension = get_file_extension(filename)
            filename = find_valid_filename(path, basename, extension)

        os.mkdir(f"{path}/{filename}")
        file.save(f"{path}/{filename}/{filename}")

        with open(f"{path}/{filename}/_data.json", "w") as f:
            json.dump({
                "type": "file",
                "pages": get_page_count(f"{path}/{filename}/{filename}"),
                "creation": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            }, f)

        return {"success": True, "finished": True, "filesystem": get_filesystem("files")}

    # If multiple chunks, save the chunk and wait for the other chunks
    file = file.read()

    # Create a Lock to process the file
    if fileID not in lock_system:
        lock_system[fileID] = Lock()

    # Create the folder to save the chunks
    if not os.path.exists(f"pending-files/{fileID}"):
        os.mkdir(f"pending-files/{fileID}")

    # Save the chunk
    with open(f"pending-files/{fileID}/{counter}", "wb") as f:
        f.write(file)

    with lock_system[fileID]:
        # Number of chunks saved
        chunks_saved = len(os.listdir(f"pending-files/{fileID}"))
        if chunks_saved == total_count:
            del lock_system[fileID]

            if os.path.exists(f"{path}/{filename}"):
                filename = find_valid_filename(path, filename, filename.split(".")[-1])

            os.mkdir(f"{path}/{filename}")

            # Save the file
            with open(f"{path}/{filename}/{filename}", "wb") as f:
                for i in range(total_count):
                    with open(f"pending-files/{fileID}/{i+1}", "rb") as chunk:
                        f.write(chunk.read())

            with open(f"{path}/{filename}/_data.json", "w") as f:
                json.dump({
                    "type": "file",
                    "pages": get_page_count(f"{path}/{filename}/{filename}"),
                    "creation": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
                }, f)

            shutil.rmtree(f"pending-files/{fileID}")

            log.info(f"Finished uploading file {filename}")

            return {"success": True, "finished": True, "filesystem": get_filesystem("files")}

    return {"success": True, "finished": False}


@app.route("/perform-ocr", methods=["POST"])
def perform_ocr():
    """
    Request to perform OCR on a file/folder
    @param path: path to the file/folder
    @param algorithm: algorithm to be used
    @param data: data to be used
    @param multiple: if it is a folder or not
    """

    data = request.json
    path = data["path"]
    algorithm = data["algorithm"]
    config = data["config"]
    multiple = data["multiple"]

    ocr_algorithm = tesseract

    if multiple:
        files = [
            f"{path}/{f}"
            for f in os.listdir(path)
            if os.path.isdir(os.path.join(path, f))
        ]
    else:
        files = [path]

    for f in files:
        # Delete previous results
        if os.path.exists(f"{f}/ocr_results"):
            shutil.rmtree(f"{f}/ocr_results")
        os.mkdir(f"{f}/ocr_results")

        # Update the information related to the OCR
        data = get_data(f"{f}/_data.json")
        data["ocr"] = {}
        data["ocr"]["algorithm"] = algorithm
        data["ocr"]["config"] = "_".join(config)
        data["ocr"]["complete"] = False
        data["txt"] = {}
        data["txt"]["complete"] = False
        data["pdf"] = {}
        data["pdf"]["complete"] = False
        update_data(f"{f}/_data.json", data)

        docs_pool.add_to_queue((f, config, ocr_algorithm, pages_pool))

    return {
        "success": True,
        "message": "O OCR começou, por favor aguarde",
        "files": get_filesystem("files"),
    }


@app.route("/index-doc", methods=["POST"])
def index_doc():
    """
    Index a document in Elasticsearch
    @param path: path to the document
    @param multiple: if it is a folder or not
    """
    data = request.json
    path = data["path"]
    multiple = data["multiple"]

    if multiple:
        pass

        return {}
    else:
        hOCR_path = path + "/ocr_results"
        ocr_config = get_data(path + "/_data.json")
        files = sorted([f for f in os.listdir(hOCR_path) if f.endswith(".json")])

        for id, file in enumerate(files):
            file_path = f"{hOCR_path}/{file}"

            with open(file_path) as f:
                hocr = json.load(f)
                text = json_to_text(hocr)

            if ocr_config["pages"] > 1:
                doc = create_document(
                    file_path,
                    ocr_config["ocr"]["algorithm"],
                    ocr_config["ocr"]["config"],
                    text,
                    id + 1,
                )
            else:
                doc = create_document(
                    file_path,
                    ocr_config["ocr"]["algorithm"],
                    ocr_config["ocr"]["config"],
                    text,
                )

            id = generate_uuid(file_path)

            es.add_document(id, doc)

        update_data(path + "/_data.json", {"indexed": True})

        return {
            "success": True,
            "message": "Documento indexado",
            "files": get_filesystem("files"),
        }


@app.route("/remove-index-doc", methods=["POST"])
def remove_index_doc():
    """
    Remove a document in Elasticsearch
    @param path: path to the document
    @param multiple: if it is a folder or not
    """
    data = request.json
    path = data["path"]
    multiple = data["multiple"]

    if multiple:
        pass

        return {}
    else:
        hOCR_path = path + "/ocr_results"
        # config = get_data("/".join(path.split("/")[:-1]) + "/_data.json")
        files = [f for f in os.listdir(hOCR_path) if f.endswith(".json")]

        for f in files:
            file_path = f"{hOCR_path}/{f}"
            id = generate_uuid(file_path)
            es.delete_document(id)

        update_data(path + "/_data.json", {"indexed": False})

        return {
            "success": True,
            "message": "Documento removido",
            "files": get_filesystem("files"),
        }


@app.route("/submit-text", methods=["POST"])
def submit_text():
    texts = request.json[
        "text"
    ]  # estrutura com texto, nome do ficheiro e url da imagem

    data_folder = "/".join(texts[0]["original_file"].split("/")[:-2])
    data = get_data(data_folder + "/_data.json")

    for t in texts:
        text = t["content"]
        filename = t["original_file"]

        with open(filename, encoding="utf-8") as f:
            hocr = json.load(f)
            words = [[x["text"] for x in l] for l in hocr]

        try:
            new_hocr = fix_ocr(words, text)
        except:  # noqa: E722
            return {
                "success": False,
                "error": "Ocorreu um erro inesperado enquanto corrigiamos o texto, por favor informem-nos",
            }

        for l_id, l in enumerate(new_hocr):
            for w_id, w in enumerate(l):
                hocr[l_id][w_id]["text"] = w

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(hocr, f, indent=2)

        if data["indexed"]:
            id = generate_uuid(filename)
            es.update_document(id, text)

    update_data(
        data_folder + "/_data.json",
        {"txt": {"complete": False}, "pdf": {"complete": False}},
    )

    changes_pool.add_to_queue(data_folder, data)

    return {"success": True, "files": get_filesystem("files")}


#####################################
# ELASTICSEARCH
#####################################
@app.route("/get_elasticsearch", methods=["GET"])
def get_elasticsearch():
    return es.get_docs()


#####################################
# JOB QUEUES
#####################################
if not os.path.exists("./files/"):
    os.mkdir("./files/")

if not os.path.exists("./pending-files/"):
    os.mkdir("./pending-files/")

docs_pool = ThreadPool(perform_file_ocr, 2)
changes_pool = ThreadPool(make_changes, 1)
pages_pool = ThreadPool(perform_page_ocr, 4)

# app.config['DEBUG'] = os.environ.get('DEBUG', False)
# app.run(port=5001, threaded=True)
app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)
