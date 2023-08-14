import json
import logging
import os
import random
import shutil
import string

from threading import Lock, Thread

from flask import request
from flask import send_file

from src.elastic_search import *
from src.evaluate import evaluate
from src.utils.export import export_file
from src.utils.image import parse_images
from src.utils.file import delete_structure
from src.utils.file import fix_ocr
from src.utils.file import generate_uuid
from src.utils.file import get_current_time
from src.utils.file import get_data
from src.utils.file import get_file_basename
from src.utils.file import get_file_extension
from src.utils.file import get_file_parsed
from src.utils.file import get_filesystem
from src.utils.file import get_page_count
from src.utils.file import get_size
from src.utils.file import get_folder_info
from src.utils.file import get_structure_info
from src.utils.file import json_to_text
from src.utils.file import update_data
from src.utils.file import get_file_layouts
from src.utils.file import save_file_layouts

from src.utils.system import get_free_space
from src.utils.system import get_logs
from src.utils.system import get_private_sessions

from celery_app import *

es = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)
logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s : %(message)s')

log = app.logger

lock_system = dict()
private_sessions = dict()

#####################################
# FILE SYSTEM ROUTES
#####################################

@app.route("/files", methods=["GET"])
def get_file_system():
    if "path" not in request.values:
        return get_filesystem("files")
    
    path = request.values["path"].split("/")[0]
    print(path)

    return get_filesystem(path)


@app.route("/info", methods=["GET"])
def get_info():
    if "path" not in request.values:
        return get_filesystem("files")
    
    path = request.values["path"].split("/")[0]
    return {"info": get_structure_info(path)}


@app.route("/system-info", methods=["GET"])
def get_system_info():
    free_space, free_space_percentage = get_free_space()
    return {
        "free_space": free_space,
        "free_space_percentage": free_space_percentage,
        "logs": get_logs(),
        "private_sessions": get_private_sessions(),
    }


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
                "creation": get_current_time(),
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

@app.route("/get_csv", methods=["GET"])
def get_csv():
    path = request.values["path"]
    return send_file(f"{path}/_index.csv")

@app.route("/get_original", methods=["GET"])
def get_original():
    path = request.values["path"]
    file = path + "/" + path.split("/")[-1]
    return send_file(file)

@app.route("/delete-path", methods=["POST"])
def delete_path():
    data = request.json
    path = data["path"] 

    delete_structure(es, path)
    shutil.rmtree(path)

    session = path.split("/")[0]

    return {
        "success": True,
        "message": "Apagado com sucesso",
        "files": get_filesystem(session),
    }

@app.route("/delete-private-session", methods=["POST"])
def delete_private_session():
    data = request.json
    session_id = data["sessionId"]

    shutil.rmtree(session_id)
    if session_id in private_sessions:
        del private_sessions[session_id]

    return {
        "success": True,
        "message": "Apagado com sucesso",
        "private_sessions": get_private_sessions(),
    }

@app.route("/set-upload-stuck", methods=["POST"])
def set_upload_stuck():
    data = request.json
    path = data["path"]

    session = path.split("/")[0]

    data = get_data(f"{path}/_data.json")
    data["upload_stuck"] = True
    update_data(f"{path}/_data.json", data)

    return {
        "success": True,
        "message": "O upload do ficheiro falhou",
        "files": get_filesystem(session),
    }

#####################################
# FILES ROUTES
#####################################
def is_filename_reserved(path, filename):
    """
    Check if a filename is reserved
    A filename can be reserved if:
        - It is a folder
        - It is a file that is being processed

    :param path: path to the file
    :param filename: filename to check

    :return: True if reserved, False otherwise
    """
    for f in os.listdir(path):
        # If f is a folder
        if not os.path.isdir(f"{path}/{f}"): continue
        if f == filename: return True

        data = get_data(f"{path}/{f}/_data.json")
        if "original_filename" in data and data["original_filename"] == filename:
            return True
        
    return False


def find_valid_filename(path, basename, extension):
    """
    Find valid name for a file so it doesn't overwrite another file

    :param path: path to the file
    :param basename: basename of the file
    :param extension: extension of the file

    :return: valid filename
    """
    id = 1
    while is_filename_reserved(path, f"{basename} ({id}).{extension}"):
        id += 1

    return f"{basename} ({id}).{extension}"

@app.route("/prepare-upload", methods=["POST"])
def prepare_upload():
    data = request.json
    path = data["path"] 
    filename = data["name"]

    session = path.split("/")[0]

    if is_filename_reserved(path, filename):
        basename = get_file_basename(filename)
        extension = get_file_extension(filename)
        filename = find_valid_filename(path, basename, extension)

    os.mkdir(f"{path}/{filename}")
    with open(f"{path}/{filename}/_data.json", "w") as f:
        json.dump(
            {
                "type": "file",
                "progress": 0.00,
                "creation": get_current_time(),
            },
            f,
        )
    return {"success": True, "filesystem": get_filesystem(session), "filename": filename}

