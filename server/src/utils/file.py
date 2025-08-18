import json
import os
import random
import re
import uuid
from datetime import datetime
from json import JSONDecodeError
from os import environ

import pytz
import requests

# from string import punctuation

FILES_PATH = environ.get("FILES_PATH", "_files")
TEMP_PATH = environ.get("TEMP_PATH", "_pending-files")
PRIVATE_PATH = environ.get("PRIVATE_PATH", "_files/_private_sessions")
API_TEMP_PATH = environ.get("API_TEMP_PATH", "_files/_tmp")

ALLOWED_EXTENSIONS = (
    "pdf",
    "jpg",
    "jpeg",
    "jfif",
    "pjpeg",
    "pjp",  # JPEG
    "png",
    "tiff",
    "tif",  # TIFF
    "bmp",
    "gif",
    "webp",
    "pnm",  # image/x-portable-anymap
    "jp2",  # JPEG 2000
    "zip",
)

IMAGE_PREFIX = environ.get("IMAGE_PREFIX", "")
TIMEZONE = pytz.timezone("Europe/Lisbon")

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
    with open(f"{path}/_export/_txt.txt", "rb") as file:
        r = requests.post(
            "https://iris.sysresearch.org/anonimizador/from-text",
            files={"file": file},
        )
    try:
        ner = r.json()
    except JSONDecodeError:
        return False

    if r.status_code == 200:
        with open(f"{path}/_export/_entities.json", "w", encoding="utf-8") as f:
            json.dump(ner, f, indent=2, ensure_ascii=False)
        return True
    else:
        return False


def get_current_time():
    """
    Get the current time in the correct format

    :return: current time
    """
    return datetime.now().astimezone(TIMEZONE).strftime("%d/%m/%Y %H:%M:%S")


def get_file_parsed(path, is_private):
    """
    Return the text off all the pages of the file

    :param path: path to the file
    :return: list with the text of each page
    """
    extension = path.split(".")[-1].lower()
    page_extension = (
        ".png" if (extension == "pdf" or extension == "zip") else f".{extension}"
    )
    url_prefix = IMAGE_PREFIX + (
        "/private/" if is_private else "/images/"
    )  # TODO: secure private session images

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
                        t = w["text"]  # .lower().strip()
                        """
                        # ignoring isolated punctuation and digits affects the editing interface,
                        # since they get excluded from the "words" array and won't appear when looked for

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
                        """

                        if t in words:
                            words[t]["pages"].append(id)
                        else:
                            words[t] = {"pages": [id], "syntax": True}
            if is_private:
                file = re.sub(f"^{PRIVATE_PATH}", "", file)
            else:
                file = re.sub(f"^{FILES_PATH}", "", file)

            data.append(
                {
                    "original_file": file,
                    "content": hocr,
                    "page_number": int(basename.split("_")[-1]),
                    "page_url": url_prefix
                    + "/".join(file.split("/")[1:-2])
                    + f"/_pages/{basename}"
                    + page_extension,
                }
            )
    return data, words


def get_file_layouts(path, is_private):
    data = get_data(f"{path}/_data.json")
    layouts = []
    basename = get_file_basename(path)
    extension = path.split(".")[-1].lower()
    page_extension = (
        ".png" if (extension == "pdf" or extension == "zip") else f".{extension}"
    )
    url_prefix = IMAGE_PREFIX + (
        f"/private/{path.replace(PRIVATE_PATH, '')}"
        if is_private
        else f"/images/{path.replace(FILES_PATH, '')}"
    )

    for page in range(data["pages"]):
        filename = f"{path}/_layouts/{basename}_{page}.json"
        page_url = url_prefix + f"/_pages/{basename}_{page}" + page_extension

        if os.path.exists(filename):
            with open(filename, encoding="utf-8") as f:
                layouts.append(
                    {
                        "boxes": json.load(f),
                        "page_url": page_url,
                        "page_number": page,
                        "done": True,
                    }
                )
        else:
            layouts.append(
                {"boxes": [], "page_url": page_url, "page_number": page, "done": False}
            )

    return layouts


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


def generate_uuid(path):
    random.seed(path)
    return str(
        uuid.UUID(bytes=bytes(random.getrandbits(8) for _ in range(16)), version=4)
    )


def generate_random_uuid():
    return uuid.uuid4().hex


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
def get_filesystem(path, private_session: str = None, is_private: bool = False) -> dict:
    """
    :param path: path to the folder
    :param private_session: name of the private session, if applicable
    :param is_private: whether the target path is a private session
    """
    files = get_structure(path, private_session, is_private)
    info = get_structure_info(path, private_session, is_private)

    if files is None:
        if path != FILES_PATH and PRIVATE_PATH not in path:
            files = {path: []}
        else:
            files = {"files": []}

    return {**files, "info": info}


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


