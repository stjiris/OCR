"""
   Functions used to export the files to the client

   Possible formats of output:
   - pure .txt 
   - .txt with delimiters between pages
   - .docx (TODO)
   - .pdf with transparent layer of text (TODO)
"""

import re, os
from src.utils.file import get_file_basename

####################################################
# GENERAL FUNCTION
####################################################
def export_file(path, filetype, delimiter=None):
    """
    Direct to the correct function based on the filetype

    :param path: the path to the file
    :param filetype: the filetype to export to
    :param delimiter: the delimiter to use between pages
    """
    
    func = globals()[f"export_{filetype}"]
    if delimiter is None:
        return func(path)
    
    return func(path, delimiter)

####################################################
# EXPORT FUNCTIONS
####################################################
def export_txt(path, delimiter=None):
    """
    Export the file as a .txt file

    :param path: the path to the file
    :param delimiter: the delimiter to use between pages
    :return: the path to the exported file
    """

    basename = get_file_basename(path)
    filename = f"{path}/{basename}-Text.txt"

    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]

    if len(files) > 1:
        files = sorted(
            files,
            key=lambda x: int(re.findall('\d+', x)[-1])
        )

    with open(filename, "w", encoding="utf-8") as f:
        for id, file in enumerate(files):

            with open(file, encoding="utf-8") as _f:
                f.write(f"----- PAGE {(id+1):04d} -----\n\n")
                f.write(_f.read().strip() + "\n\n")

    return filename

def export_doc(path):
    """
    Export the file as a .doc file
    """

    pass

def export_pdf(path):
    """
    Export the file as a .pdf file
    """

    pass
