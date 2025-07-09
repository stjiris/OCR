import os
from enum import Enum

from tempfile import NamedTemporaryFile
from pytesseract import pytesseract
from lxml import etree
from lxml import html

from src.utils.parse_hocr import parse_hocr


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


TESSERACT_OUTPUTS = (
    "hocr",
    "pdf",
    'tsv',
    "txt",
    "xml",
)

EXTENSION_TO_CONFIG = {
    #'box': '-c tessedit_create_boxfile=1 batch.nochop makebox',
    'hocr': '-c tessedit_create_hocr=1',
    'pdf': '-c tessedit_create_pdf=1',
    'tsv': '-c tessedit_create_tsv=1',
    'txt': '-c tessedit_create_txt=1',
    'xml': '-c tessedit_create_alto=1',
}


def _read_output(filename: str) -> bytes | None:
    if os.path.isfile(filename):
        with open(filename, 'rb') as output_file:
            return output_file.read()
    else:
        return None


def _get_segment_hocr(page, lang: str, config_str: str, segment_coordinates):
    cropped_image = page.crop(segment_coordinates)
    return _run_and_get_multiple_output(cropped_image, lang=lang, extensions=["hocr"], config_str=config_str)


def _get_hocr(page, lang: str, config_str: str, extensions: list[str] = None):
    if extensions is None:
        extensions = ["hocr"]
    return _run_and_get_multiple_output(page, lang=lang, extensions=extensions, config_str=config_str)


def _run_and_get_multiple_output(
    image,
    lang: str,
    extensions: list[str],
    config_str: str,
    nice: int = 0,
    timeout: int = 0) -> dict[str, bytes] | None:
    extensions = [ext for ext in extensions if ext in TESSERACT_OUTPUTS]
    # hOCR required for building PDFs indirectly
    if "hocr" not in extensions:
        extensions.append("hocr")

    out_config = ' '.join(
        EXTENSION_TO_CONFIG.get(out_ext, '') for out_ext in extensions
    ).strip()
    if out_config:
        config = f'{config_str} {out_config}'
    else:
        config = config_str

    with NamedTemporaryFile(prefix='tess_', delete=False) as f:
        image, extension = pytesseract.prepare(image)
        input_file_name = f'{f.name}_input{os.extsep}{extension}'
        image.save(input_file_name, format=image.format)
        temp_name = f.name

        kwargs = {
            'input_filename': input_file_name,
            'output_filename_base': temp_name,
            'extension': ' '.join(extensions),
            'lang': lang,
            'config': config,
            'nice': nice,
            'timeout': timeout,
        }

        pytesseract.run_tesseract(**kwargs)
        result = dict.fromkeys(extensions)
        for out_ext in extensions:
            result[out_ext] = _read_output(f"{kwargs['output_filename_base']}{os.extsep}{out_ext}")

        # delete temporary file
        pytesseract.cleanup(f.name)
        return result


def get_structure(page, lang: str, config_str: str = '', output_types: list[str] = None, segment_box=None):
    if segment_box:
        raw_results = _get_segment_hocr(page, lang, config_str, segment_coordinates=segment_box)
    else:
        raw_results = _get_hocr(page, lang, config_str, extensions=output_types)

    hocr = etree.fromstring(raw_results["hocr"], html.XHTMLParser())
    lines = parse_hocr(hocr, segment_box)

    return lines, raw_results


def verify_params(config):
    errors = []
    if "lang" in config:
        for lang in config["lang"]:
            if lang not in LANGS:
                errors.append(f'Língua: "{config["lang"]}"')
    if "engineMode" in config and config["engineMode"] not in ENGINE_MODES:
        errors.append(f'Modo do motor: "{config["engineMode"]}"')
    if "segmentMode" in config and config["segmentMode"] not in SEGMENT_MODES:
        errors.append(f'Segmentação: "{config["segmentMode"]}"')
    if "thresholdMethod" in config and config["thresholdMethod"] not in THRESHOLD_METHODS:
        errors.append(f'Thresholding: "{config["thresholdMethod"]}"')
    if "outputs" in config:
        for format in config["outputs"]:
            if format not in OUTPUTS:
                errors.append(f'Formato de resultado: "{config["outputs"]}"')
    if "dpi" in config:
        if not isinstance(config["dpi"], (int, str)):
            errors.append(f'DPI: "{config["outputs"]}"')

    return len(errors) == 0, errors
