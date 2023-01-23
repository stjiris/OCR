import os, re
from pdf2image import convert_from_path

from src.utils.text import clear_text

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

def get_txt_file(path):
    basename = os.path.basename(path).split('.')[0]
    filename = f"{path}/{basename}-Text.txt"

    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f  and "Text.txt" not in f]
    files = sorted(
        files,
        key=lambda x: int(re.findall('\d+', x)[-1])
    )

    with open(filename, "w", encoding="utf-8") as f:
        for file in files:
            page = int(re.findall('\d+', file)[-1])
            print(file, page)

            with open(file, encoding="utf-8") as _f:
                f.write(f"----- PAGE {page:04d} -----\n\n")
                f.write(_f.read().strip() + "\n\n")

    return filename

def get_file_parsed(path):
    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]

    files = sorted(
        files,
        key=lambda x: int(re.findall('\d+', x)[-1])
    )

    contents = []
    for file in files:
        with open(file, encoding="utf-8") as f:
            contents.append(f.read())

    return contents

def get_file_structure(path):
    """
    Put the file system structure in a dict
    {
        'files': [
            {
                'folder1': ['J1_75.pdf']
            },
            {
                'folder2': []
            }
        ]
    }
    """
    filesystem = {}
    last_folder = path.split("/")[-2]
    
    folders = [x for x in os.listdir(path) if os.path.isdir(f"{path}{x}/")]
    files = [x for x in os.listdir(path) if not os.path.isdir(f"{path}{x}/")]

    if not folders and files:
        if path == "./files/":
            return {"files": []}
        return last_folder

    contents_folders = []
    contents_files = []
    
    for folder in folders:
        file = get_file_structure(f"{path}{folder}/")

        if type(file) == str:
            contents_files.append(file)
        else:
            contents_folders.append(file)

    filesystem[last_folder] = contents_folders + contents_files
    return filesystem

##################################################
# FILES UTILS
##################################################
def save_pdf_full(file):
    """
    Save the full PDF file

    @param pdf_file: path to the PDF file
    """
    file.save(f"file_uploads/{file.filename}")

def get_file_basename(filename):
    """
    Get the basename of a file

    @param file: file name
    """
    return filename.split(".")[0]

def get_pdf_pages(file):
    """
    Get the pages of a PDF file

    @param pdf_file: path to the PDF file
    """
    return convert_from_path(file, 200)

def save_text_file(text, basename, path):
    """
    Save a text file

    @param text: text to save
    @param filename: name of the file
    """
    with open(f"{path}/{basename}.txt", "w", encoding="utf-8") as f:
        f.write(text)

def process_file(file, pageNumber, config, path, algorithm):
    """
    Process a file, extract the text and save the results

    @param file: file to process
    @param algorithm: algorithm to use
    """
    filename = file.split(".")[0]
    basename = get_file_basename(filename)
    pages = get_pdf_pages(f"{path}/{file}/{basename}_{pageNumber}.pdf")

    for page in pages:
        page = page.crop((0, 0, page.size[0], page.size[1] - 120))
        page.save(f"{path}/{file}/{basename}_{pageNumber}.jpg", "JPEG")
        text = clear_text(algorithm(page, config))
        save_text_file(text, basename + "_" + str(pageNumber), f"{path}/{file}")

    return text