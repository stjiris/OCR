"""
   Functions used to export the files to the client

   Possible formats of output:
   - pure .txt
   - .txt with delimiters between pages
   - .pdf with transparent layer of text
"""
import base64
import contextlib
import csv
import io
import json
import os
import re
import zlib

from pathlib import Path
from PIL import Image
from pdf2image import convert_from_path
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.pagesizes import letter

def json_to_text(json_d):
    """
    Convert json to text
    :param json_d: json with the hOCR data
    :return: text
    """
    return "\n".join([" ".join([w["text"] for w in l]) for l in json_d]).strip()


def get_file_basename(filename):
    """
    Get the basename of a file

    :param file: file name
    :return: basename of the file
    """
    return ".".join(filename.split("/")[-1].split(".")[:-1])


####################################################
# GENERAL FUNCTION
####################################################
def export_file(path, filetype, delimiter=None):
    """
    Direct to the correct function based on the filetype

    :param path: the path to the file
    :param filetype: the filetype to export to
    :param delimiter: the delimiter to use between pages
    """

    func = globals()[f"export_{filetype}"]
    if delimiter is None:
        return func(path)

    return func(path, delimiter)


####################################################
# EXPORT TXT FUNCTIONS
####################################################
def export_txt(path, delimiter=None):
    """
    Export the file as a .txt file

    :param path: the path to the file
    :param delimiter: the delimiter to use between pages
    :return: the path to the exported file
    """

    filename = f"{path}/_text.txt"
    ocr_folder = f"{path}/ocr_results"

    files = [
        os.path.join(ocr_folder, f)
        for f in os.listdir(ocr_folder)
        if os.path.isfile(os.path.join(ocr_folder, f)) and ".json" in f
    ]

    if len(files) > 1:
        files = sorted(files, key=lambda x: int(re.findall(r"\d+", x)[-1]))

    with open(filename, "w", encoding="utf-8") as f:
        for id, file in enumerate(files):
            with open(file, encoding="utf-8") as _f:
                hOCR = json.load(_f)
                f.write(f"----- PAGE {(id+1):04d} -----\n\n")
                f.write(json_to_text(hOCR) + "\n\n")

    return filename

####################################################
# EXPORT CSV FUNCTIONS
####################################################

def export_csv(filename_csv, index_data):
    with open(filename_csv, mode='w', encoding='utf-8') as csvfile:
        csv_out = csv.writer(csvfile)
        csv_out.writerow(['Word', 'Count'])
        csv_out.writerow([' '])
        csv_out.writerows(index_data)
        
    return filename_csv