def get_folder_info(path, private_session=None):
    """
    Get the info of the folder
    :param path: path to the folder
    """
    info = {}
    try:
        data = get_data(f"{path}/_data.json")
    except (FileNotFoundError, JSONDecodeError):
        return {}

    if "type" not in data:
        return {}

    if data["type"] == "file" and ("stored" not in data or data["stored"] is True):
        data["size"] = get_size(path)

    elif data["type"] == "folder":
        n_files = len([f for f in os.scandir(path) if not f.name.startswith("_")])
        data["contents"] = n_files

    # sanitize important paths from the info key
    path = (
        path.replace(f"{PRIVATE_PATH}/{private_session}", "")
        .replace(PRIVATE_PATH, "")
        .replace(FILES_PATH, "")
        .strip("/")
    )
    info[path] = data
    return info


def get_structure_info(path, private_session=None, is_private=False):
    """
    Get the info of each file/folder
    """
    if not is_private and PRIVATE_PATH in path:
        raise FileNotFoundError
    if API_TEMP_PATH in path:
        raise FileNotFoundError

    info = {}

    for root, folders, _ in os.walk(path, topdown=True):
        root = root.replace("\\", "/")
        # ignore reserved folders by pruning them from search tree
        folders[:] = [f for f in folders if not f.startswith("_")]
        if root.split("/")[-1].startswith("_"):
            continue
        # ignore possible private path folders
        if not is_private and (PRIVATE_PATH in root or root in PRIVATE_PATH.split("/")):
            continue
        # if in a private session, ignore folders not from this private session
        if is_private and f"{PRIVATE_PATH}/{private_session}" not in root:
            continue

        folder_path = root.replace("\\", "/")
        folder_info = get_folder_info(folder_path, private_session)
        info = {**info, **folder_info}
    return info


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
    if not is_private and PRIVATE_PATH in path:
        raise FileNotFoundError
    if API_TEMP_PATH in path:
        raise FileNotFoundError

    filesystem = {}
    if path == FILES_PATH or path == f"{PRIVATE_PATH}/{private_session}":
        name = "files"
    else:
        name = path.split("/")[-1]

        try:
            data = get_data(f"{path}/_data.json")
        except (FileNotFoundError, JSONDecodeError):
            return None

        if "type" not in data:
            return None
        if data["type"] == "file":
            return name

    contents = []
    # ignore reserved folders that start with '_'
    folders = sorted(
        [
            f
            for f in os.listdir(path)
            if os.path.isdir(f"{path}/{f}") and not f.startswith("_")
        ]
    )
    for folder in folders:
        # ignore possible private path folders
        if not is_private and folder in PRIVATE_PATH.split("/"):
            continue
        # if in a private session, ignore folders not from this private session
        if is_private and f"{PRIVATE_PATH}/{private_session}" not in f"{path}/{folder}":
            continue

        folder = f"{path}/{folder}"
        file = get_structure(folder, private_session, is_private)

        if file is not None:
            contents.append(file)

    filesystem[name] = contents
    return filesystem


##################################################
# FILES UTILS
##################################################


def get_page_count(target_path, extension):
    """
    Get the number of pages of a file
    """
    if extension in ("pdf", "zip", "tif", "tiff"):
        return len(os.listdir(f"{target_path}/_pages"))
    elif extension in ALLOWED_EXTENSIONS:  # some other than pdf or zip
        return 1
    return None


def get_file_basename(filename):
    """
    Get the basename of a file

    :param file: file name
    :return: basename of the file
    """
    basename = ".".join(filename.replace("\\", "/").split("/")[-1].split(".")[:-1])
    if basename == "":
        # no extension, get entire filename.
        # files submitted through API call are stored in a folder named with a UUID,
        # and original document's basename is the same UUID
        basename = filename.replace("\\", "/").split("/")[-1]
    return basename


def get_file_extension(filename):
    """
    Get the extension of a file

    :param file: file name
    :return: extension of the file
    """
    return filename.split(".")[-1]


def get_page_extension_from_original(filename):
    original_extension = filename.split(".")[-1]
    if original_extension == "pdf" or original_extension == "zip":
        return "png"
    else:
        return original_extension


def json_to_text(json_d):
    """
    Convert json to text
    :param json_d: json with the hOCR data
    :return: text
    """
    lines = []
    for section in json_d:
        l = [w["text"] for l in section for w in l]
        lines.append(" ".join(l))
    return "\n".join(lines).strip()


##################################################
# OCR UTILS
##################################################


def get_data(file):
    if not os.path.exists(file):
        raise FileNotFoundError
    with open(file, encoding="utf-8") as f:
        text = f.read()
        if text == "":
            return {}
        return json.loads(text)


def get_doc_len(file) -> int:
    with open(file, encoding="utf-8") as f:
        text = f.read()
        if text == "":
            return -1
        return int(json.loads(text)["pages"])


def update_json_file(file, data):
    """
    Update the JSON data contained in the file.
    :param file: file to update
    :param data: new or updated data
    """

    # TODO: ensure atomic operations to handle multiple users making changes to the same files/folders
    previous_data = get_data(file)
    with open(file, "w", encoding="utf-8") as f:
        previous_data.update(data)
        json.dump(previous_data, f, ensure_ascii=False, indent=2)
