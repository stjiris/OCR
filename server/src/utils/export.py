"""
   Functions used to export the files to the client

   Possible formats of output:
   - pure .txt
   - .txt with delimiters between pages
   - .pdf with transparent layer of text
"""
import base64
import csv
import hashlib
import io
import json
import os
import re
import shutil
import zipfile
import zlib

import pypdfium2 as pdfium

from datetime import datetime
from pathlib import Path
from PIL import Image
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
    lines = []
    for section in json_d:
        l = [w["text"] for l in section for w in l]
        lines.append(" ".join(l))
    return "\n".join(lines).strip()

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
def export_file(path, filetype, delimiter=None, force_recreate = False, simple = False):
    """
    Direct to the correct function based on the filetype

    :param path: the path to the file
    :param filetype: the filetype to export to
    :param delimiter: the delimiter to use between pages
    """

    func = globals()[f"export_{filetype}"]
    if simple:
        return export_pdf(path, force_recreate, simple)

    if delimiter is None:
        return func(path, force_recreate)

    return func(path, delimiter, force_recreate)

####################################################
# EXPORT TXT FUNCTIONS
####################################################
def export_imgs(path, force_recreate = False):
    """
    Export the images as a .zip file

    :param path: the path to the file
    :param force_recreate: force the recreation of the file

    :return: the path to the exported file
    """
    filename = f"{path}/_images.zip"
    if os.path.exists(filename) and not force_recreate:
        return filename

    shutil.make_archive(f"{path}/_images", "zip", path, base_dir="images")
    return filename

def export_txt(path, delimiter=None, force_recreate = False):
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
def export_pdf(path, force_recreate = False, simple=False):
    """
    Export the file as a .pdf file
    """
    filename = f"{path}/_search.pdf"
    simple_filename = f"{path}/_simple.pdf"
    filename_csv = f"{path}/_index.csv"

    target = filename if not simple else simple_filename

    if os.path.exists(target) and os.path.exists(filename_csv) and not force_recreate:
        return target
    
    else:
        pdf_basename = get_file_basename(path)

        pdf = pdfium.PdfDocument(f"{path}/{pdf_basename}.pdf")
        for i in range(len(pdf)):
            page = pdf[i]
            bitmap = page.render(150 / 72)
            pil_image = bitmap.to_pil()
            pil_image.save(f"{path}/{pdf_basename}_{i}$.jpg")

        pdf.close()

        words = {}

        load_invisible_font()

        pdf = Canvas(target, pageCompression=1, pagesize=letter)
        pdf.setCreator("hocr-tools")
        pdf.setTitle(target)

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

        if not simple:
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
                try:
                    os.remove(os.path.join(path, compressed_image))
                except:
                    pass

        return target

def find_index_words(hocr_path):
    index_words = {}
    remove_chars = "«»“”.,;:!?()[]{}\"'"
    with open(hocr_path, encoding="utf-8") as f:
        hocrfile = json.load(f)

    hyphenated_last_word = False

    for section in hocrfile:
        for line_index, line in enumerate(section):
            if hyphenated_last_word:
                previous_word = section[line_index - 1][-1]["text"]
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

    with open(hocr_path, encoding="utf-8") as f:
        hocrfile = json.load(f)

    for section in hocrfile:
        for line in section:
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

####################################################
# EXPORT METS/ALTO FUNCTIONS
####################################################
def get_md5_checksum(path):
    with open(path, "rb") as f:
        data = f.read()
        return hashlib.md5(data).hexdigest()
    
    
def get_file_size(path):
    return os.path.getsize(path)


def generate_file(base_path, path, id, seq, mimetype):
    return f'<file CHECKSUMTYPE="MD5" CHECKSUM="{get_md5_checksum(path)}" GROUPID="{seq}" ID="{id}{(seq if seq != 0 else 1):05d}" MIMETYPE="{mimetype}" SEQ="{seq if seq != 0 else 1}" SIZE="{get_file_size(path)}">' + "\n\t\t\t\t" + \
            f'<FLocat LOCTYPE="OTHER" OTHERLOCTYPE="FILE" xlink:href="{path.replace(base_path, "")[1:]}"/>' + "\n\t\t\t</file>"

def create_mets_files(path):
    files_folders = [x for x in os.listdir(path)]
    basename = path.split("/")[-1]

    if basename and basename in files_folders:
        create_document_mets(path)
    else:
        for folder in files_folders:
            if not os.path.isdir(path + "/" + folder): continue
            create_mets_files(f"{path}/{folder}")

        create_folder_mets(path)

