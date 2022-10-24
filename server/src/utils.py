import re

def clear_text(text):
    # Detect changes of line in the middle of the word ex.: "pala-\nvra"
    m = re.findall(r"-\n[^-]", text)
    for i in m:
        text = text.replace(i, i[-1:])
    return text