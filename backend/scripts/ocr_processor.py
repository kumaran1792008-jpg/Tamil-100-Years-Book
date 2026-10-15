#!/usr/bin/env python3
"""
Tamil Heritage AI - Real Tamil OCR Processing Engine
Integrates Tesseract OCR with Tamil ('tam') language model.
Extracts genuine text, word confidences, and bounding boxes.
Strict Anti-Hallucination: Never replaces or invents characters.
"""

import sys
import os
import json
import argparse
import pytesseract
from PIL import Image

def check_ocr_availability():
    """Verify Tesseract binary and Tamil language availability."""
    try:
        version = pytesseract.get_tesseract_version()
        langs = pytesseract.get_languages()
        has_tam = 'tam' in langs
        return {
            "available": has_tam,
            "engine": "Tesseract OCR",
            "version": str(version),
            "installed_languages": langs,
            "tamil_supported": has_tam,
            "missing_dependency": None if has_tam else "tesseract-ocr-tam (Tamil language pack)"
        }
    except Exception as e:
        return {
            "available": False,
            "engine": "Tesseract OCR",
            "version": None,
            "installed_languages": [],
            "tamil_supported": False,
            "missing_dependency": f"Tesseract executable not found or failed: {str(e)}"
        }

def run_ocr(image_path, crop_dir=None, min_confidence_threshold=70):
    diag = check_ocr_availability()
    if not diag["available"]:
        return {
            "success": False,
            "error": "Tamil OCR engine unavailable",
            "diagnostics": diag,
            "full_text": "",
            "words": [],
            "stats": {
                "total_words": 0,
                "low_confidence_words": 0,
                "average_confidence": 0
            }
        }

    if not os.path.exists(image_path):
        return {"success": False, "error": f"Image file not found: {image_path}"}

    try:
        img = Image.open(image_path)
        img_width, img_height = img.size

        # Custom config: Tamil language, page segmentation mode 3 (fully automatic page segmentation)
        # OEM 1: Neural nets LSTM engine only
        config = '--oem 1 --psm 3'
        
        # Get TSV-like dictionary data
        data = pytesseract.image_to_data(img, lang='tam', config=config, output_type=pytesseract.Output.DICT)
        
        # Also get plain text
        raw_text = pytesseract.image_to_string(img, lang='tam', config=config).strip()

        words = []
        n_boxes = len(data['text'])
        total_conf = 0
        valid_word_count = 0
        low_conf_count = 0

        for i in range(n_boxes):
            word_text = data['text'][i].strip()
            conf_str = data['conf'][i]
            try:
                conf = float(conf_str)
            except (ValueError, TypeError):
                conf = -1.0

            if not word_text or conf < 0:
                continue

            valid_word_count += 1
            total_conf += conf
            is_low_conf = conf < min_confidence_threshold
            if is_low_conf:
                low_conf_count += 1

            left = max(0, data['left'][i])
            top = max(0, data['top'][i])
            width = data['width'][i]
            height = data['height'][i]

            # Bounding box relative percentages for responsive UI overlays
            bbox_pct = {
                "left": round((left / img_width) * 100, 2),
                "top": round((top / img_height) * 100, 2),
                "width": round((width / img_width) * 100, 2),
                "height": round((height / img_height) * 100, 2)
            }

            word_obj = {
                "index": len(words),
                "text": word_text,
                "confidence": round(conf, 1),
                "is_low_confidence": is_low_conf,
                "line_num": data['line_num'][i],
                "block_num": data['block_num'][i],
                "bbox": {
                    "x": left,
                    "y": top,
                    "w": width,
                    "h": height
                },
                "bbox_pct": bbox_pct
            }
            words.append(word_obj)

        avg_conf = round(total_conf / valid_word_count, 1) if valid_word_count > 0 else 0.0

        return {
            "success": True,
            "engine": "Tesseract OCR (tam)",
            "diagnostics": diag,
            "full_text": raw_text,
            "image_dimensions": {"width": img_width, "height": img_height},
            "words": words,
            "stats": {
                "total_words": valid_word_count,
                "low_confidence_words": low_conf_count,
                "average_confidence": avg_conf,
                "verified_word_count": 0
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"OCR extraction error: {str(e)}",
            "diagnostics": diag
        }

def main():
    parser = argparse.ArgumentParser(description="Tamil OCR Engine")
    parser.add_argument("--image", help="Input image path")
    parser.add_argument("--diagnostics", action="store_true", help="Check engine status")
    parser.add_argument("--threshold", type=int, default=70, help="Low confidence threshold")
    args = parser.parse_args()

    if args.diagnostics:
        diag = check_ocr_availability()
        print(json.dumps(diag))
        return

    if not args.image:
        print(json.dumps({"success": False, "error": "No image specified"}))
        return

    result = run_ocr(args.image, min_confidence_threshold=args.threshold)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
