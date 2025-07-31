from enum import Enum


class LANGS(Enum):
    DEU = "deu"
    SPA = "spa"
    FRA = "fra"
    ENG = "eng"
    POR = "por"
    EQU = "equ"
    OSD = "osd"


class ENGINE_MODES(Enum):
    TESSERACT_ONLY = 0
    LSTM_ONLY = 1
    TESSERACT_LSTM_COMBINED = 2
    DEFAULT = 3  # Default


class SEGMENT_MODES(Enum):
    OSD_ONLY = 0
    AUTO_OSD = 1
    AUTO_ONLY = 2
    AUTO = 3  # Default
    SINGLE_COLUMN = 4
    SINGLE_BLOCK_VERT_TEXT = 5
    SINGLE_BLOCK = 6
    SINGLE_LINE = 7
    SINGLE_WORD = 8
    CIRCLE_WORD = 9
    SINGLE_CHAR = 10
    SPARSE_TEXT = 11
    SPARSE_TEXT_OSD = 12
    RAW_LINE = 13
    COUNT = 14


class THRESHOLD_METHODS(Enum):
    OTSU = 0  # DEFAULT
    LEPTONICA = 1
    SAUVOLA = 2


class OUTPUTS(Enum):
    PDF_INDEXED = "pdf_indexed"
    PDF = "pdf"
    TXT = "txt"
    TXT_DELIMITED = "txt_delimited"
    CSV = "csv"
    NER = "ner"
    HOCR = "hocr"
    ALTO_XML = "xml"
