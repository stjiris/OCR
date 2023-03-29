##################################################
# TEXT UTILS
##################################################
def clear_text(text):
    """
    Function used to clear the text from the OCR

    Current steps:
    - Remove leading and ending spaces

    :param text: the text to clear
    :return: the cleared text
    """

    # Remove leading and ending spaces
    text = text.strip()

    return text
