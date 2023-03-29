import os
from difflib import SequenceMatcher


def evaluate(filename):
    if not os.path.exists("file_fixed/" + filename):
        return -1.0

    with open("file_extracted/" + filename, encoding="utf-8") as f:
        text = f.read()

    with open("file_fixed/" + filename, encoding="utf-8") as f:
        fixed_text = f.read()

    m = SequenceMatcher(None, text, fixed_text)
    return m.ratio()
