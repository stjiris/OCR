import json
import os
import random
import shutil
import string
from http import HTTPStatus

from threading import Lock, Thread

import flask_wtf
import requests
from celery import Celery
from dotenv import load_dotenv
from flask import Flask
from flask import Response
from flask import abort
from flask import jsonify
from flask import request
from flask import send_file
from flask_cors import CORS
from flask_login import current_user
from flask_mailman import Mail
from flask_security import auth_required
from flask_security import hash_password
from flask_security import roles_required
from flask_security import Security
from flask_security import SQLAlchemyUserDatastore
from flask_security.models import fsqla_v3 as fsqla
from flask_sqlalchemy import SQLAlchemy
from redbeat import RedBeatSchedulerEntry
from redbeat.schedulers import RedBeatConfig
from werkzeug.utils import safe_join

from src.elastic_search import create_document
from src.elastic_search import ElasticSearchClient
from src.elastic_search import ES_URL
from src.elastic_search import ES_INDEX
from src.elastic_search import mapping
from src.elastic_search import settings

from src.utils.file import delete_structure
from src.utils.file import generate_uuid
from src.utils.file import get_current_time
from src.utils.file import get_data
from src.utils.file import get_file_basename
from src.utils.file import get_file_extension
from src.utils.file import get_file_layouts
from src.utils.file import get_file_parsed
from src.utils.file import get_filesystem
from src.utils.file import get_folder_info
from src.utils.file import get_structure_info
from src.utils.file import json_to_text
from src.utils.file import update_data
from src.utils.file import save_file_layouts

from src.utils.file import FILES_PATH, TEMP_PATH, PRIVATE_PATH, ALLOWED_EXTENSIONS

from src.utils.system import get_free_space
#from src.utils.system import get_logs
from src.utils.system import get_private_sessions
from src.utils.system import get_size_private_sessions

from src.utils.text import compare_dicts_words

load_dotenv()

MAX_PRIVATE_SESSION_AGE = int(os.environ.get("MAX_PRIVATE_SESSION_AGE", "5"))
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

app = Flask(__name__)
CORS(app, supports_credentials=True)

#app.config["APPLICATION_ROOT"] = "/api"
app.config["APPLICATION_ROOT"] = "/"

# Set secret key and salt (required)
app.config["SECRET_KEY"] = os.environ["FLASK_SECRET_KEY"]
app.config["SECURITY_PASSWORD_SALT"] = os.environ["FLASK_SECURITY_PASSWORD_SALT"]

# Get configs from file
app.config.from_pyfile('app.cfg')

# Enable CSRF on all api endpoints
flask_wtf.CSRFProtect(app)

# Setup authentication DB
db = SQLAlchemy(app)
fsqla.FsModels.set_db_info(db)

# Setup mail service - must be configured for production!!!
#mail = Mail(app)


class Role(db.Model, fsqla.FsRoleMixin):
    pass


class User(db.Model, fsqla.FsUserMixin):
    pass


# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

# Setup connection to celery
celery = Celery("celery_app", backend=CELERY_RESULT_BACKEND, broker=CELERY_BROKER_URL)

# Setup connection to ElasticSearch
es = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)
# logging.basicConfig(filename="record.log", level=logging.DEBUG, format=f'%(asctime)s %(levelname)s : %(message)s')

log = app.logger

lock_system = dict()
private_sessions = dict()


#####################################
# ERROR HANDLING
#####################################
def bad_request(message: str = 'Bad request syntax or unsupported method'):
    response = jsonify({"message": message})
    response.status_code = 400
    return response

#####################################
# REQUEST HANDLING
#####################################

def format_path(request_data):
    is_private = "_private" in request_data and (request_data["_private"] == 'true' or request_data["_private"] == True)
    if is_private:
        private_session = request_data["path"].strip("/").split("/")[0]
        if private_session == "":  # path for private session must start with session ID
            return bad_request("Path in private session must start with session ID")
        return safe_join(PRIVATE_PATH, request_data["path"].strip("/")), True
    else:
        return safe_join(FILES_PATH, request_data["path"].strip("/")), False


