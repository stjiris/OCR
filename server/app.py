import os, json, shutil, re
from datetime import datetime

from flask import Flask, request, send_file
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from src.utils.export import export_file
from src.thread_pool import ThreadPool

from src.utils.file import (
    get_structure_info,
    get_filesystem,
    get_file_parsed,
    delete_structure,
    perform_file_ocr,
    perform_page_ocr,
    get_data,
    update_data,
    get_page_count,
    generate_uuid,
    json_to_text,
    fix_ocr,
    get_file_basename,
    get_file_extension,
    get_size
)

from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import *

client = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

app = Flask(__name__)   # Aplicação em si
CORS(app)

MAX_THREADS = 4
WAITING_DOCS = []
WAITING_CHANGES = []
WAITING_PAGES = []

def make_changes(data, data_folder):
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

#####################################
# FILE SYSTEM ROUTES
#####################################
@app.route("/files", methods=["GET"])
def get_file_system():
    return get_filesystem("files")

@app.route("/info", methods=["GET"])
def get_info():
    return {'info': get_structure_info("files")}

@app.route("/create-folder", methods=["POST"])
def create_folder():
    data = request.json

    path = data["path"]
    folder = data["folder"]

    if os.path.exists(path + "/" + folder):
        return {"success": False, "error": "Já existe uma pasta com esse nome"}

    os.mkdir(path + "/" + folder)

    with open(f"{path}/{folder}/_data.json", "w") as f:
        json.dump({
            "type": "folder",
            "creation": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        }, f)

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
    data = data = request.json
    path = data["path"]

    delete_structure(client, path)        
    shutil.rmtree(path)

    return {"success": True, "message": "Apagado com sucesso", "files": get_filesystem("files")}

#####################################
# FILES ROUTES
#####################################
def find_valid_filename(path, basename, extension):
    """
    Fidna valid name for a file so it doesn't overwrite another file

    :param path: path to the file
    :param basename: basename of the file
    :param extension: extension of the file

    :return: valid filename
    """
    id = 1
    while os.path.exists(f"{path}/{basename} ({id}).{extension}"):
        id += 1

    return f"{basename} ({id}).{extension}"

@app.route("/upload-file", methods=['POST'])
def upload_file():
    """
    Receive a file and save it in the server
    @param file: file to be saved
    @param path: path to save the file
    """

    file = request.files["file"]
    path = request.form["path"]

    filename = file.filename

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

    return {"success": True, "file": filename, "filesystem": get_filesystem("files")}

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

    ocr_algorithm = tesseract if algorithm == "Tesseract" else easy_ocr

    if multiple:
        files = [f"{path}/{f}" for f in os.listdir(path) if os.path.isdir(os.path.join(path, f))]
    else:
        files = [path]

    for f in files:
        # Delete previous results
        if os.path.exists(f"{f}/ocr_results"): shutil.rmtree(f"{f}/ocr_results")
        os.mkdir(f"{f}/ocr_results")

        # Update the information related to the OCR
        data = get_data(f"{f}/_data.json")
        data["ocr"] = {}
        data["ocr"]["algorithm"] = algorithm
        data["ocr"]["config"] = '_'.join(config)
        data["ocr"]["complete"] = False
        data["txt"] = {}
        data["txt"]["complete"] = False
        data["pdf"] = {}
        data["pdf"]["complete"] = False
        update_data(f"{f}/_data.json", data)

        WAITING_DOCS.append((f, config, ocr_algorithm, WAITING_PAGES))

    return {"success": True, "message": "O OCR começou, por favor aguarde", "files": get_filesystem("files")}

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
                doc = create_document(file_path, ocr_config["ocr"]["algorithm"], ocr_config["ocr"]["config"], text, id+1)
            else:
                doc = create_document(file_path, ocr_config["ocr"]["algorithm"], ocr_config["ocr"]["config"], text)

            id = generate_uuid(file_path)

            client.add_document(id, doc)

        update_data(path + "/_data.json", {"indexed": True})

        return {"success": True, "message": "Documento indexado", "files": get_filesystem("files")}

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
        config = get_data('/'.join(path.split('/')[:-1]) + "/_data.json")
        files = [f for f in os.listdir(hOCR_path) if f.endswith(".json")]

        for f in files:
            file_path = f"{hOCR_path}/{f}"
            id = generate_uuid(file_path)
            client.delete_document(id)

        update_data(path + "/_data.json", {"indexed": False})

        return {"success": True, "message": "Documento removido", "files": get_filesystem("files")}

@app.route("/submit-text", methods=["POST"])
def submit_text():
    texts = request.json["text"] # estrutura com texto, nome do ficheiro e url da imagem

    data_folder = '/'.join(texts[0]["original_file"].split("/")[:-2])
    data = get_data(data_folder + "/_data.json")

    for t in texts:
        text = t["content"]
        filename = t["original_file"]

        with open(filename, encoding="utf-8") as f:
            hocr = json.load(f)
            words = [[x["text"] for x in l] for l in hocr]

        try:
            new_hocr = fix_ocr(words, text)
        except:
            return {"success": False, "error": "Ocorreu um erro inesperado enquanto corrigiamos o texto, por favor informem-nos"}
        
        for l_id, l in enumerate(new_hocr):
            for w_id, w in enumerate(l):
                hocr[l_id][w_id]["text"] = w

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(hocr, f, indent=2)

        if data["indexed"]:
            id = generate_uuid(filename)
            client.update_document(id, text)

    update_data(data_folder + "/_data.json", {"txt": {"complete": False}, "pdf": {"complete": False}})

    WAITING_CHANGES.append((data, data_folder))

    return {"success": True, "files": get_filesystem("files")}

#####################################
# ELASTICSEARCH
#####################################
@app.route("/get_elasticsearch", methods=["GET"])
def get_elasticsearch():
    return client.get_docs()

#####################################
# MAIN
#####################################
if __name__ == "__main__":
    if not os.path.exists("./files/"):
        os.mkdir("./files/")

    docs_pool = ThreadPool(perform_file_ocr, WAITING_DOCS, MAX_THREADS)
    changes_pool = ThreadPool(make_changes, WAITING_CHANGES, MAX_THREADS)
    pages_pool = ThreadPool(perform_page_ocr, WAITING_PAGES, MAX_THREADS + 2, delay = 2)
                
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)