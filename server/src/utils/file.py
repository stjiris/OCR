import json
import logging as log
import os
import random
import re
from json import JSONDecodeError

import requests
import uuid
from datetime import datetime
from os import environ
from pathlib import Path
import pytz

import pypdfium2 as pdfium

from PIL import Image
from src.utils.export import export_file
from src.utils.export import json_to_text
from string import punctuation

FILES_PATH = environ.get("FILES_PATH", "_files")
PRIVATE_PATH = environ.get("PRIVATE_PATH", "_files/_private_sessions")

IMAGE_PREFIX = environ.get("IMAGE_PREFIX", ".")
TIMEZONE = pytz.timezone("Europe/Lisbon")

log.basicConfig(level=log.INFO, format=f'%(asctime)s %(levelname)s : %(message)s')

##################################################
# FILESYSTEM UTILS
##################################################

# Current file system structure
# files
# - folder1
#   - filename.(pdf/png/jpg/...)
#       - filename.(pdf/png/jpg/...)    (the original submitted file)
#       - filename_extracted.txt        (the text extracted initially)
#       - filename_changes.txt          (the text changed by the user)
#       - conf.txt                      (the conf file of the OCR engine used)
# - folder2

def get_ner_file(path):
    r = requests.post(
        "https://iris.sysresearch.org/absconditus/from-text",
        files={"file": open(f"{path}/_text.txt", "rb")},
    )
    try:
        ner = r.json()
    except JSONDecodeError:
        return False

    if r.status_code == 200:
        with open(f"{path}/_entities.json", "w", encoding="utf-8") as f:
            json.dump(ner, f, indent=2, ensure_ascii=False)
        return True
    else:
        return False


# DONE
def get_current_time():
    """
    Get the current time in the correct format

    :return: current time
    """
    return datetime.now().astimezone(TIMEZONE).strftime("%d/%m/%Y %H:%M:%S")

# TODO
def get_file_parsed(path, is_private):
    """
    Return the text off all the pages of the file

    :param path: path to the file
    :return: list with the text of each page
    """
    path += "/_ocr_results"
    files = [
        f"{path}/{f}"
        for f in os.listdir(path)
        if os.path.isfile(os.path.join(path, f))
        and ".json" in f
        and "_data.json" not in f
    ]

    files.sort(key=lambda x: int(x.split("/")[-1].split("_")[-1].split(".")[0]))

    data = []
    words = {}
    for id, file in enumerate(files):
        basename = get_file_basename(file)
        with open(file, encoding="utf-8") as f:
            hocr = json.load(f)

            for sectionId, s in enumerate(hocr):
                for lineId, l in enumerate(s):
                    for wordId, w in enumerate(l):
                        t = w["text"].lower().strip()

                        while t:
                            if t[0] in punctuation + "«»—":
                                t = t[1:]
                            else:
                                break

                        while t:
                            if t[-1] in punctuation + "«»—":
                                t = t[:-1]
                            else:
                                break

                        if t == "" or t.isdigit():
                            continue

                        hocr[sectionId][lineId][wordId]["clean_text"] = t

                        if t in words:
                            words[t]["pages"].append(id)
                        else:
                            words[t] = {
                                "pages": [id],
                                "syntax": True
                            }
            if is_private:
                file = re.sub(f"^{PRIVATE_PATH}", '', file)
            else:
                file = re.sub(f"^{FILES_PATH}", '', file)

            data.append(
                {
                    "original_file": file,
                    "content": hocr,
                    "page_number": int(basename.split("_")[-1]),
                    "page_url": IMAGE_PREFIX
                    + ("/private/" if is_private else "/images/")  # TODO: secure private session images
                    + "/".join(file.split("/")[1:-2])
                    + f"/{basename}.jpg"
                }
            )
    return data, words

