#!/usr/bin/env python3
"""
Tamil Heritage AI - Sample Historical Book Page Generator
Generates realistic 100-year-old scanned Tamil book pages with authentic
classical texts (Tirukkural 1912 edition, Tolkappiyam 1920 edition).
Adds realistic historical aging, paper grain, ink bleed, and subtle stain artifacts
so restoration, OCR, and anti-hallucination inspection work end-to-end.
"""

import os
import sys
import json
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "/data/fonts/NotoSansTamil-Regular.ttf"

def create_vintage_page(lines, title, page_no, output_path, degrade_level="medium"):
    # High-res canvas: 1200 x 1700 px (resembling an old royal octavo printed page)
    width, height = 1200, 1700
    
    # 1. Parchment / aged paper base color (cream / light sepia)
    # R: 242-248, G: 236-242, B: 218-228
    base_color = (232, 238, 244) # BGR
    canvas = np.full((height, width, 3), base_color, dtype=np.uint8)

    # 2. Add subtle vignette and edge darkening (aging on page borders)
    X, Y = np.meshgrid(np.linspace(-1, 1, width), np.linspace(-1, 1, height))
    radius = np.sqrt(X**2 + Y**2)
    vignette = 1.0 - 0.25 * np.clip((radius - 0.6) / 0.6, 0, 1)
    for c in range(3):
        canvas[:, :, c] = np.clip(canvas[:, :, c] * vignette - (1 - vignette) * 20, 0, 255).astype(np.uint8)

    # 3. Add paper fiber / grain noise
    noise = np.random.normal(0, 7, (height, width, 3)).astype(np.int16)
    canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 4. Add subtle water/aging stain patches
    cv2.circle(canvas, (980, 260), 120, (200, 215, 225), -1) # mild stain
    cv2.ellipse(canvas, (240, 1420), (140, 80), 25, 0, 360, (195, 210, 222), -1)
    canvas = cv2.GaussianBlur(canvas, (45, 45), 0)

    # 5. Render Tamil text using PIL with NotoSansTamil
    pil_img = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img)

    try:
        font_header = ImageFont.truetype(FONT_PATH, 36)
        font_body = ImageFont.truetype(FONT_PATH, 30)
        font_commentary = ImageFont.truetype(FONT_PATH, 24)
        font_footer = ImageFont.truetype(FONT_PATH, 22)
    except Exception:
        font_header = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_commentary = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # Draw ornamental top header
    # Traditional double rule
    draw.line([(120, 130), (1080, 130)], fill=(70, 55, 45), width=2)
    draw.line([(120, 136), (1080, 136)], fill=(90, 75, 65), width=1)

    # Header text
    draw.text((width // 2, 90), title, font=font_header, fill=(60, 45, 35), anchor="mm")
    draw.text((1040, 90), f"பக்கம் {page_no}", font=font_footer, fill=(70, 55, 45), anchor="rm")

    # Body lines
    y_pos = 180
    for item in lines:
        style = item.get("style", "body")
        text = item.get("text", "")
        if style == "subhead":
            y_pos += 15
            draw.text((width // 2, y_pos), text, font=font_header, fill=(75, 35, 25), anchor="mm")
            y_pos += 55
        elif style == "kural":
            y_pos += 15
            # Indented classical verse
            draw.text((200, y_pos), text, font=font_body, fill=(35, 25, 20))
            y_pos += 48
        elif style == "commentary":
            draw.text((140, y_pos), text, font=font_commentary, fill=(50, 40, 35))
            y_pos += 40
        elif style == "divider":
            y_pos += 10
            draw.line([(width // 2 - 80, y_pos), (width // 2 + 80, y_pos)], fill=(120, 100, 90), width=1)
            y_pos += 25

    # Bottom footer rule
    draw.line([(120, 1580), (1080, 1580)], fill=(90, 75, 65), width=1)
    draw.text((width // 2, 1610), "— தமிழ் மரபு சுவடிகள் மற்றும் பதிப்பகம் —", font=font_footer, fill=(100, 85, 75), anchor="mm")

    # Convert back to OpenCV
    result_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # 6. Apply slight ink bleed and age degradation
    # Gaussian blur for antique letterpress feel
    result_bgr = cv2.GaussianBlur(result_bgr, (3, 3), 0.5)

    # Slight skew rotation (e.g. 0.8 degrees typical of physical book scanners)
    (h, w) = result_bgr.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, 0.75, 1.0)
    result_bgr = cv2.warpAffine(result_bgr, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    cv2.imwrite(output_path, result_bgr)
    return output_path

def generate_default_books():
    """Generates two authentic historical Tamil books with multiple pages."""
    pages_dir = "/data/uploads/pages"

    # Book 1: திருக்குறள் பரிமேலழகர் உரை (1912 பதிப்பு)
    book1_p1_lines = [
        {"style": "subhead", "text": "அறத்துப்பால் — பாயிரவியல்"},
        {"style": "subhead", "text": "௧. கடவுள் வாழ்த்து"},
        {"style": "divider"},
        {"style": "kural", "text": "அகர முதல எழுத்தெல்லாம் ஆதி"},
        {"style": "kural", "text": "பகவன் முதற்றே உலகு. (௧)"},
        {"style": "divider"},
        {"style": "commentary", "text": "பரிமேலழகர் உரை: எழுத்துக்களுக்கெல்லாம் அகரவெழுத்து முதலாவதுபோல,"},
        {"style": "commentary", "text": "உலகத்திற்கு ஆதிபகவன் முதலாகின்றான். எழுத்துக்களுக்கு முதன்மை வடிவாலும்"},
        {"style": "commentary", "text": "ஒலியாலும் இயல்பாக உண்டானதுபோல உலகத்திற்குப் பரம்பொருள் முதன்மை என்றார்."},
        {"style": "commentary", "text": "இதனால் இறைவனது உண்மை நிலையும் ஆதிமுதல்மையும் உணர்த்தப்பட்டது."},
        {"style": "divider"},
        {"style": "kural", "text": "கற்றதனா லாய பயனென்கொல் வாலறிவன்"},
        {"style": "kural", "text": "நற்றாள் தொழாஅர் எனின். (௨)"},
        {"style": "divider"},
        {"style": "commentary", "text": "உரை: மெய்யுணர்வுடைய தூய அறிவுடையானது சிறந்த திருவடிகளைத்"},
        {"style": "commentary", "text": "தொழாரெனின், அவர் நூல்களைக் கற்றதனால் ஆய பயன் யாதுமில்லையாம்."},
        {"style": "commentary", "text": "வாலறிவன் என்பது தூய பேரறிவினையுடைய இறைவனைக்குறிக்கும் சொற்றொடர்."}
    ]
    p1_path = os.path.join(pages_dir, "thirukkural_1912_page_001.png")
    create_vintage_page(book1_p1_lines, "திருக்குறள் பரிமேலழகர் உரை", 1, p1_path)

    book1_p2_lines = [
        {"style": "subhead", "text": "௨. வான்சிறப்பு"},
        {"style": "divider"},
        {"style": "kural", "text": "வான்நின் றுலகம் வழங்கி வருதலால்"},
        {"style": "kural", "text": "தான்அமிழ்தம் என்றுணரற் பாற்று. (௧௧)"},
        {"style": "divider"},
        {"style": "commentary", "text": "பரிமேலழகர் உரை: மழை பொழிவதனால் உலகம் உயிர்வாழ்தல் தவறாது"},
        {"style": "commentary", "text": "நிகழ்ந்து வருதலால், அம் மழையே அமிழ்தம் என்றுணரப்படும் தகுதியுடையது."},
        {"style": "commentary", "text": "உயிர்களுக்கு உணவும் நீரும் மழையாலன்றி அமையாமையின் அமிழ்தெனப்பட்டது."},
        {"style": "divider"},
        {"style": "kural", "text": "துப்பார்க்குத் துப்பாய துப்பாக்கித் துப்பார்க்குத்"},
        {"style": "kural", "text": "துப்பாய தூஉம் மழை. (௧௨)"},
        {"style": "divider"},
        {"style": "commentary", "text": "உரை: உண்பார்க்குத் தக்க உணவுப் பொருள்களை விளைவித்துத் தருவதோடு,"},
        {"style": "commentary", "text": "தானும் உண்பார்க்கு இனிய உணவாகிப் பருகுவதற்கு ஆவதும் மழையே."},
        {"style": "commentary", "text": "துப்பு என்பது உணவு, வலிமை, உதவி என்னும் பொருள்களில் ஆளப்பட்டுள்ளது."}
    ]
    p2_path = os.path.join(pages_dir, "thirukkural_1912_page_002.png")
    create_vintage_page(book1_p2_lines, "திருக்குறள் பரிமேலழகர் உரை", 2, p2_path)

    # Book 2: தொல்காப்பியம் பொருளதிகாரம் (1920 நச்சினார்க்கினியர் பதிப்பு)
    book2_p1_lines = [
        {"style": "subhead", "text": "தொல்காப்பியம் — பொருளதிகாரம்"},
        {"style": "subhead", "text": "௧. அகத்திணையியல்"},
        {"style": "divider"},
        {"style": "kural", "text": "கைக்கிளை முதலா ஏழென் மொழிப"},
        {"style": "kural", "text": "பகைமை இன்றிய அகத்திணைப் பகுதியே. (௧)"},
        {"style": "divider"},
        {"style": "commentary", "text": "நச்சினார்க்கினியர் உரை: கைக்கிளை முதலாகிய பெருந்திணை இறுவாய ஏழாம்"},
        {"style": "commentary", "text": "அகப்பொருள் திணைகள் என்று இலக்கணப் புலவர்கள் கூறுவர்."},
        {"style": "commentary", "text": "அவை: கைக்கிளை, குறிஞ்சி, முல்லை, மருதம், நெய்தல், பாலை, பெருந்திணை என."},
        {"style": "commentary", "text": "பண்டைத் தமிழ் மக்களின் நிலப்பாகுபாடும் வாழ்வியல் விழுமியங்களும் இதன்மூலம்"},
        {"style": "commentary", "text": "நன்கு புலப்படுத்தப்படுகின்றன."}
    ]
    p3_path = os.path.join(pages_dir, "tolkappiyam_1920_page_001.png")
    create_vintage_page(book2_p1_lines, "தொல்காப்பியம் பொருளதிகாரம்", 1, p3_path)

    print(json.dumps({"success": True, "pages": [p1_path, p2_path, p3_path]}))

if __name__ == "__main__":
    generate_default_books()
