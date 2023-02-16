import os, json, shutil
from PIL import Image

from flask import Flask, request, send_file
from flask_cors import CORS # permitir requests de outros ips alem do servidor
from threading import Thread

from src.utils.file import (
    parse_file,
    process_file,
    process_image,
    get_filesystem,
    get_structure,
    get_file_parsed,
    get_txt_file,
    get_original_file,
    delete_structure
)

from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import *

client = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

app = Flask(__name__)   # Aplicação em si
CORS(app)

MAX_THREADS = 4
WAITING_PAGES = []

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
            t = Thread(target=parse_file, args=(*page, ))
            t.start()
            active_threads.append(t)

#####################################
# FILE SYSTEM ROUTES
#####################################
@app.route("/files", methods=["GET"])
def get_file_system():
    return get_filesystem("./files/")

@app.route("/info", methods=["GET"])
def get_info():
    return {'info': get_filesystem("./files/")["info"]}

@app.route("/create-folder", methods=["POST"])
def create_folder():
    data = request.json
    print(data)
    path = data["path"]
    folder = data["folder"]

    if os.path.exists(path + "/" + folder):
        return {"success": False, "error": "That folder already exists"}

    os.mkdir(path + "/" + folder)

    return {"success": True, "files": get_filesystem("./files/")}

@app.route("/file-exists", methods=["GET"])
def file_exists():
    data = request.values
    path = data["path"]
    file = data["file"]

    if os.path.exists(f"{path}/{file}"):
        return {"success": False, "error": "There is a file with that name already"}
    else:
        return {"success": True}

@app.route("/get-file", methods=["GET"])
def get_file():
    path = request.values["path"]

    pages = get_file_parsed(path)

    return {"contents": pages}

@app.route("/get_txt", methods=["GET"])
def get_txt():
    path = request.values["path"]
    file = get_txt_file(path)
    return send_file(file)

@app.route("/get_original", methods=["GET"])
def get_original():
    path = request.values["path"]
    file = get_original_file(path)
    return send_file(file)

@app.route("/delete-path", methods=["POST"])
def delete_path():
    data = data = request.json
    path = data["path"]

    structure = get_structure(path + "/")

    main_path = path[:path.rfind("/")]

    delete_structure(client, structure, main_path)        
    shutil.rmtree(path, ignore_errors=True)

    return {"success": True, "message": "Deleted with success", "files": get_filesystem("./files/")}

#####################################
# FILES ROUTES
#####################################
@app.route("/submitImageFile", methods=['POST'])
def submit_image_file():
    file = request.files["file"]
    path = request.form["path"]
    algorithm = request.form["algorithm"]
    config = request.form["config"]
    filename = request.form["filename"]

    basename = os.path.basename(filename).split(".")[0]

    if os.path.exists(f"{path}/{filename}"): return {"success": False, "error": "There is a file with that name already"}
    os.mkdir(f"{path}/{filename}")

    file.save(f"{path}/{filename}/{filename}")
    img = Image.open(file)
    img.save(f"{path}/{filename}/{basename}_1.jpg")

    with open(f"{path}/{filename}/_config.json", "w") as f:
        json.dump({
            "algorithm": algorithm,
            "config": config,
            "progress": 0
        }, f)

    algo = tesseract.get_text if algorithm == "Tesseract" else easy_ocr.get_text
    parse_file(process_image, filename, img, config, path, algo, client)
    
    return {"success": True, "file": filename, "score": 0, "files": get_filesystem("./files/")}

@app.route("/submitFile", methods=['POST'])
def submit_file():
    data = request.json
    fileHex = data["file"]
    file = data["filename"]
    page = data["page"]
    algorithm = data["algorithm"]
    config = data["config"]
    path = data["path"]

    print("Received page:", page)

    basename = os.path.basename(file).split(".")[0]

    if os.path.exists(f"{path}/{file}/{basename}_{page}.txt"): return {"success": False, "error": "There is a file with that name already"}
    if not os.path.exists(f"{path}/{file}"):    
        os.mkdir(f"{path}/{file}")

    with open(f"{path}/{file}/{basename}_{page}.pdf", "wb") as f:
        f.write(bytes.fromhex(fileHex))

    with open(f"{path}/{file}/_config.json", "w") as f:
        json.dump({
            "algorithm": algorithm,
            "config": config,
            "progress": 0
        }, f)

    algo = tesseract.get_text if algorithm == "Tesseract" else easy_ocr.get_text
    WAITING_PAGES.append((process_file, file, page, config, path, algo, client))
    # pool.submit(parse_file, process_file, file, page, config, path, algo, client)

    return {"success": True, "file": data["filename"], "page": page, "score": 0, "files": get_filesystem("./files/")}

@app.route("/submitText", methods=["POST"])
def submitText():
    texts = request.json["text"] # texto corrigido
    filename = request.json['filename'] # nome do pdf original

    basename = os.path.basename(filename).split(".")[0]
    extension = os.path.basename(filename).split(".")[1]

    for id, t in enumerate(texts):
        print("Saving page:", (id + 1))
        if extension in ["jpg", "jpeg", "png"]:
            final_filename = f"{filename}/{basename}"
        else:
            final_filename = f"{filename}/{basename}_{(id + 1)}"

        with open(final_filename + ".txt", "w", encoding="utf-8") as f:
            f.write(t)

        client.update_document(f"{final_filename}.{extension}", t)
    
    return {"success": True}

#####################################
# ELASTICSEARCH
#####################################
@app.route("/get_elasticsearch", methods=["GET"])
def get_elasticsearch():
    return client.get_docs()

if __name__ == "__main__":
    if not os.path.exists("./files/"):
        os.mkdir("./files/")

    page_parser = Thread(target=manage_threads, args=(WAITING_PAGES, ), daemon=True)
    page_parser.start()
                
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)