def join_chunks(path, filename, total_count, complete_filename):
    # Save the file
    with open(f"{path}/{filename}/{filename}", "wb") as f:
        for i in range(total_count):
            with open(f"pending-files/{complete_filename}/{i+1}", "rb") as chunk:
                f.write(chunk.read())

    update_data(f"{path}/{filename}/_data.json", {
        "pages": get_page_count(f"{path}/{filename}/{filename}"),
        "progress": True
    })

    shutil.rmtree(f"pending-files/{complete_filename}")

    log.info(f"Finished uploading file {filename}")

@app.route("/upload-file", methods=["POST"])
def upload_file():
    file = request.files["file"]
    path = request.form["path"]
    filename = request.form["name"]
    counter = int(request.form["counter"])
    total_count = int(request.form["totalCount"])

    complete_filename = path.replace("/", "_") + "_" + filename

    # If only one chunk, save the file directly
    if total_count == 1:
        file.save(f"{path}/{filename}/{filename}")

        with open(f"{path}/{filename}/_data.json", "w") as f:
            json.dump({
                "type": "file",
                "pages": get_page_count(f"{path}/{filename}/{filename}"),
                "creation": get_current_time()
            }, f)

        return {"success": True, "finished": True, "info": get_folder_info(f"{path}/{filename}")}

    # Create a Lock to process the file
    if complete_filename not in lock_system:
        lock_system[complete_filename] = Lock()

    # If multiple chunks, save the chunk and wait for the other chunks
    file = file.read()

    # Create the folder to save the chunks
    if not os.path.exists(f"pending-files/{complete_filename}"):
        os.mkdir(f"pending-files/{complete_filename}")

    with lock_system[complete_filename]:
        # Save the chunk
        with open(f"pending-files/{complete_filename}/{counter}", "wb") as f:
            f.write(file)

        # Number of chunks saved
        chunks_saved = len(os.listdir(f"pending-files/{complete_filename}"))
        progress = round(100 * chunks_saved/total_count, 2)

        log.info(f"Uploading file {filename} ({counter}/{total_count}) - {progress}%")

        update_data(f"{path}/{filename}/_data.json", {"progress": progress})

        if chunks_saved == total_count:
            del lock_system[complete_filename]

            Thread(
                target=join_chunks,
                args=(path, filename, total_count, complete_filename)
            ).start()

            return {"success": True, "finished": True, "info": get_folder_info(f"{path}/{filename}")}

    return {"success": True, "finished": False, "info": get_folder_info(f"{path}/{filename}")}


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

    session = path.split("/")[0]

    ocr_algorithm = "tesseract"

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
        data["ocr"]["progress"] = 0
        data["txt"] = {}
        data["txt"]["complete"] = False
        data["pdf"] = {}
        data["pdf"]["complete"] = False
        data["csv"] = {}
        data["csv"]["complete"] = False
        update_data(f"{f}/_data.json", data)

        task_file_ocr.delay(f, config, ocr_algorithm)

    return {
        "success": True,
        "message": "O OCR começou, por favor aguarde",
        "files": get_filesystem(session),
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

    session = path.split("/")[0]

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
            "files": get_filesystem(session),
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

    session = path.split("/")[0]

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
            "files": get_filesystem(session),
        }


@app.route("/submit-text", methods=["POST"])
def submit_text():
    texts = request.json[
        "text"
    ]  # estrutura com texto, nome do ficheiro e url da imagem

    data_folder = "/".join(texts[0]["original_file"].split("/")[:-2])
    data = get_data(data_folder + "/_data.json")

    session = data_folder.split("/")[0]

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

    make_changes.delay(data_folder, data)

    return {"success": True, "files": get_filesystem(session)}


#####################################
# ELASTICSEARCH
#####################################
@app.route("/get_elasticsearch", methods=["GET"])
def get_elasticsearch():
    return es.get_docs()

#####################################
# PRIVATE SESSIONS
#####################################
@app.route("/create-private-session", methods=["GET"])
def create_private_session():
    session_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    private_sessions[session_id] = {}

    os.mkdir(session_id)

    return {"success": True, "sessionId": session_id}

@app.route('/validate-private-session', methods=['POST'])
def validate_private_session():
    data = request.json
    session_id = data["sessionId"]
    
    if session_id in private_sessions:
        response = {"success": True, "valid": True}
    else:
        response = {"success": True, "valid": False}

    return response

#####################################
# LAYOUTS
#####################################
@app.route("/get-layouts", methods=["GET"])
def get_layouts():
    path = request.values["path"]
    return {"layouts": get_file_layouts(path)}

@app.route("/save-layouts", methods=["POST"])
def save_layouts():
    data = request.json
    path = data["path"]
    layouts = data["layouts"]

    save_file_layouts(path, layouts)

    return {"success": True}

@app.route("/generate-automatic-layouts", methods=["GET"])
def generate_automatic_layouts():
    path = request.values["path"]
    parse_images(path)
    return {"layouts": get_file_layouts(path)}

#####################################
# JOB QUEUES
#####################################
if not os.path.exists("./files/"):
    os.mkdir("./files/")

if not os.path.exists("./pending-files/"):
    os.mkdir("./pending-files/")

# app.config['DEBUG'] = os.environ.get('DEBUG', False)
# app.run(port=5001, threaded=True)
app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)