def format_filesystem_path(request_data):
    is_private = "_private" in request_data and (request_data["_private"] == 'true' or request_data["_private"] == True)
    private_session = None
    filesystem_path = FILES_PATH
    if is_private:
        stripped_path = request_data["path"].strip("/")
        path = safe_join(PRIVATE_PATH, stripped_path)
        private_session = stripped_path.split("/")[0]
        if private_session == "":  # path for private session must start with session ID
            return bad_request("Path in private session must start with session ID")
        filesystem_path = safe_join(PRIVATE_PATH, private_session)
        if filesystem_path is None:
            abort(HTTPStatus.NOT_FOUND)
    else:
        path = safe_join(FILES_PATH, request_data["path"].strip("/"))

    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return path, filesystem_path, private_session, is_private


# Endpoint requires a non-empty 'path' argument
def requires_arg_path(func):
    func._requires_arg_path = True  # value unimportant
    return func


# Endpoint requires a non-empty 'path' JSON value
def requires_json_path(func):
    func._requires_json_path = True  # value unimportant
    return func


# Endpoint requires a non-empty 'path' form value
def requires_form_path(func):
    func._requires_form_path = True  # value unimportant
    return func


# Endpoint requires an allowed file type
def requires_allowed_file(func):
    func._requires_allowed_file = True  # value unimportant
    return func


@app.before_request
def abort_bad_request():
    if request.endpoint in app.view_functions:
        view_func = app.view_functions[request.endpoint]
        if hasattr(view_func, '_requires_arg_path'):
            if "path" not in request.values or request.values["path"] == "":
                return bad_request("Missing 'path' argument")
        elif hasattr(view_func, '_requires_json_path'):
            if "path" not in request.json or request.json["path"] == "":
                return bad_request("Missing 'path' parameter")
        elif hasattr(view_func, '_requires_form_path'):
            if "path" not in request.form or request.form["path"] == "":
                return bad_request("Missing 'path' in form")
        elif hasattr(view_func, '_requires_allowed_file'):
            if "name" not in request.form:
                return bad_request("Missing 'name' in form")
            if request.form["name"].split(".")[-1].lower() not in ALLOWED_EXTENSIONS:
                abort(HTTPStatus.UNSUPPORTED_MEDIA_TYPE)


#####################################
# FILE SYSTEM ROUTES
#####################################

@app.route("/files", methods=["GET"])
def get_file_system():
    try:
        # TODO: alter frontend to use info of "current folder", and reply with info of requested folder
        if "path" not in request.values or request.values["path"] == "":
            filesystem = get_filesystem(FILES_PATH)
            filesystem["maxAge"] = MAX_PRIVATE_SESSION_AGE
            return filesystem

        path, filesystem_path, private_session, is_private = format_filesystem_path(request.values)
        log.info(f"Getting info of {filesystem_path}, priv session {private_session}")
        filesystem = get_filesystem(filesystem_path, private_session, is_private)
        filesystem["maxAge"] = MAX_PRIVATE_SESSION_AGE
        return filesystem
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)


@app.route("/info", methods=["GET"])
def get_info():
    try:
        # TODO: alter frontend to use info of "current folder", and reply with info of requested folder
        if "path" not in request.values or request.values["path"] == "":
            return get_filesystem(FILES_PATH)

        path, filesystem_path, private_session, is_private = format_filesystem_path(request.values)
        return {"info": get_structure_info(filesystem_path, private_session, is_private)}
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)