# TODO
def get_file_layouts(path, is_private):
    data = get_data(f"{path}/_data.json")
    layouts = []
    basename = get_file_basename(path)

    for page in range(data["pages"]):
        filename = f"{path}/_layouts/{basename}_{page}.json"
        if is_private:
            folder_url = f"/private/{path.replace(PRIVATE_PATH, '')}"
        else:
            folder_url = f"/images/{path.replace(FILES_PATH, '')}"
        page_url = IMAGE_PREFIX + folder_url + f"/{basename}_{page}.jpg"

        if os.path.exists(filename):
            with open(filename, encoding="utf-8") as f:
                layouts.append({
                    "boxes": json.load(f),
                    "page_url": page_url,
                    "page_number": page,
                    "done": True
                })
        else:
            layouts.append({
                "boxes": [],
                "page_url": page_url,
                "page_number": page,
                "done": False
            })

    return layouts

# TODO
def save_file_layouts(path, layouts):
    data = get_data(f"{path}/_data.json")
    if data["type"] != "file":
        return FileNotFoundError

    basename = get_file_basename(path)
    if not os.path.isdir(f"{path}/_layouts"):
        os.mkdir(f"{path}/_layouts")

    for id, page in enumerate(layouts):
        layouts = page["boxes"]
        filename = f"{path}/_layouts/{basename}_{id}.json"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(layouts, f, indent=2, ensure_ascii=False)

# DONE
def generate_uuid(path):
    random.seed(path)
    return str(
        uuid.UUID(bytes=bytes(random.getrandbits(8) for _ in range(16)), version=4)
    )

# TODO
def delete_structure(client, path):
    """
    Delete all the files in the structure
    """
    data = get_data(path + "/_data.json")
    if data["type"] == "file":
        if data.get("indexed", False):
            files = [f"{path}/{f}" for f in os.listdir(path) if f.endswith(".txt")]
            for file in files:
                file_id = generate_uuid(file)
                client.delete_document(file_id)

    else:
        folders = [
            f"{path}/{f}" for f in os.listdir(path) if os.path.isdir(f"{path}/{f}")
        ]
        for folder in folders:
            delete_structure(client, folder)


# TODO
def get_filesystem(path, private_session=None, is_private=False):
    """
    :param path: path to the folder
    """
    files = get_structure(path, private_session, is_private)
    info = get_structure_info(path, private_session, is_private)

    if files is None:
        if path != FILES_PATH and PRIVATE_PATH not in path:
            files = {path: []}
        else:
            files = {"files": []}

    return {**files, "info": info}


# TODO
def get_ocr_size(path):
    """
    Get the size of the hocr files

    :param path: path to the folder
    :return: size of the files
    """

    files = [
        f"{path}/{f}"
        for f in os.listdir(path)
        if os.path.isfile(os.path.join(path, f)) and ".json" in f
    ]
    size = 0
    for file in files:
        size += os.path.getsize(file)

    if size < 1024:
        return f"{size} B"
    elif size < 1024**2:
        return f"{size / 1024:.2f} KB"
    elif size < 1024**3:
        return f"{size / 1024 ** 2:.2f} MB"
    else:
        return f"{size / 1024 ** 3:.2f} GB"

# TODO
def get_size(path, path_complete=False):
    """
    Get the size of the file

    :param path: path to the file
    :return: size of the file
    """

    name = path.split("/")[-1]
    if not path_complete:
        path = f"{path}/{name}"

    size = os.path.getsize(path)

    if size < 1024:
        return f"{size} B"
    elif size < 1024**2:
        return f"{size / 1024:.2f} KB"
    elif size < 1024**3:
        return f"{size / 1024 ** 2:.2f} MB"
    else:
        return f"{size / 1024 ** 3:.2f} GB"

# TODO
def get_folder_info(path, private_session=None):
    """
    Get the info of the folder
    :param path: path to the folder
    """
    info = {}
    data = get_data(f"{path}/_data.json")
    if "type" not in data:
        return {}

    if data["type"] == "file" and ("progress" not in data or data["progress"] == True):
        data["size"] = get_size(path)

    # sanitize important paths from the info key
    path = path.replace(f"{PRIVATE_PATH}/{private_session}", "").replace(PRIVATE_PATH, "").replace(FILES_PATH, "")
    info[path] = data
    return info

