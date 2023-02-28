import re

##################################################
# TEXT UTILS
##################################################
def clear_text(text):
    """
    Function used to clear the text from the OCR
    
    Current steps:
    - Detect changes of line in the middle of the word ex.: "pala-\nvra"
    - Remove leading and ending spaces

    :param text: the text to clear
    :return: the cleared text
    """

    if type(text) != str: return str(text)
    
    # # Detect changes of line in the middle of the word ex.: "pala-\nvra"
    # m = re.findall(r"-\n[^-]", text)
    # for i in m:
    #     text = text.replace(i, i[-1:])

    # Remove leading and ending spaces
    text = text.strip()

    return text