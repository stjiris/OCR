import cv2
import os
import numpy as np
import glob
import logging as log
import hdbscan
from src.utils.export import get_file_basename
from src.utils.file import save_file_layouts

##################################################
# IMAGE UTILS
##################################################
def find_lines(
    threshold, regions=None, direction="horizontal", line_scale=15, iterations=0
):
    """Finds horizontal and vertical lines by applying morphological
    transformations on an image.
    Parameters
    ----------
    threshold : object
        numpy.ndarray representing the thresholded image.
    regions : list, optional (default: None)
        List of page regions that may contain tables of the form x1,y1,x2,y2
        where (x1, y1) -> left-top and (x2, y2) -> right-bottom
        in image coordinate space.
    direction : string, optional (default: 'horizontal')
        Specifies whether to find vertical or horizontal lines.
    line_scale : int, optional (default: 15)
        Factor by which the page dimensions will be divided to get
        smallest length of lines that should be detected.
        The larger this value, smaller the detected lines. Making it
        too large will lead to text being detected as lines.
    iterations : int, optional (default: 0)
        Number of times for erosion/dilation is applied.
        For more information, refer `OpenCV's dilate <https://docs.opencv.org/2.4/modules/imgproc/doc/filtering.html#dilate>`_.
    Returns
    -------
    dmask : object
        numpy.ndarray representing pixels where vertical/horizontal
        lines lie.
    lines : list
        List of tuples representing vertical/horizontal lines with
        coordinates relative to a left-top origin in
        image coordinate space.
    """
    lines = []

    if direction == "vertical":
        size = threshold.shape[0] // line_scale
        el = cv2.getStructuringElement(cv2.MORPH_RECT, (1, size))
    elif direction == "horizontal":
        size = threshold.shape[1] // line_scale
        el = cv2.getStructuringElement(cv2.MORPH_RECT, (size, 1))
    elif direction is None:
        raise ValueError("Specify direction as either 'vertical' or 'horizontal'")

    if regions is not None:
        region_mask = np.zeros(threshold.shape)
        for region in regions:
            x, y, w, h = region
            region_mask[y : y + h, x : x + w] = 1
        threshold = np.multiply(threshold, region_mask)

    threshold = cv2.erode(threshold, el)
    threshold = cv2.dilate(threshold, el)
    dmask = cv2.dilate(threshold, el, iterations=iterations)

    try:
        _, contours, _ = cv2.findContours(
            threshold.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
    except ValueError:
        # for opencv backward compatibility
        contours, _ = cv2.findContours(
            threshold.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        x1, x2 = x, x + w
        y1, y2 = y, y + h
        if direction == "vertical":
            lines.append(((x1 + x2) // 2, y2, (x1 + x2) // 2, y1))
        elif direction == "horizontal":
            lines.append((x1, (y1 + y2) // 2, x2, (y1 + y2) // 2))

    return dmask, lines

def remove_lines(image, vertical_mask, horizontal_mask):
    lines = vertical_mask + horizontal_mask
    # note this is a horizontal kernel
    kernel = np.ones((5, 5), np.uint8)  
    lines = cv2.dilate(lines, kernel, iterations=2)
    image = cv2.adaptiveThreshold(image, 255,     
           cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    image = cv2.bitwise_or(image, lines, mask=None)
    return image

def findCorners(image):
    """
    features from Accelerated Segment Test (FAST) Corner detection
    :parm image:
    : retrun 
    """
    pos_corners = []
    pos_corners_xy = []
    
    fast = cv2.FastFeatureDetector_create()
    kp = fast.detect(image, None)
    w = 1
    h = 1
    for cnt in kp:
        x, y = cnt.pt
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x, y])
    return pos_corners, pos_corners_xy, kp

def merge_boxes(boxes):
        for key in boxes.keys():
            box = boxes[key]
            if len(box) > 0:
                new_pos = [max(0, min(box[:, 0]-5)), max(0, min(box[:,   
                1]-5)), max(box[:, 2]+5), max(box[:, 3]+5)]
                boxes[key] = new_pos
        return boxes

def parse_image(img_path):
    img = cv2.imread(img_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    ret, thresh1 = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU | cv2.THRESH_BINARY_INV)

    threshold_inv = cv2.adaptiveThreshold(
            np.invert(gray),
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            15,
            -2,
        )

    vertical_mask, vertical_segments = find_lines(
                    threshold_inv,
                    regions=None,
                    direction="vertical",
                    line_scale=15,
                    iterations=0,
                )
                
    horizontal_mask, horizontal_segments = find_lines(
        threshold_inv,
        regions=None,
        direction="horizontal",
        line_scale=15,
        iterations=0,
    )

    image_remove_line = remove_lines(thresh1, vertical_mask, horizontal_mask)

    pos_corners, pos_corners_xy, kp = findCorners(image_remove_line) 
    thresh_inv = 255-image_remove_line
    contours, hierarchy = cv2.findContours(thresh_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x, y])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x+w, y+h])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x+w, y])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x, y+h])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x+w/2, y+h/2])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x, y+h/2])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x+w/2, y])
        
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x+w, y+h/2])
        
        pos_corners.append([x, y, x+w, y+h])
        pos_corners_xy.append([x+w/2, y+h])

    data_hdbsan = np.array(pos_corners_xy)
    height = max(data_hdbsan[:, 1]) - min(data_hdbsan[:, 1])
    width = max(data_hdbsan[:, 0]) - min(data_hdbsan[:, 0])
    data_hdbsan[:, 0] = data_hdbsan[:, 0]/width
    data_hdbsan[:, 1] = data_hdbsan[:, 1]/height
    hdb = hdbscan.HDBSCAN(min_cluster_size=5, min_samples=5, cluster_selection_epsilon=0.025)
    hdb.fit (data_hdbsan)
    n_clusters = len(set(hdb.labels_)) - (1 if -1 in hdb.labels_ else 0 )
    pos_corners = np.array(pos_corners)
    rects = {}

    for i in range(n_clusters):
        group = pos_corners[hdb.labels_ == i]
        rects[i] = group

    mer_boxes = merge_boxes(rects)
    return mer_boxes

    # img = gray.copy()
    # img = cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
    # im2 = img.copy()
    # for box in mer_boxes.values():
    #     cv2.rectangle(im2, (int(box[0]), int(box[1])), (int(box[2]),       
    #     int(box[3])),(0, 0, 255), 2)

    # cv2.imshow("shapes", im2)
    # cv2.waitKey(0)