@app.route("/create-folder", methods=["POST"])
def create_folder():
    data = request.json
    log.info(data)

    if ("path" not in data  # empty path is valid: new top-level public session folder
        or "folder" not in data or data["folder"] == ''):
        return bad_request("Missing parameter 'path' or 'folder'")

    path, filesystem_path, private_session, is_private = format_filesystem_path(data)
    folder = data["folder"]

    if folder.startswith("_"):
        return {"success": False, "error": "O nome da pasta não pode começar com _"}

    new_folder_path = safe_join(path, folder)
    if os.path.exists(new_folder_path):
        return {"success": False, "error": "Já existe uma pasta com esse nome"}

    os.mkdir(new_folder_path)

    with open(f"{new_folder_path}/_data.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "type": "folder",
                "creation": get_current_time(),
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    # TODO: alter front-end and response to get info only from current folder
    return {
        "success": True,
        "message": f"Pasta {folder} criada com sucesso",
    }


@app.route("/get-file", methods=["GET"])
@requires_arg_path
def get_file():
    path, is_private = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    totalPages = len(os.listdir(path + "/_ocr_results"))
    doc, words = get_file_parsed(path, is_private)
    return {"pages": totalPages, "doc": doc, "words": words, "corpus": [x[:-4] for x in os.listdir("corpus")]}


@app.route("/get_txt_delimited", methods=["GET"])
@requires_arg_path
def get_txt_delimited():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return send_file(f"{path}/_export/_txt_delimited.txt")


@app.route("/get_txt", methods=["GET"])
@requires_arg_path
def get_txt():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return send_file(f"{path}/_export/_txt.txt")


@app.route("/get_entities", methods=["GET"])
@requires_arg_path
def get_entities():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return send_file(f"{path}/_export/_entities.json")


@app.route("/request_entities", methods=["GET"])
@requires_arg_path
def request_entities():
    path, filesystem_path, private_session, is_private = format_filesystem_path(request.values)
    data = get_data(path + "/_data.json")

    data["ner"] = {
        "error": False,
        "complete": False,
    }

    update_data(f"{path}/_data.json", data)

    celery.send_task('request_ner', kwargs={'data_folder': path})
    # Thread(target=request_ner, args=(path,)).start()
    return {"success": True, "filesystem": get_filesystem(filesystem_path, private_session, is_private)}


# TODO: check if used
@app.route("/get_zip", methods=["GET"])
@requires_arg_path
def get_zip():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    try:
        celery.send_task('export_file', kwargs={'path': path, 'filetype': "zip"}).get()
    except Exception as e:
        return {"success": False, "message": "Pelo menos um ficheiro está a ser processado. Tente mais tarde"}
    return send_file(safe_join(path, f"{path.split('/')[-1]}.zip"))  # filename == folder name


@app.route("/get_pdf_indexed", methods=["GET"])
@requires_arg_path
def get_pdf_indexed():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    promise = celery.send_task('export_file', kwargs={'path': path, 'filetype': "pdf"})
    file = promise.get()
    return send_file(file)


@app.route("/get_pdf", methods=["GET"])
@requires_arg_path
def get_pdf_simple():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)

    promise = celery.send_task('export_file', kwargs={'path': path, 'filetype': "pdf", 'simple': True})
    file = promise.get()
    return send_file(file)


@app.route("/get_csv", methods=["GET"])
@requires_arg_path
def get_csv():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return send_file(f"{path}/_export/_index.csv")


@app.route("/get_hocr", methods=["GET"])
@requires_arg_path
def get_hocr():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return send_file(f"{path}/_export/_hocr.hocr")


@app.route("/get_alto", methods=["GET"])
@requires_arg_path
def get_alto():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    return send_file(f"{path}/_export/_xml.xml")


@app.route("/get_images", methods=["GET"])
@requires_arg_path
def get_images():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)

    promise = celery.send_task('export_file', kwargs={'path': path, 'filetype': "imgs"})
    file = promise.get()
    return send_file(file)


@app.route("/get_original", methods=["GET"])
@requires_arg_path
def get_original():
    path, _ = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    file_path = safe_join(path, path.split('/')[-1])  # filename == folder name
    return send_file(file_path)


@app.route("/delete-path", methods=["POST"])
@requires_json_path
def delete_path():
    path, filesystem_path, private_session, is_private = format_filesystem_path(request.json)
    try:
        # avoid deleting roots
        # filesystem_path is either FILES_PATH or PRIVATE_PATH/private_session -> another endpoint deletes priv. sessions
        if (os.path.samefile(FILES_PATH, path)
            or os.path.samefile(PRIVATE_PATH, path)
            or os.path.samefile(path, filesystem_path)):
            abort(HTTPStatus.NOT_FOUND)

        delete_structure(es, path)
        shutil.rmtree(path)
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)

    return {
        "success": True,
        "message": "Apagado com sucesso",
    }


