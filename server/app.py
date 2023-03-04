import os, json, shutil, re

from flask import Flask, request, send_file
from flask_cors import CORS # permitir requests de outros ips alem do servidor
from threading import Thread

from src.utils.export import export_file

from src.utils.file import (
    get_structure_info,
    get_filesystem,
    get_file_parsed,
    delete_structure,
    perform_file_ocr,
    get_data,
    update_data,
    get_page_count,
    generate_uuid,
    json_to_text,
    fix_ocr
)

from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import *

client = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

app = Flask(__name__)   # Aplicação em si
CORS(app)

MAX_THREADS = 4
WAITING_DOCS = []

def manage_threads(pages):
    import time
    active_threads = []
    print("Parser started!")
    while True:
        time.sleep(5)
        for t in active_threads:
            if not t.is_alive():
                active_threads.remove(t)
        while len(pages) > 0 and len(active_threads) <= MAX_THREADS:
            page = pages.pop()
            t = Thread(target=perform_file_ocr, args=(*page, ))
            t.start()
            active_threads.append(t)

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
            "files/pages": 0
        }, f)

    return {"success": True, "files": get_filesystem("files")}

@app.route("/file-exists", methods=["GET"])
def file_exists():
    data = request.values
    path = data["path"]
    file = data["file"]

    if os.path.exists(f"{path}/{file}"):
        return {"success": False, "error": "Já existe um ficheiro com esse nome"}
    else:
        return {"success": True}

@app.route("/get-file", methods=["GET"])
def get_file():
    path = request.values["path"]
    doc = get_file_parsed(path)
    return {"doc": doc}

@app.route("/get_txt", methods=["GET"])
def get_txt():
    path = request.values["path"]
    file = export_file(path, "txt")
    return send_file(file)

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

    if os.path.exists(f"{path}/{filename}"): return {"success": False, "error": "Já existe um ficheiro com esse nome"}

    os.mkdir(f"{path}/{filename}")
    file.save(f"{path}/{filename}/{filename}")

    with open(f"{path}/{filename}/_data.json", "w") as f:
        json.dump({
            "type": "file",
            "ocr_results": 0,
            "files/pages": get_page_count(f"{path}/{filename}/{filename}")
        }, f)

    # Update the folders _data.json
    with open(f"{path}/_data.json") as f:
        data = json.load(f)
        data["files/pages"] += 1

    update_data(f"{path}/_data.json", data)

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
    ocr_folder = f"{algorithm[:4].upper()}_{'_'.join(config)}"

    if multiple:
        files = [f"{path}/{f}" for f in os.listdir(path) if os.path.isdir(os.path.join(path, f))]
    else:
        files = [path]

    for f in files:
        if not os.path.exists(f"{f}/{ocr_folder}"):
            os.mkdir(f"{f}/{ocr_folder}")
            data_path = f"{f}/{ocr_folder}/_data.json"
            with open(data_path, "w") as _f:
                json.dump({"type": "ocr", "progress": 0, "indexed": False, "algorithm": algorithm, "config": '_'.join(config)}, _f)

        WAITING_DOCS.append((f, ocr_folder, config, ocr_algorithm))

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
        config = get_data('/'.join(path.split('/')[:-1]) + "/_data.json")
        ocr_config = get_data(path + "/_data.json")
        files = sorted([f for f in os.listdir(path) if f.endswith(".json") and f != "_data.json"])

        for id, file in enumerate(files):
            file_path = f"{path}/{file}"

            with open(file_path) as f:
                hocr = json.load(f)
                text = json_to_text(hocr)

            if config["files/pages"] > 1:
                doc = create_document(file_path, ocr_config["algorithm"], ocr_config["config"], text, id+1)
            else:
                doc = create_document(file_path, ocr_config["algorithm"], ocr_config["config"], text)

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
        config = get_data('/'.join(path.split('/')[:-1]) + "/_data.json")
        files = [f for f in os.listdir(path) if f.endswith(".txt") and not f.endswith("-Text.txt")]

        if config["files/pages"] > 1:
            files = sorted(files, key=lambda x: re.findall(r"\d+", x)[-1])

        for id, f in enumerate(files):
            file_path = f"{path}/{f}"
            id = generate_uuid(file_path)
            client.delete_document(id)

        update_data(path + "/_data.json", {"indexed": False})

        return {"success": True, "message": "Documento removido", "files": get_filesystem("files")}

@app.route("/submit-text", methods=["POST"])
def submit_text():
    texts = request.json["text"] # estrutura com texto, nome do ficheiro e url da imagem

    data_folder = '/'.join(texts[0]["original_file"].split("/")[:-1])
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

    return {"success": True}

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

    page_parser = Thread(target=manage_threads, args=(WAITING_DOCS, ), daemon=True)
    page_parser.start()
                
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)