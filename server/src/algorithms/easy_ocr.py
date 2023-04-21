# import easyocr
import numpy as np


def get_boxes(page, config):
    """
    Get the text and boxes from a list of pages

    @param pages: list of pages
    """
    # return easyocr.Reader(config).readtext(np.array(page), slope_ths=0)
    return []


def get_structure(page, config):
    # TODO this is not working properly
    boxes = get_boxes(page, config)
    words = []
    for box in boxes:
        box, text, _ = box
        words.append((text, list(map(int, [*box[0], *box[2]]))))

    print(box)

    ranges = {}
    for w in words:
        _, box = w
        y_min, y_max = box[1], box[3]
        diff = y_max - y_min

        for k in ranges:
            if y_max in range(*k):
                ranges[k].append(w)
                break
        else:
            ranges[(y_max - diff // 2, y_max + diff // 2)] = [w]

    lines = []
    for k in ranges:
        line = []
        for w in sorted(ranges[k], key=lambda x: x[1][0]):
            line.append(
                {
                    "text": w[0],
                    "box": list(map(float, w[1])),
                    "b": float(ranges[k][0][1][3]),
                }
            )

        lines.append(line)

    return lines