@app.route("/set-upload-stuck", methods=["POST"])
@requires_json_path
def set_upload_stuck():
    path, filesystem_path, private_session, is_private = format_filesystem_path(request.json)
    try:
        data = get_data(f"{path}/_data.json")
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)
    data["upload_stuck"] = True
    update_data(f"{path}/_data.json", data)

    return {
        "success": True,
        "message": "O upload do ficheiro falhou",
        "files": get_filesystem(filesystem_path, private_session, is_private),
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
    with os.scandir(path) as dir_content:
        for f in dir_content:
            # If f is a folder
            if not f.is_dir(): continue
            if f.name == filename: return True

            data = get_data(f"{f.path}/_data.json")
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
@requires_json_path
def prepare_upload():
    if float(get_free_space()[1]) < 10:
        return {"success": False, "error": "O servidor não tem espaço suficiente. Por favor informe o administrador"}

    data = request.json
    if "name" not in data or data["name"] == '':
        return bad_request("Missing parameter 'name'")

    path, filesystem_path, private_session, is_private = format_filesystem_path(data)
    filename = data["name"]

    if is_filename_reserved(path, filename):
        basename = get_file_basename(filename)
        extension = get_file_extension(filename)
        filename = find_valid_filename(path, basename, extension)

    target = safe_join(path, filename)

    os.mkdir(target)
    with open(f"{target}/_data.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "type": "file",
                "stored": 0.00,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    return {"success": True, "filesystem": get_filesystem(filesystem_path, private_session, is_private),
            "filename": filename}


def join_chunks(target_path, filename, total_count, temp_file_path):
    # Save the file
    with open(f"{target_path}/{filename}", "wb") as f:
        for i in range(total_count):
            with open(f"{temp_file_path}/{i + 1}", "rb") as chunk:
                f.write(chunk.read())

    celery.send_task('prepare_file', kwargs={'path': target_path})

    shutil.rmtree(temp_file_path)
    log.info(f"Finished uploading file {filename}")


@app.route("/upload-file", methods=["POST"])
@requires_form_path
@requires_allowed_file
def upload_file():
    if float(get_free_space()[1]) < 10:
        return {"success": False, "error": "O servidor não tem espaço suficiente. Por favor informe o administrador"}

    if ("file" not in request.files
        or "name" not in request.form
        or "counter" not in request.form
        or "totalCount" not in request.form):
        return bad_request("Missing file or parameter 'name', 'counter', or 'totalCount'")

    path, filesystem_path, private_session, is_private = format_filesystem_path(request.form)
    file = request.files["file"]
    filename = request.form["name"]
    counter = int(request.form["counter"])
    total_count = int(request.form["totalCount"])

    temp_filename = safe_join(path, f"_{filename}").replace("/", "_")
    target_path = safe_join(path, filename)  # path for document data is "path/filename"
    file_path = safe_join(target_path, filename)  # file stored as "path/filename/filename"

    with open(f"{target_path}/_data.json", "w", encoding="utf-8") as f:
        extension = filename.split(".")[-1].lower()
        json.dump({
            "type": "file",
            "extension": extension if extension in ALLOWED_EXTENSIONS else "other",
            "stored": 0.00,  # 0% at start, 100% when all chunks stored, True after prepare_file_ocr
        }, f, indent=2, ensure_ascii=False)

    # If only one chunk, save the file directly
    if total_count == 1:
        file.save(file_path)

        celery.send_task('prepare_file', kwargs={'path': target_path})

        return {"success": True, "finished": True, "info": get_folder_info(target_path, private_session)}

    # Create a Lock to process the file
    if temp_filename not in lock_system:
        lock_system[temp_filename] = Lock()

    # If multiple chunks, save the chunk and wait for the other chunks
    file = file.read()

    # Create the folder to save the chunks
    temp_file_path = safe_join(TEMP_PATH, temp_filename)
    if not os.path.exists(temp_file_path):
        os.mkdir(temp_file_path)

    with lock_system[temp_filename]:
        # Save the chunk
        with open(f"{temp_file_path}/{counter}", "wb") as f:
            f.write(file)

        # Number of chunks saved
        chunks_saved = len(os.listdir(f"{temp_file_path}"))
        stored = round(100 * chunks_saved / total_count, 2)

        log.info(f"Uploading file {filename} ({counter}/{total_count}) - {stored}%")

        update_data(f"{target_path}/_data.json", {"stored": stored})

        if chunks_saved == total_count:
            del lock_system[temp_filename]

            Thread(
                target=join_chunks,
                args=(target_path, filename, total_count, temp_file_path)
            ).start()

            return {"success": True, "finished": True, "info": get_folder_info(target_path, private_session)}

    return {"success": True, "finished": False, "info": get_folder_info(target_path, private_session)}


@app.route("/save-config", methods=["POST"])
@requires_json_path
def configure_ocr():
    req_data = request.json
    if "config" not in req_data:
        return bad_request("Missing parameter 'config'")
    path, filesystem_path, private_session, is_private = format_filesystem_path(req_data)
    data_path = f"{path}/_data.json"
    try:
        data = get_data(data_path)
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)  # TODO: improve feedback to users on error

    if isinstance(req_data["config"], dict) or req_data["config"] == "default":
        data["config"] = req_data["config"]
    else:
        # TODO: accept and verify other strings as config file names
        return bad_request("Config must be dictionary or \"default\"")

    update_data(data_path, data)

    return {"success": True}


@app.route("/perform-ocr", methods=["POST"])
@requires_json_path
def perform_ocr():
    """
    Request to perform OCR on a file/folder
    @param path: path to the file/folder
    @param algorithm: algorithm to be used
    @param data: data to be used
    @param multiple: if it is a folder or not
    """

    if float(get_free_space()[1]) < 10:
        return {"success": False, "error": "O servidor não tem espaço suficiente. Por favor informe o administrador"}

    data = request.json
    path, filesystem_path, private_session, is_private = format_filesystem_path(data)

    config = data["config"] if "config" in data else None
    multiple = data["multiple"] if "multiple" in data else False

    if multiple:
        files = [
            f"{path}/{f}"  # path is safe, 'f' obtained by server
            for f in os.listdir(path)
            if os.path.isdir(os.path.join(path, f))
        ]
    else:
        files = [path]

    for f in files:
        try:
            data = get_data(f"{f}/_data.json")
        except FileNotFoundError:
            abort(HTTPStatus.INTERNAL_SERVER_ERROR)  # TODO: improve feedback to users on error

        # TODO: handle default or preset name configs in celery tasks
        # Replace specified config with saved config, if exists
        if config is None and "config" in data:
            config = data["config"]

        # Delete previous results
        if os.path.exists(f"{f}/_ocr_results"):
            shutil.rmtree(f"{f}/_ocr_results")
        if os.path.exists(f"{f}/_export"):
            shutil.rmtree(f"{f}/_export")
        os.mkdir(f"{f}/_ocr_results")
        os.mkdir(f"{f}/_export")

        data.update({
            "ocr": {"progress": 0},
            "pdf": {"complete": False},
            "pdf_indexed": {"complete": False},
            "txt": {"complete": False},
            "txt_delimited": {"complete": False},
            "csv": {"complete": False},
            "ner": {"complete": False},
            "hocr": {"complete": False},
            "xml": {"complete": False},
            "zip": {"complete": False},
        })
        update_data(f"{f}/_data.json", data)

        if os.path.exists(f"{f}/_images"):
            shutil.rmtree(f"{f}/_images")

        celery.send_task('file_ocr', kwargs={'path': f, 'config': config})

    return {
        "success": True,
        "message": "O OCR começou, por favor aguarde",
    }


@app.route("/index-doc", methods=["POST"])
@requires_json_path
def index_doc():
    """
    Index a document in Elasticsearch
    @param path: path to the document
    @param multiple: if it is a folder or not
    """
    data = request.json
    path, filesystem_path, private_session, _ = format_filesystem_path(data)
    if PRIVATE_PATH in path:  # avoid indexing private sessions
        abort(HTTPStatus.NOT_FOUND)
    multiple = data["multiple"]

    if multiple:
        pass

        return {}
    else:
        data_path = path + "/_data.json"
        hOCR_path = path + "/_ocr_results"
        try:
            data = get_data(data_path)
        except FileNotFoundError:
            abort(HTTPStatus.NOT_FOUND)
        files = sorted([f for f in os.listdir(hOCR_path) if f.endswith(".json")])

        extension = data["extension"]
        for i, file in enumerate(files):
            file_path = f"{hOCR_path}/{file}"

            with open(file_path, encoding="utf-8") as f:
                hocr = json.load(f)
                text = json_to_text(hocr)

            if data["pages"] > 1:
                doc = create_document(
                    file_path,
                    data["ocr"]["config"]["engine"],
                    data["ocr"]["config"],
                    text,
                    extension,
                    i + 1,
                )
            else:
                doc = create_document(
                    file_path,
                    "Tesseract",
                    data["ocr"]["config"],
                    text,
                    extension
                )

            doc_id = generate_uuid(file_path)

            es.add_document(doc_id, doc)

        update_data(data_path, {"indexed": True})

        return {
            "success": True,
            "message": "Documento indexado",
            "files": get_filesystem(filesystem_path, private_session, False),
        }


@app.route("/remove-index-doc", methods=["POST"])
@requires_json_path
def remove_index_doc():
    """
    Remove a document in Elasticsearch
    @param path: path to the document
    @param multiple: if it is a folder or not
    """
    data = request.json
    path, filesystem_path, private_session, _ = format_filesystem_path(data)
    if PRIVATE_PATH in path:
        abort(HTTPStatus.NOT_FOUND)
    multiple = data["multiple"]

    if multiple:
        pass

        return {}
    else:
        data_path = path + "/_data.json"
        hOCR_path = path + "/_ocr_results"
        # try:
        #     data_path = get_data(path + "/_data.json")
        # except FileNotFoundError:
        #     abort(HTTPStatus.NOT_FOUND)
        files = [f for f in os.listdir(hOCR_path) if f.endswith(".json")]

        for f in files:
            file_path = f"{hOCR_path}/{f}"
            id = generate_uuid(file_path)
            es.delete_document(id)

        update_data(data_path, {"indexed": False})

        return {
            "success": True,
            "message": "Documento removido",
            "files": get_filesystem(filesystem_path, private_session, False),
        }


@app.route("/submit-text", methods=["POST"])
def submit_text():
    data = request.json
    if "text" not in data or "remakeFiles" not in data:
        return bad_request("Missing parameter 'text' or 'remakeFiles'")

    texts = data["text"]  # estrutura com texto, nome do ficheiro e url da imagem
    remake_files = data["remakeFiles"]
    data_folder_list = texts[0]["original_file"].strip("/").split("/")[:-2]
    data_folder = '/'.join(data_folder_list)

    is_private = "_private" in data and (data["_private"] == 'true' or data["_private"] == True)
    private_session = None
    filesystem_path = FILES_PATH
    if is_private:
        path = safe_join(PRIVATE_PATH, data_folder)
        data_path = path + "/_data.json"
        private_session = data_folder_list[0]
        if private_session == "":  # path for private session must start with session ID
            return bad_request("Path to private session must start with session ID")
        filesystem_path = safe_join(PRIVATE_PATH, private_session)
    else:
        path = safe_join(FILES_PATH, data_folder)
        data_path = path + "/_data.json"

    try:
        data = get_data(data_path)
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)

    for t in texts:
        text = t["content"]
        if is_private:
            filename = safe_join(PRIVATE_PATH, t["original_file"].strip("/"))
        else:
            filename = safe_join(FILES_PATH, t["original_file"].strip("/"))

        if filename is None:
            abort(HTTPStatus.NOT_FOUND)

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(text, f, indent=2, ensure_ascii=False)

    if remake_files:
        celery.send_task('make_changes', kwargs={'path': path,  'data': data})
        # Thread(target=make_changes, args=(data_folder, data)).start()
        # make_changes(data_folder, data)

    return {"success": True, "files": get_filesystem(filesystem_path, private_session, is_private)}


