#!/usr/bin/env python3
"""
Tamil Heritage AI - Real Image Preprocessing and Restoration Engine
Uses OpenCV, NumPy, and Pillow for authentic document restoration.
Guarantees NO generative hallucination or fabricated strokes.
"""

import sys
import os
import json
import argparse
import numpy as np
import cv2
from PIL import Image

def deskew_image(image):
    """Detect text line angle and deskew image."""
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()
        # Invert colors so text is white
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 100:
            return image, 0.0
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle
            
        # Bound angle to sensible document skew (-20 to 20 deg)
        if abs(angle) > 25:
            return image, 0.0
            
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated, float(round(angle, 2))
    except Exception as e:
        return image, 0.0

def reduce_stains_and_even_lighting(gray_img):
    """Normalize aged, uneven, stained paper illumination."""
    # Dilate image to capture background
    dilated = cv2.dilate(gray_img, np.ones((7, 7), np.uint8))
    bg = cv2.medianBlur(dilated, 21)
    diff = 255 - cv2.absdiff(gray_img, bg)
    norm = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8UC1)
    return norm

def process_image(input_path, output_path, options):
    if not os.path.exists(input_path):
        return {"success": False, "error": f"Input file not found: {input_path}"}

    # Load image
    img = cv2.imread(input_path)
    if img is None:
        return {"success": False, "error": "Unable to decode image using OpenCV"}

    deskew_angle = 0.0
    h, w = img.shape[:2]

    # Deskew if requested
    if options.get("deskew"):
        img, deskew_angle = deskew_image(img)

    # Manual Rotation
    rotation = options.get("rotation", 0)
    if rotation == 90:
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == 180:
        img = cv2.rotate(img, cv2.ROTATE_180)
    elif rotation == 270:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

    # Convert to grayscale
    is_grayscale = options.get("grayscale", False)
    if is_grayscale or options.get("adaptive_threshold") or options.get("clahe") or options.get("stain_reduction"):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    else:
        gray = None

    # Background stain reduction
    if options.get("stain_reduction") and gray is not None:
        gray = reduce_stains_and_even_lighting(gray)

    # Noise reduction
    if options.get("denoise"):
        if gray is not None:
            gray = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
        else:
            img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

    # Contrast enhancement (CLAHE)
    if options.get("clahe") and gray is not None:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)

    # Adaptive thresholding for aged ink extraction
    if options.get("adaptive_threshold") and gray is not None:
        # Gaussian adaptive thresholding
        gray = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8)

    # Sharpening kernel
    if options.get("sharpen"):
        target = gray if gray is not None else img
        kernel = np.array([[0, -1, 0],
                           [-1, 5, -1],
                           [0, -1, 0]])
        sharpened = cv2.filter2D(target, -1, kernel)
        if gray is not None:
            gray = sharpened
        else:
            img = sharpened

    # Final result
    final_img = gray if gray is not None else img

    # Brightness & Contrast adjustment
    brightness = options.get("brightness", 0)
    contrast = options.get("contrast", 0)
    if brightness != 0 or contrast != 0:
        # contrast range: -100 to 100 -> factor 0.0 to 2.0
        # brightness range: -100 to 100
        alpha = float((contrast + 100) / 100.0)
        beta = float(brightness)
        final_img = cv2.convertScaleAbs(final_img, alpha=alpha, beta=beta)

    # Ensure parent dir exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    cv2.imwrite(output_path, final_img)

    return {
        "success": True,
        "input_path": input_path,
        "output_path": output_path,
        "width": final_img.shape[1],
        "height": final_img.shape[0],
        "channels": 1 if len(final_img.shape) == 2 else final_img.shape[2],
        "deskew_angle": deskew_angle,
        "applied_filters": [k for k, v in options.items() if v]
    }

def main():
    parser = argparse.ArgumentParser(description="Tamil Document Image Preprocessing")
    parser.add_argument("--input", required=True, help="Input image path")
    parser.add_argument("--output", required=True, help="Output image path")
    parser.add_argument("--grayscale", action="store_true")
    parser.add_argument("--stain-reduction", action="store_true")
    parser.add_argument("--clahe", action="store_true")
    parser.add_argument("--adaptive-threshold", action="store_true")
    parser.add_argument("--denoise", action="store_true")
    parser.add_argument("--sharpen", action="store_true")
    parser.add_argument("--deskew", action="store_true")
    parser.add_argument("--brightness", type=int, default=0)
    parser.add_argument("--contrast", type=int, default=0)
    parser.add_argument("--rotation", type=int, default=0)

    args = parser.parse_args()

    options = {
        "grayscale": args.grayscale,
        "stain_reduction": args.stain_reduction,
        "clahe": args.clahe,
        "adaptive_threshold": args.adaptive_threshold,
        "denoise": args.denoise,
        "sharpen": args.sharpen,
        "deskew": args.deskew,
        "brightness": args.brightness,
        "contrast": args.contrast,
        "rotation": args.rotation
    }

    result = process_image(args.input, args.output, options)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