# TODO
def get_structure_info(path, private_session=None, is_private=False):
    """
    Get the info of each file/folder
    """
    if not is_private and PRIVATE_PATH in path: raise FileNotFoundError

    info = {}

    for root, folders, _ in os.walk(path):
        root = root.replace("\\", "/")
        for folder in folders:
            # ignore reserved folders
            if folder.startswith('_'): continue
            # ignore possible private path folders
            if not is_private and (PRIVATE_PATH in root or folder in PRIVATE_PATH): continue
            # if in a private session, ignore folders not from this private session
            if is_private and not f"{PRIVATE_PATH}/{private_session}" in root: continue

            folder_path = f"{root}/{folder}".replace("\\", "/")

            folder_info = get_folder_info(folder_path, private_session)

            info = {**info, **folder_info}

    return info

# TODO
def get_structure(path, private_session=None, is_private=False):
    """
    Put the file system structure in a dict
    {
        'files': [
            {
                'folder1': ['file.pdf']
            },
            {
                'folder2': []
            }
        ]
    }

    :param path: the path to the files
    """
    if not is_private and PRIVATE_PATH in path: raise FileNotFoundError

    filesystem = {}
    if path == FILES_PATH or path == f"{PRIVATE_PATH}/{private_session}":
        name = "files"
    else:
        name = path.split("/")[-1]
        data = get_data(f"{path}/_data.json")
        if "type" not in data:
            return None
        if data["type"] == "file":
            return name

    contents = []
    # ignore reserved folders that start with '_'
    folders = sorted([f for f in os.listdir(path) if os.path.isdir(f"{path}/{f}") and not f.startswith('_')])
    for folder in folders:
        # ignore possible private path folders
        if not is_private and folder in PRIVATE_PATH: continue
        # if in a private session, ignore folders not from this private session
        if is_private and not f"{PRIVATE_PATH}/{private_session}" in f"{path}/{folder}": continue

        folder = f"{path}/{folder}"
        file = get_structure(folder, private_session, is_private)

        if file is not None:
            contents.append(file)

    filesystem[name] = contents
    return filesystem

##################################################
# FILES UTILS
##################################################
# DONE
def get_page_count(filename):
    """
    Get the number of pages of a file
    """

    extension = filename.split(".")[-1]
    if extension == "pdf":
        with open(filename, "rb") as f:
            return len(pdfium.PdfDocument(f))
            # return len(PdfReader(f).pages)
    elif extension in ["jpg", "jpeg"]:
        return 1

# DONE
def get_file_basename(filename):
    """
    Get the basename of a file

    :param file: file name
    :return: basename of the file
    """
    return ".".join(filename.replace("\\", "/").split("/")[-1].split(".")[:-1])

# DONE
def get_file_extension(filename):
    """
    Get the extension of a file

    :param file: file name
    :return: extension of the file
    """
    return filename.split(".")[-1]

##################################################
# OCR UTILS
##################################################
# DONE
def get_data(file):
    if not os.path.exists(file): raise FileNotFoundError
    with open(file, encoding="utf-8") as f:
        text = f.read()
        if text == "":
            return {}
        return json.loads(text)

# DONE
def update_data(file, data):
    """
    Update the data file
    @param file: path to the data file
    @param data: data to update
    """

    previous_data = get_data(file)
    with open(file, "w", encoding="utf-8") as f:
        previous_data.update(data)
        json.dump(previous_data, f, ensure_ascii=False, indent=2)

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

        log.info(f"{path}: A preparar páginas")

        if extension == "pdf":
            pdf = pdfium.PdfDocument(f"{path}/{basename}.pdf")
            for i in range(len(pdf)):
                page = pdf[i]
                bitmap = page.render(300 / 72)  # turn PDF page into 300 DPI bitmap
                pil_image = bitmap.to_pil()
                pil_image.save(f"{path}/{basename}_{i}.jpg", dpi=(300, 300))

            pdf.close()

        elif extension in ["jpeg", "jpg"]:
            img = Image.open(f"{path}/{basename}.{extension}")
            img.save(f"{path}/{basename}.jpg", "JPEG")
    except Exception as e:

        data_folder = f"{path}/_data.json"
        data = get_data(data_folder)
        data["ocr"] = data.get("ocr", {})
        data["ocr"]["exceptions"] = str(e)
        update_data(data_folder, data)
        log.error(f"Error in preparing OCR for file at {path}: {e}")
        raise e