@app.route("/check-sintax", methods=["POST"])
def check_sintax():
    if ("words" not in request.json
        or "languages" not in request.json):
        return bad_request("Missing parameter 'words' or 'languages'")

    words = request.json["words"].keys()
    languages = request.json["languages"]

    result = compare_dicts_words(words, languages)
    return {"success": True, "result": result}


#####################################
# ELASTICSEARCH
#####################################
@app.route("/get-docs-list", methods=["GET"])
def get_docs_list():
    return es.get_all_docs_names()


@app.route("/search", methods=["POST"])
def search():
    data = request.json
    if "query" not in data:
        return bad_request("Missing parameter 'query'")

    query = data["query"]
    docs = None

    if "docs" in data and len(data["docs"]):
        docs = data["docs"]

    # for empty query with doc list, get all content of those docs
    if docs and query == "":
        return jsonify(es.get_docs(docs))
    else:
        return jsonify(es.search(query, docs))


#####################################
# PRIVATE SESSIONS
#####################################
@app.route("/create-private-session", methods=["GET"])
def create_private_session():
    session_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    private_sessions[session_id] = {}

    if not os.path.isdir(PRIVATE_PATH):
        os.mkdir(PRIVATE_PATH)
        with open(f"{PRIVATE_PATH}/_data.json", "w", encoding="utf-8") as f:
            json.dump(
                {
                    "type": "folder",
                    "creation": get_current_time(),
                },
                f,
                indent=2,
                ensure_ascii=False,
            )

    os.mkdir(f"{PRIVATE_PATH}/{session_id}")

    with open(f"{PRIVATE_PATH}/{session_id}/_data.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "type": "folder",
                "creation": get_current_time(),
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    return {"success": True, "sessionId": session_id}


@app.route('/validate-private-session', methods=['POST'])
def validate_private_session():
    data = request.json
    if "sessionId" not in data:
        return bad_request("Missing parameter 'sessionId'")

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
@requires_arg_path
def get_layouts():
    path, is_private = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    try:
        layouts = get_file_layouts(path, is_private)
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)
    return {"layouts": layouts}


