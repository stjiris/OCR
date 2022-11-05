import re, cv2

##################################################
# IMAGE UTILS
##################################################
def distance_between_coords(x1, y1, x2, y2):
    """
    Calculate the distance difference between two points
    """
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 1/2

def filter_contours(contours):
    """
    Filter contours (overlapping areas)

    @param contours: dict of contours
    """

    data, keeping = [], []

    # Store the following data: (x, y, w, h, area)
    for k, contour in contours.items():
        data.append((k, cv2.contourArea(contour)))

    # Sort by area
    # (assuming that bigger areas can encapsulate smaller ones so those should be secured first)
    data.sort(key=lambda x: x[1], reverse=True)

    # Iterate over all the contours
    for info in data:
        # print(keeping)
        coords, _ = info
        x, y, w, h = coords

        # Check if the current contour is inside any of the previous ones stored
        for k in keeping:
            x2, y2, w2, h2 = k
            # If the current contour is inside, delete it
            if x2 <= x <= x2 + w2 and y2 <= y <= y2 + h2:
                del contours[coords]
                break

            # If distance between the current contour and the previous one is too small, delete it
            if distance_between_coords(x, y, x2, y2) < 20:
                del contours[coords]
                break
        else:
            # If not inside, add it to the list
            keeping.append(coords)

def parse_image():
    import cv2
    import numpy as np
    from matplotlib import pyplot as plt
    from pdf2image import convert_from_path

    pages = convert_from_path("server/file_uploads/J1_75.pdf", 200)

    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 0, 255)]

    # reading image
    img = np.array(pages[0])
    
    # converting image into grayscale image
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    reshaped_image = cv2.resize(gray, (500, 700))
    cv2.imshow('shapes', reshaped_image)
    cv2.waitKey(0)
    
    # setting threshold of gray image
    _, threshold = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)
    
    # using a findContours() function
    contours, _ = cv2.findContours(
        threshold, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    i = 0

    keeping_contours = {}
    for contour in contours:
        if i == 0:
            i = 1
            continue

        # if cv2.contourArea(contour) < 2000: continue
        x, y, w, h = cv2.boundingRect(contour)

        # if w < 200 and h < 200: continue
        # if x < 25 or y < 25: continue

        approx = cv2.approxPolyDP(
            contour, 0.01 * cv2.arcLength(contour, True), True)

        # if len(approx) > 10: continue

        keeping_contours[(x, y, w, h)] = contour

    filter_contours(keeping_contours)
    for id, (_, v) in enumerate(keeping_contours.items()):
        cv2.drawContours(img, [v], 0, colors[id%4], 5)

    print(keeping_contours.keys())

    reshaped_image = cv2.resize(img, (500, 700))
    cv2.imshow('shapes', reshaped_image)
    cv2.waitKey(0)            

# parse_image()