#!/usr/bin/env python3
"""
Tamil Heritage AI - PDF Multi-Page Document Extractor
Extracts all pages from historical Tamil PDF documents as high-resolution PNGs.
"""

import sys
import os
import json
import argparse
import pymupdf

def extract_pdf_pages(pdf_path, output_dir, max_pages=50):
    if not os.path.exists(pdf_path):
        return {"success": False, "error": f"PDF file not found: {pdf_path}"}

    try:
        doc = pymupdf.open(pdf_path)
        total_pages = len(doc)
        pages_to_extract = min(total_pages, max_pages)
        extracted = []

        os.makedirs(output_dir, exist_ok=True)
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]

        # 300 DPI matrix for crisp Tamil character rendering (default 72 -> scale factor ~4.16)
        zoom = 300.0 / 72.0
        matrix = pymupdf.Matrix(zoom, zoom)

        for page_idx in range(pages_to_extract):
            page = doc.load_page(page_idx)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            page_num = page_idx + 1
            filename = f"{base_name}_page_{page_num:03d}.png"
            file_path = os.path.join(output_dir, filename)
            pix.save(file_path)

            extracted.append({
                "page_number": page_num,
                "file_path": file_path,
                "filename": filename,
                "width": pix.width,
                "height": pix.height
            })

        doc.close()

        return {
            "success": True,
            "total_pages": total_pages,
            "extracted_count": len(extracted),
            "pages": extracted
        }
    except Exception as e:
        return {"success": False, "error": f"PDF extraction failed: {str(e)}"}

def main():
    parser = argparse.ArgumentParser(description="Extract pages from PDF")
    parser.add_argument("--pdf", required=True, help="Input PDF file")
    parser.add_argument("--output-dir", required=True, help="Directory to save page images")
    parser.add_argument("--max-pages", type=int, default=50, help="Max pages to extract")
    args = parser.parse_args()

    result = extract_pdf_pages(args.pdf, args.output_dir, args.max_pages)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