def parse_images(path):
    pdf_basename = get_file_basename(path)
    filename = f"{path}/{pdf_basename}_0.jpg"

    if os.path.exists(filename):
        # Grab all the images already in the folder
        images = glob.glob(f"{path}/{pdf_basename}_*.jpg")
        sorted_images = sorted(images, key=lambda x: int(x.split('_')[-1].split('.')[0]))

        all_layouts = []

        for img in sorted_images:
            mer_boxes = parse_image(img)
            formatted_boxes = []

            for box in mer_boxes.values():
                left, top, right, bottom = box
                formatted_box = {
                    "top": top,
                    "left": left,
                    "bottom": bottom,
                    "right": right
                }
                formatted_boxes.append(formatted_box)

            all_layouts.append({"boxes": formatted_boxes})

        layouts_path = f"{path}/layouts"
        if not os.path.isdir(layouts_path):
            os.mkdir(layouts_path)

        sorted_all_layouts = []
        for layout in all_layouts:
            # This orders the segments based on typical reading order: top-left to bottom-right.
            sorted_layout = sorted(layout['boxes'], key=lambda c: (c['top'], c['left']))
            sorted_all_layouts.append({'boxes': sorted_layout})
        save_file_layouts(path, sorted_all_layouts)
    else:
        log.error(f"Error in parsing images at {path}")