@app.route("/save-layouts", methods=["POST"])
@requires_json_path
def save_layouts():
    data = request.json
    if "layouts" not in data:
        return bad_request("Missing parameter 'layouts'")

    path, _ = format_path(data)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    layouts = data["layouts"]
    try:
        save_file_layouts(path, layouts)
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)
    return {"success": True}


@app.route("/generate-automatic-layouts", methods=["GET"])
@requires_arg_path
def generate_automatic_layouts():
    path, is_private = format_path(request.values)
    if path is None:
        abort(HTTPStatus.NOT_FOUND)
    try:
        celery.send_task('auto_segment', kwargs={'path': path}).get()
        layouts = get_file_layouts(path, is_private)
    except FileNotFoundError:
        abort(HTTPStatus.NOT_FOUND)
    return {"layouts": layouts}


#####################################
# LOGIN MANAGEMENT
#####################################
@app.route('/account/check-auth')
@auth_required()
@roles_required('Admin')
def check_authorized():
    if current_user.is_authenticated:
        return {"status": "Logged in"}
    else:
        abort(HTTPStatus.FORBIDDEN)

"""
@app.route("/register", methods=["POST"])
def register_user():
    email = request.json["email"]
    password = request.json["password"]
    user_exists = User.query.filter_by(email=email).first() is not None

    if user_exists:
        return jsonify({"error": "Utilizador já registado com este email."}), 409

    new_user = User(email=email, password=password)
    db.session.add(new_user)
    db.session.commit()

    session["user_id"] = new_user.id
    return jsonify({
        "id": new_user.id,
        "email": new_user.email
    })
"""

