import re

import pytesseract
from lxml import etree
from lxml import html


def _get_segment_hocr(page, lang: str, config_str: str, segment_coordinates):
    cropped_image = page.crop(segment_coordinates)
    return pytesseract.image_to_pdf_or_hocr(
        cropped_image, lang=lang, extension="hocr", config=config_str
    )


def _get_hocr(page, lang: str, config_str: str):
    return pytesseract.image_to_pdf_or_hocr(
        page, lang=lang, extension="hocr", config=config_str
    )


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


def get_structure(page, lang: str = 'por', config_str: str = '', segment_box=None):
    if segment_box:
        hocr_original = _get_segment_hocr(page, lang, config_str, segment_box)
    else:
        hocr_original = _get_hocr(page, lang, config_str)

    p1 = re.compile(r"bbox((\s+\d+){4})")
    p2 = re.compile(r"baseline((\s+[\d\.\-]+){2})")

    hocr = etree.fromstring(hocr_original, html.XHTMLParser())

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

    return lines


def polyval(poly, x):
    return x * poly[0] + poly[1]