def create_folder_mets(path):
    if path == "files": return

    data_path = path + "/_data.json"
    with open(data_path, encoding="utf-8") as f:
        info = json.load(f)

    creation_date = datetime.strptime(info["creation"], "%d/%m/%Y %H:%M:%S").strftime("%Y-%m-%dT%H:%M:%S")

    folders = [x for x in os.listdir(path) if os.path.isdir(path + "/" + x) and x != "ocr_results" and x != "alto_schemas" and x != "ocr_results.zip" and x != "_mets.xml" and x != "mets.zip" and x != "ocr_results.zip"]

    fileSec = "\n\t\t".join(
        f"""<fileGrp ID="{f}" USE="TEXT">
            <file CHECKSUMTYPE="MD5" CHECKSUM="{get_md5_checksum(path + "/" + f + "/_mets.xml")}" GROUPID="0" ID="ALTO{(id+1):05d}" MIMETYPE="text/xml" SEQ="1" SIZE="{get_file_size(path + "/" + f + "/_mets.xml")}">
                <FLocat LOCTYPE="OTHER" OTHERLOCTYPE="FILE" xlink:href="{f + "/_mets.xml"}" />
            </file>
        </fileGrp>"""
        for id, f in enumerate(folders)
    )

    structMap = "\n\t\t".join(
        f"""<div TYPE="Folder" ORDER="{id+1}">
            <fptr FILEID="ALTO{(id+1):05d}"/>
        </div>"""
        for id, f in enumerate(folders)
    )

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<mets xsi:schemaLocation="http://www.loc.gov/standards/mets/version18/mets.xsd">
    <metsHdr CREATEDATE="{creation_date}">
        <agent ROLE="CREATOR" TYPE="ORGANIZATION">
            <name>INESC-ID LISBOA</name>
        </agent>
    </metsHdr>
    <dmdSec ID="DM1">
        <mdWrap MDTYPE="MODS">
            <xmlData>
                <mods>
                    <titleInfo>
                        <title>{path.split("/")[-1]}</title>
                    </titleInfo>
                </mods>
            </xmlData>
        </mdWrap>
    </dmdSec>
    <amdSec>
        <techMD ID="techMD1">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>text/xml</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
    </amdSec>
    <fileSec>
        {
            fileSec
        }
    </fileSec>
    <structMap ID="SM1" LABEL="Physical Structure" TYPE="PHYSICAL">
        {
            structMap
        }
    </structMap>
</mets>"""

    with open(f"{path}/_mets.xml", "w") as f:
        f.write(xml)

def create_document_mets(path):
    if not os.path.isdir(f"{path}/alto_schemas"):
        os.mkdir(f"{path}/alto_schemas")

    data_path = "/".join(path.split("/")[:-1]) + "/_data.json"
    with open(data_path, encoding="utf-8") as f:
        info = json.load(f)

    # Check if all files are ready to be extracted
    for k in info:
        if type(info[k]) == dict:
            if "complete" in info[k] and info[k]["complete"]: continue
            if "progress" in info[k] and info[k]["progress"] == info["pages"]: continue

            raise ValueError("Error: Not all files are ready to be extracted")

    single_files = [x for x in os.listdir(path) if os.path.isfile(path + "/" + x) and not x.endswith(".json") and not x.endswith(".zip") and not x.endswith(".xml") and not x.endswith(".jpg")]
    extensions = [x.split(".")[-1] for x in single_files]

    structMap = ""

    files = [f"{path}/ocr_results/{f}" for f in os.listdir(f"{path}/ocr_results") if f.endswith(".json")]

    for id, file in enumerate(files):
        export_alto(file)
        structMap += f'\t\t\t<div TYPE="Page" ORDER="{id+1}">' + \
            f'\n\t\t\t\t<fptr FILEID="JPG{(id+1):05d}"/>' + \
            f'\n\t\t\t\t<fptr FILEID="ALTO{(id+1):05d}"/>' + \
            '\n\t\t\t</div>\n'

    jpg_grp = "\n\t\t\t".join(
        generate_file(path, f.replace("/ocr_results", "").replace(".json", ".jpg"), "IMG", id + 1, "image/jpeg")
        for id, f in enumerate(files)
    )

    alto_grp = "\n\t\t\t".join(
        generate_file(path, f.replace("/ocr_results", "/alto_schemas").replace(".json", ".xml"), "ALTO", id + 1, "text/xml")
        for id, f in enumerate(files)
    )

    single_files_grps = "\n\t\t".join(
        f"""<fileGrp ID="{f.split('.')[-1].upper()}GRP{extensions[:id+1].count(f.split('.')[-1])}" USE="Text">
            <file CHECKSUM="MD5" CHECKSUM="{get_md5_checksum(path + "/" + f)}" GROUPID="0" ID="{f.split('.')[-1].upper()}{extensions[:id+1].count(f.split('.')[-1]):05d}" SEQ="1" SIZE="{get_file_size(path + "/" + f)}">
                <FLocat LOCTYPE="OTHER" OTHERLOCTYPE="FILE" xlink:href="{f}"/>
            </file>
        </fileGrp>"""
        for id, f in enumerate(single_files)
    )

    single_files_struct = "\n\t\t".join(
        f"""<div ID="DIV{id+1}" TYPE="CompleteObject">
            <fptr FILEID="{f.split('.')[-1].upper()}{extensions[:id+1].count(f.split('.')[-1]):05d}"/>
        </div>"""
        for id, f in enumerate(single_files)
    )

    creation_date = datetime.strptime(info["creation"], "%d/%m/%Y %H:%M:%S").strftime("%Y-%m-%dT%H:%M:%S")

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<mets xsi:schemaLocation="http://www.loc.gov/standards/mets/version18/mets.xsd">
    <metsHdr CREATEDATE="{creation_date}">
        <agent ROLE="CREATOR" TYPE="ORGANIZATION">
            <name>INESC-ID LISBOA</name>
        </agent>
    </metsHdr>
    <dmdSec ID="DM1">
        <mdWrap MDTYPE="MODS">
            <xmlData>
                <mods>
                    <titleInfo>
                        <title>{'.'.join(path.split("/")[-1].split(".")[:-1])}</title>
                    </titleInfo>
                </mods>
            </xmlData>
        </mdWrap>
    </dmdSec>
    <amdSec>
        <techMD ID="techMD1">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>image/jpeg</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
        <techMD ID="techMD2">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>application/pdf</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
        <techMD ID="techMD3">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>text/plain</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
        <techMD ID="techMD4">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>text/csv</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
        <techMD ID="techMD5">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>text/xml</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
        <techMD ID="techMD6">
            <mdWrap>
                <xmlData>
                    <mix>
                        <BasicDigitalObjectInformation>
                            <FormatDesignation>
                                <formatName>application/json</formatName>
                            </FormatDesignation>
                        </BasicDigitalObjectInformation>
                    </mix>
                </xmlData>
            </mdWrap>
        </techMD>
    </amdSec>
    <fileSec>
        <fileGrp ID="JPEGGRP" USE="Images">
            {
                jpg_grp
            }
        </fileGrp>
        <fileGrp ID="ALTOGRP" USE="Text">
            {
                alto_grp
            }
        </fileGrp>
        {
            single_files_grps
        }
    </fileSec>
    <structMap ID="SM1" LABEL="Physical Structure" TYPE="PHYSICAL">
        <div TYPE="Document">
{structMap}        </div>
    </structMap>
    <structMap ID="SM2" LABEL="Logical Structure" TYPE="LOGICAL">
    </structMap>
    <structMap ID="SM3" LABEL="Single File Structure" TYPE="SINGLE_FILE">
        {
            single_files_struct
        }
    </structMap>
</mets>"""

    with open(f"{path}/_mets.xml", "w") as f:
        f.write(xml)

