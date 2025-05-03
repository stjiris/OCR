import re

from os import extsep
from tempfile import NamedTemporaryFile

from pytesseract import pytesseract
from lxml import etree
from lxml import html

TESSERACT_OUTPUTS = (
    "hocr",
    "pdf",
    'tsv',
    "txt",
    "xml",
)

EXTENTION_TO_CONFIG = {
    #'box': '-c tessedit_create_boxfile=1 batch.nochop makebox',
    'hocr': '-c tessedit_create_hocr=1',
    'pdf': '-c tessedit_create_pdf=1',
    'tsv': '-c tessedit_create_tsv=1',
    'xml': '-c tessedit_create_alto=1',
}


def _read_output(filename: str) -> bytes:
    with open(filename, 'rb') as output_file:
        return output_file.read()


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
        EXTENTION_TO_CONFIG.get(out_ext, '') for out_ext in extensions
    ).strip()
    if out_config:
        config = f'{config_str} {out_config}'
    else:
        config = config_str
    result = None
    try:
        with NamedTemporaryFile(prefix='tess_', delete=False) as f:
            image, extension = pytesseract.prepare(image)
            input_file_name = f'{f.name}_input{extsep}{extension}'
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
                result[out_ext] = _read_output(f"{kwargs['output_filename_base']}{extsep}{out_ext}")
    finally:
        # delete temporary file
        pytesseract.cleanup(f.name)
        return result


def is_left(point_a, point_b, point_c):
    dx = 5
    return ((point_b[0] + dx) - (point_a[0] + dx)) * (point_c[1] - point_a[1]) - (point_b[1] - point_a[1]) * (point_c[0] - (point_a[0] + dx)) >= 0


def remove_extra_paragraphs(lines):
    new_lines = [lines[0]]
    start_coords = [(line[0]["box"][0], line[0]["box"][1]) for line in lines]

    if len(set(x[0] for x in start_coords)) == 1:
        # All vertical join all lines
        for i in range(1, len(lines)):
            line = lines[i]
            new_lines[0].extend(line)

    else:
        for i in range(1, len(lines)):
            if is_left(start_coords[0], start_coords[-1], start_coords[i]):
                new_lines[-1].extend(lines[i])
            else:
                new_lines.append(lines[i])

    return new_lines


def get_structure(page, lang: str, config_str: str = '', output_types: list[str] = None, segment_box=None):
    if segment_box:
        raw_results = _get_segment_hocr(page, lang, config_str, segment_coordinates=segment_box)
    else:
        raw_results = _get_hocr(page, lang, config_str, extensions=output_types)
    p1 = re.compile(r"bbox((\s+\d+){4})")
    p2 = re.compile(r"baseline((\s+[\d\.\-]+){2})")

    hocr = etree.fromstring(raw_results["hocr"], html.XHTMLParser())

    lines = []

    for line in hocr.xpath('//*[@class="ocr_line"]'):
        linebox = p1.search(line.attrib["title"]).group(1).split()
        try:
            baseline = p2.search(line.attrib["title"]).group(1).split()
        except AttributeError:
            baseline = [0, 0]
        linebox = [float(i) for i in linebox]
        baseline = [float(i) for i in baseline]

        words = []

        xpath_elements = './/*[@class="ocrx_word"]'
        if not (line.xpath("boolean(" + xpath_elements + ")")):
            # if there are no words elements present,
            # we switch to lines as elements
            xpath_elements = "."

        for word in line.xpath(xpath_elements):
            rawtext = word.text_content().strip()
            if rawtext == "":
                continue

            box = p1.search(word.attrib["title"]).group(1).split()

            if segment_box:
                box = [float(i) + segment_box[id%2] for id, i in enumerate(box)]
            else:
                box = [float(i) for i in box]
            b = polyval(baseline, (box[0] + box[2]) / 2 - linebox[0]) + linebox[3]

            words.append({"text": rawtext, "box": box, "b": b})

        if words:
            lines.append(words)

    if segment_box and lines:
        lines = remove_extra_paragraphs(lines)

    return lines, raw_results


def polyval(poly, x):
    return x * poly[0] + poly[1]