####################################################
# EXPORT PDF FUNCTIONS
####################################################
def export_pdf(path):
    """
    Export the file as a .pdf file
    """
    filename = f"{path}/_search.pdf"
    filename_csv = f"{path}/_index.csv"

    if os.path.exists(filename) and os.path.exists(filename_csv):
        return filename      
    else:
        pdf_basename = get_file_basename(path)
        pages = convert_from_path(
            f"{path}/{pdf_basename}.pdf",
            paths_only=True,
            output_folder=path,
            fmt="jpg",
            thread_count=2,
            dpi=150
        )

        for i, page in enumerate(pages):
            if os.path.exists(f"{path}/{pdf_basename}_{i}$.jpg"):
                os.remove(page)
            else:
                Path(page).rename(f"{path}/{pdf_basename}_{i}$.jpg")

        words = {}

        load_invisible_font()

        pdf = Canvas(filename, pageCompression=1, pagesize=letter)
        pdf.setCreator("hocr-tools")
        pdf.setTitle(filename)

        dpi_original = 200
        dpi_compressed = 150  # Adjust the DPI value for positioning and scaling

        filenames_asterisk = [x for x in os.listdir(path) if x.endswith("$.jpg")]
        images = sorted(filenames_asterisk, key=lambda x: int(re.search(r'_(\d+)\$', x).group(1)))
        for image in images:
            image_basename = get_file_basename(image)
            image_basename = image_basename[:-1]
            hocr_path = f"{path}/ocr_results/{image_basename}.json"

            im = Image.open(f"{path}/{image}")
            w, h = im.size
            pdf.setPageSize((w, h))
            pdf.drawImage(f"{path}/{image}", 0, 0, width=w, height=h)

            new_words = add_text_layer(pdf, hocr_path, h, dpi_original, dpi_compressed)

            for word in new_words:
                words[word] = words.get(word, 0) + new_words[word]

            pdf.showPage()

        # Sort the `words` dict by key
        words = [(k, v) for k, v in sorted(words.items(), key=lambda item: item[0].lower() + item[0])]
        export_csv(filename_csv, words)

        rows = 100
        cols = 3
        size = 15
        margin = 20

        word_count = len(words)

        for id in range(0, word_count, rows * cols):
            pdf.setPageSize((w, h))

            x, y = margin, h - margin

            set_words = words[id: id + rows * cols]

            available_height = h - 2 * margin

            max_rows = available_height // size

            rows = (len(set_words) - 1) // cols + 1
            rows = min(max_rows, rows) 
            for col in range(cols):
                for row in range(rows):
                    index = col * rows + row
                    if index >= len(set_words):
                        break

                    word = set_words[index]
                    text = pdf.beginText()
                    text.setTextRenderMode(0)
                    text.setFont("Helvetica", size)
                    text.setTextOrigin(x, y)
                    text.textLine(f"{word[0]} ({word[1]})")
                    pdf.drawText(text)

                    y -= size

                y = h - margin
                x += (w - 2 * margin) // cols

            pdf.showPage()

        pdf.save()

        # Delete compressed images
        for compressed_image in os.listdir(path):
            if compressed_image.endswith("$.jpg"):
                os.remove(os.path.join(path, compressed_image))

        return filename

def find_index_words(hocr_path):
    index_words = {}
    remove_chars = "«»“”.,;:!?()[]{}\"'"
    with open(hocr_path) as f:
        hocrfile = json.load(f)

    hyphenated_last_word = False

    for line_index, line in enumerate(hocrfile):
        if hyphenated_last_word:
            previous_word = hocrfile[line_index - 1][-1]["text"]
            current_word = line[0]["text"]
            joined_word = previous_word.rstrip("-") + current_word
            line[0]["text"] = joined_word
            hyphenated_last_word = False

            # Remove subwords of the joined word from the index
            if index_words.get(previous_word, 0) != 0:
                index_words[previous_word] = index_words.get(previous_word, 0) - 1
                if index_words[previous_word] == 0:
                    del index_words[previous_word]

        for i, word in enumerate(line):
            rawtext = word["text"]

            if (i == len(line) - 1) and rawtext.endswith("-"):
                hyphenated_last_word = True

            for w in rawtext.split():
                w = w.strip()
                for c in remove_chars:
                    w = w.replace(c, "")

                w = w.lower()

                index_words[w] = index_words.get(w, 0) + 1

    return index_words


def add_text_layer(pdf, hocr_path, height, dpi_original, dpi_compressed):
    """Draw an invisible text layer for OCR data"""
   
    index_words = find_index_words(hocr_path)

    with open(hocr_path) as f:
        hocrfile = json.load(f)

    for line in hocrfile:
        for word in line:
            rawtext = word["text"]
            box = word["box"]
            b = word["b"]

            font_width = pdf.stringWidth(rawtext, "invisible", 8)
            if font_width <= 0:
                continue

            text = pdf.beginText()
            text.setTextRenderMode(3)  # double invisible
            text.setFont("invisible", 8)
            x_offset = box[0] * dpi_compressed / dpi_original  # Adjust X offset
            y_offset = height - b * dpi_compressed / dpi_original  # Adjust Y offset
            text.setTextOrigin(x_offset, y_offset)
            box_width = (box[2] - box[0]) * dpi_compressed / dpi_original
            width_scale = 100.0 * box_width / font_width  # Adjust width scaling
            text.setHorizScale(width_scale)
            text.textLine(rawtext)
            pdf.drawText(text)

    return index_words

def polyval(poly, x):
    return x * poly[0] + poly[1]