def export_alto(path):
    with open(path, encoding="utf-8") as f:
        hocrfile = json.load(f)

    line_count = 0
    word_count = 0
    blocks = ""
    for sID, s in enumerate(hocrfile):
        blocks += f"""\t\t\t\t\t<TextBlock ID="block_{sID}">\n"""
        for l in s:
            blocks += f"""\t\t\t\t\t\t<TextLine ID="line_{line_count}">\n"""
            for w in l:
                blocks += f"""\t\t\t\t\t\t\t<String ID="word_{word_count}" HPOS="{int(w["box"][0])}" VPOS="{int(w["box"][1])}" WIDTH="{int(w["box"][2] - w["box"][0])}" HEIGHT="{int(w["box"][3] - w["box"][1])}" CONTENT="{w["text"]}"/>\n"""
                word_count += 1
            blocks += f"""\t\t\t\t\t\t</TextLine>\n"""
            line_count += 1
        blocks += f"""\t\t\t\t\t</TextBlock>\n"""

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<alto xmlns="http://www.loc.gov/standards/alto/ns-v3#" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/standards/alto/ns-v3# http://www.loc.gov/alto/v3/alto-3-0.xsd">
    <Description>
        <MeasurementUnit>pixel</MeasurementUnit>
        <sourceImageInformation>
            <fileName>{path}</fileName>
        </sourceImageInformation>
    </Description>
    <Layout>
        <Page ID="page_0">
            <PrintSpace>
                <ComposedBlock ID="composed_block_0">
{blocks}                </ComposedBlock>
            </PrintSpace>
        </Page>
    </Layout>
</alto>"""
    
    path = path.split("/")
    path[-2] = "alto_schemas"
    path[-1] = path[-1].replace(".json", ".xml")

    with open("/".join(path), "w") as f:
        f.write(xml)

def export_zip(path, _):
    create_mets_files("files")
    basename = path.split("/")[-1]
    with zipfile.ZipFile(f"{path}/{basename}.zip", "w") as zipf:
        for root, _, files in os.walk(path):
            for file in files:
                if file.endswith(".json") or file.endswith(".zip"): continue
                zipf.write(os.path.join(root, file), 
                       os.path.relpath(os.path.join(root, file), 
                                       os.path.join(path, '..')))

if __name__ == "__main__":
    export_zip("files/Test Folder")