#####################################
# ADMIN ROUTES
#####################################

@app.route("/admin/system-info", methods=["GET"])
@auth_required()
@roles_required('Admin')
def get_system_info():
    free_space, free_space_percentage = get_free_space()
    return {
        "free_space": free_space,
        "free_space_percentage": free_space_percentage,
        # "logs": get_logs(),
        "private_sessions": get_private_sessions(),
    }


@app.route("/admin/storage-info", methods=["GET"])
@auth_required()
@roles_required('Admin')
def get_storage_info():
    free_space, free_space_percentage = get_free_space()
    data = get_data(f"./{PRIVATE_PATH}/_data.json")
    if "last_cleanup" not in data.keys():
        last_cleanup = "nunca"
    else:
        last_cleanup = data["last_cleanup"]
    return {
        "free_space": free_space,
        "free_space_percentage": free_space_percentage,
        "private_sessions": get_size_private_sessions(),
        "last_cleanup": last_cleanup,
    }
@app.route("/admin/delete-private-session", methods=["POST"])
@auth_required()
@roles_required('Admin')
def delete_private_session():
    data = request.json
    if "sessionId" not in data:
        return bad_request("Missing parameter 'sessionId'")
    session_id = data["sessionId"]

    session_path = safe_join(PRIVATE_PATH, session_id)
    if session_path is None:
        abort(HTTPStatus.NOT_FOUND)

    shutil.rmtree(session_path)
    if session_id in private_sessions:
        del private_sessions[session_id]

    return {
        "success": True,
        "message": "Apagado com sucesso",
        "private_sessions": get_size_private_sessions(),
    }