# Glyphless variation of vedaal's invisible font retrieved from
# http://www.angelfire.com/pr/pgpf/if.html, which says:
# 'Invisible font' is unrestricted freeware. Enjoy, Improve, Distribute freely
def load_invisible_font():
    font = """
eJzdlk1sG0UUx/+zs3btNEmrUKpCPxikSqRS4jpfFURUagmkEQQoiRXgAl07Y3vL2mvt2ml8APXG
hQPiUEGEVDhWVHyIC1REPSAhBOWA+BCgSoULUqsKcWhVBKjhzfPU+VCi3Flrdn7vzZv33ryZ3TUE
gC6chsTx8fHck1ONd98D0jnS7jn26GPjyMIleZhk9fT0wcHFl1/9GRDPkTxTqHg1dMkzJH9CbbTk
xbWlJfKEdB+Np0pBswi+nH/Nvay92VtfJp4nvEztUJkUHXsdksUOkveXK/X5FNuLD838ICx4dv4N
I1e8+ZqbxwCNP2jyqXoV/fmhy+WW/2SqFsb1pX68SfEpZ/TCrI3aHzcP//jitodvYmvL+6Xcr5mV
vb1ScCzRnPRPfz+LsRSWNasuwRrZlh1sx0E8AriddyzEDfE6EkglFhJDJO5u9fJbFJ0etEMB78D5
4Djm/7kjT0wqhSNURyS+u/2MGJKRu+0ExNkrt1pJti9p2x6b3TBJgmUXuzgnDmI8UWMbkVxeinCw
Mo311/l/v3rF7+01D+OkZYE0PrbsYAu+sSyxU0jLLtIiYzmBrFiwnCT9FcsdOOK8ZHbFleSn0znP
nDCnxbnAnGT9JeYtrP+FOcV8nTlNnsoc3bBAD85adtCNRcsSffjBsoseca/lBE7Q09LiJOm/ttyB
0+IqcwfncJt5q4krO5k7jV7uY+5m7mPebuLKUea7iHvk48w72OYF5rvZT8C8k/WvMN/Dc19j3s02
bzPvZZv3me9j/ox5P9t/xdzPzPVJcc7yGnPL/1+GO1lPVTXM+VNWOTRRg0YRHgrUK5yj1kvaEA1E
xAWiCtl4qJL2ADKkG6Q3XxYjzEcR0E9hCj5KtBd1xCxp6jV5mKP7LJBr1nTRK2h1TvU2w0akCmGl
5lWbBzJqMJsdyaijQaCm/FK5HqspHetoTtMsn4LO0T2mlqcwmlTVOT/28wGhCVKiNANKLiJRlxqB
F603axQznIzRhDSq6EWZ4UUs+xud0VHsh1U1kMlmNwu9kTuFaRqpURU0VS3PVmZ0iE7gct0MG/8+
2fmUvKlfRLYmisd1w8pk1LSu1XUlryM1MNTH9epTftWv+16gIh1oL9abJZyjrfF5a4qccp3oFAcz
Wxxx4DpvlaKKxuytRDzeth5rW4W8qBFesvEX8RFRmLBHoB+TpCmRVCCb1gFCruzHqhhW6+qUF6tC
pL26nlWN2K+W1LhRjxlVGKmRTFYVo7CiJug09E+GJb+QocMCPMWBK1wvEOfRFF2U0klK8CppqqvG
pylRc2Zn+XDQWZIL8iO5KC9S+1RekOex1uOyZGR/w/Hf1lhzqVfFsxE39B/ws7Rm3N3nDrhPuMfc
w3R/aE28KsfY2J+RPNp+j+KaOoCey4h+Dd48b9O5G0v2K7j0AM6s+5WQ/E0wVoK+pA6/3bup7bJf
CMGjwvxTsr74/f/F95m3TH9x8o0/TU//N+7/D/ScVcA=
""".encode(
        "latin1"
    )
    uncompressed = bytearray(zlib.decompress(base64.b64decode(font)))
    ttf = io.BytesIO(uncompressed)
    setattr(ttf, "name", "(invisible.ttf)")
    pdfmetrics.registerFont(TTFont("invisible", ttf))
