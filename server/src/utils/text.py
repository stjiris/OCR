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

def compare_dicts_words(words, corpus):
    """
    Function used to compare the words of a dictionary with the words of the OCR

    :param words: the words of the dictionary
    :param languages: the languages of the dictionary
    :return: the words of the OCR that are in the dictionary
    """

    dict_words = set()
    for c in corpus:
        with open(f"./corpus/{c}.txt", "r", encoding="utf-8") as f:
            for line in f:
                dict_words.add(line.strip())

    # Get the words of the OCR
    result = {word: False for word in words}

    for word in words:
        if word in dict_words:
            result[word] = True

    return result