@app.route('/admin/flower/', defaults={'fullpath': ''}, methods=["GET", "POST"])
@app.route('/admin/flower/<path:fullpath>', methods=["GET", "POST"])
@auth_required()
@roles_required('Admin')
def proxy_flower(fullpath):
    """
    Proxy requests to the Flower Celery manager. Flower can be setup to allow operations without authentication,
    as authentication can be ensured through this endpoint.
    :param fullpath: rest of the path to the Flower API
    :return: response from Flower
    """
    log.info(f'Requesting to flower {request.base_url.replace(request.host_url, "http://flower:5050/")}')
    res = requests.request(
        method=request.method,
        url=request.base_url.replace(request.host_url, 'http://flower:5050/'),
        params=request.query_string,
        headers={k: v for k, v in request.headers if k.lower() != 'host'},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False,
    )

    # exclude "hop-by-hop headers" defined by RFC 2616 section 13.5.1 ref. https://www.rfc-editor.org/rfc/rfc2616#section-13.5.1
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [
        (k, v) for k, v in res.raw.headers.items()
        if k.lower() not in excluded_headers
    ]

    response = Response(res.content, res.status_code, headers)
    return response


#####################################
# MAIN
#####################################
if not os.path.exists(f"./{FILES_PATH}/"):
    os.mkdir(f"./{FILES_PATH}/")

if not os.path.exists(f"./{TEMP_PATH}/"):
    os.mkdir(f"./{TEMP_PATH}/")

if not os.path.exists(f"./{PRIVATE_PATH}/"):
    os.mkdir(f"./{PRIVATE_PATH}/")

    with open(f"./{PRIVATE_PATH}/_data.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "type": "folder",
                "creation": get_current_time(),
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

with app.app_context():
    db.create_all()
    if not security.datastore.find_role("Admin"):
        security.datastore.create_role(name="Admin")

    if app.debug:
        if not security.datastore.find_user(email="test@home.com"):
            security.datastore.create_user(email="test@home.com", password=hash_password("password"), roles=["Admin"])

    db.session.commit()

if __name__ == "__main__":
    # app.config['DEBUG'] = os.environ.get('DEBUG', False)
    app.run(host='0.0.0.0', port=5001, threaded=True, use_reloader=False)
