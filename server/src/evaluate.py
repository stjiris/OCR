from difflib import SequenceMatcher

def evaluate(text, corrected_text):
    m = SequenceMatcher(None, text, corrected_text)
    return m.ratio()