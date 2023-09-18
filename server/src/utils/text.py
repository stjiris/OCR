from PyMultiDictionary import MultiDictionary, DICT_EDUCALINGO

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

def compare_dicts_words(words, languages):
    """
    Function used to compare the words of a dictionary with the words of the OCR

    :param words: the words of the dictionary
    :param languages: the languages of the dictionary
    :return: the words of the OCR that are in the dictionary
    """

    # Get the words of the OCR
    result = {word: False for word in words}
    dictionary = MultiDictionary(*words)

    for language in languages:
        dictionary.set_words_lang(language)

        r = dictionary.get_meanings(dictionary=DICT_EDUCALINGO)
        for id, w in enumerate(r):
            if any(w): 
                result[words[id]] = True
            else:
                print(words[id], w)

    return result