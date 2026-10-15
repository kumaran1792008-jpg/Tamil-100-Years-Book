#!/usr/bin/env python3
"""
Tamil Heritage AI - Database Initialization and Seeding
Creates tables matching specification:
- books
- pages
- transcriptions
- correction_candidates
- dictionary_entries
- audit_history
Seeds authentic historical Tamil dictionaries and demo books.
"""

import os
import sys
import json
import sqlite3
import datetime

DB_PATH = "/data/tamil_heritage.db"

def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")

    # 1. Books Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        publication_year INTEGER,
        source TEXT,
        original_file_path TEXT,
        total_pages INTEGER DEFAULT 1,
        processed_pages INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
    );
    """)

    # 2. Pages Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        original_image_path TEXT NOT NULL,
        enhanced_image_path TEXT,
        processing_status TEXT DEFAULT 'unprocessed',
        created_at TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
    """)

    # 3. Transcriptions Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transcriptions (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL UNIQUE,
        original_ocr_text TEXT,
        reviewed_text TEXT,
        ocr_engine TEXT DEFAULT 'Tesseract OCR (tam)',
        ocr_confidence REAL DEFAULT 0.0,
        is_verified INTEGER DEFAULT 0,
        verified_by TEXT,
        verified_at TEXT,
        words_data TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    """)

    # 4. Correction Candidates Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS correction_candidates (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL,
        word_index INTEGER,
        char_index INTEGER,
        bbox TEXT,
        original_text TEXT NOT NULL,
        proposed_text TEXT NOT NULL,
        evidence TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        decision TEXT DEFAULT 'pending',
        reviewer_note TEXT,
        image_supported INTEGER DEFAULT 1,
        dictionary_supported INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    """)

    # 5. Dictionary Entries Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dictionary_entries (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL UNIQUE,
        meaning TEXT NOT NULL,
        alternate_spellings TEXT,
        source_reference TEXT,
        period TEXT DEFAULT 'சங்க காலம் / பழைமை'
    );
    """)

    # 6. Audit History Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS audit_history (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL,
        previous_text TEXT,
        updated_text TEXT,
        action TEXT NOT NULL,
        reviewer_note TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    """)

    # Seed Classical Tamil Dictionary
    seed_dictionary(cur)

    # Seed Historical Books
    seed_books(cur)

    conn.commit()
    conn.close()
    print(json.dumps({"success": True, "db_path": DB_PATH}))

def seed_dictionary(cur):
    historical_words = [
        ("ஒல்கா", "தளராத, குறையாத, கெடாத நிலை (எ.கா: ஒல்காப் பெரும்புகழ் தொல்காப்பியன்)", "ஒல்காத", "தொல்காப்பியம் சிறப்புப் பாயிரம்"),
        ("யாணர்", "புதிய வருவாய், புது நலம், எக்காலத்தும் புதியதாக இருக்கும் செழிப்பு", "யாணர்த்து", "புறநானூறு ௧௩௭, நற்றிணை"),
        ("அமிர்து", "அமிழ்தம் என்பதன் பழந்தமிழ்ச் சொல்; இறவாமை தரும் உணவு, இனிமையான பொருள்", "அமிழ்து, அமுது", "திருக்குறள் ௧௧, பரிபாடல்"),
        ("துப்பு", "உணவு, வலிமை, பற்றுக்கோடு, நன்மை (எ.கா: துப்பார்க்குத் துப்பாய துப்பாக்கி)", "துப்பார்", "திருக்குறள் ௧௨"),
        ("வாலறிவன்", "தூய மெய்யறிவுடைய பரம்பொருள், வரம்பில் மெய்யறிவுடையோன்", "வாலறிவு", "திருக்குறள் ௨"),
        ("தொழாஅர்", "தொழாதவர் என்பதன் அளபெடை வடிவம் (செய்யுளிசை அளபெடை)", "தொழார்", "தொல்காப்பியம் எழுத்ததிகாரம்"),
        ("தூஉம்", "தூவும் என்பதன் இன்னிசை அளபெடை; மழை பொழிதலைக் குறிக்கும் சொல்", "தூவும்", "திருக்குறள் ௧௨"),
        ("கைக்கிளை", "ஒருதலைக் காமம்; எழுவகையான அகப்பொருள் திணைகளில் ஒன்று", "கைக்கிளைத்திணை", "தொல்காப்பியம் பொருளதிகாரம் ௧"),
        ("பெருந்திணை", "பொருந்தாக் காமம்; அகத்திணை ஏழனுள் இறுதியான பகுதி", "பெருந்திணைத்திணை", "தொல்காப்பியம் பொருளதிகாரம்"),
        ("புணர்தல்", "தலைவனும் தலைவியும் அன்பினால் ஒன்றுபடுதல்; குறிஞ்சித்திணைக்குரிய உரிப்பொருள்", "புணர்ச்சி", "அகநானூறு"),
        ("ஓம்பல்", "பாதுகாத்தல், காத்து நிற்றல், நீக்குதல் (எ.கா: அறனோம்பல்)", "ஓம்புதல்", "திருக்குறள் ௩௧"),
        ("ஞாலம்", "பூமி, உலகம், உருண்டையான புவிப்பரப்பு", "ஞாலத்து", "புறநானூறு, மணிமேகலை"),
        ("கழறி", "கடிந்து கூறி, அறிவுறுத்தி, தெளிவுபடுத்தி உரைத்தல்", "கழறுதல்", "சிலப்பதிகாரம்"),
        ("மருதம்", "வயலும் வயல் சார்ந்த நிலப்பகுதியும்; ஊடலும் ஊடல் நிமித்தமும்", "மருதநிலம்", "தொல்காப்பியம்"),
        ("செவ்வேள்", "முருகப்பெருமான், சிவந்த ஒளியுடைய இறை வடிவம்", "வேள்", "பரிபாடல்"),
        ("சான்றோர்", "அறிவு, ஒழுக்கம், பண்பு, வீரம் ஆகியவற்றில் நிறைவுபெற்ற பெருமக்கள்", "சான்றாண்மை", "நற்றிணை, கலித்தொகை"),
        ("தொல்காப்பியம்", "தமிழின் மிகப்பழமையான இலக்கண நூல் (எழுத்து, சொல், பொருள் அதிகாரங்களை உடையது)", "தொல்காப்பியனார்", "சென்னைப் பேரகரமுதலி (Tamil Lexicon)")
    ]

    for idx, (word, meaning, alts, source) in enumerate(historical_words):
        entry_id = f"dict_{idx+1:03d}"
        cur.execute("""
        INSERT OR IGNORE INTO dictionary_entries (id, word, meaning, alternate_spellings, source_reference)
        VALUES (?, ?, ?, ?, ?)
        """, (entry_id, word, meaning, alts, source))

def seed_books(cur):
    now = datetime.datetime.utcnow().isoformat() + "Z"

    # Book 1: திருக்குறள் பரிமேலழகர் உரை
    b1_id = "book_thirukkural_1912"
    cur.execute("""
    INSERT OR IGNORE INTO books (id, title, author, publication_year, source, original_file_path, total_pages, processed_pages, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        b1_id,
        "திருக்குறள் பரிமேலழகர் உரை",
        "திருவள்ளுவர் (உரை: பரிமேலழகர்)",
        1912,
        "சென்னை ரிப்பன் அச்சுக்கூடம் — அரிய வரலாற்றுப் பதிப்பு",
        "/data/uploads/original/thirukkural_1912.pdf",
        2,
        2,
        "in_review",
        now
    ))

    # Page 1
    p1_id = f"{b1_id}_p1"
    cur.execute("""
    INSERT OR IGNORE INTO pages (id, book_id, page_number, original_image_path, enhanced_image_path, processing_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        p1_id,
        b1_id,
        1,
        "/data/uploads/pages/thirukkural_1912_page_001.png",
        "/data/uploads/enhanced/thirukkural_1912_page_001_enhanced.png",
        "ocr_completed",
        now
    ))

    # Page 2
    p2_id = f"{b1_id}_p2"
    cur.execute("""
    INSERT OR IGNORE INTO pages (id, book_id, page_number, original_image_path, enhanced_image_path, processing_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        p2_id,
        b1_id,
        2,
        "/data/uploads/pages/thirukkural_1912_page_002.png",
        None,
        "ocr_completed",
        now
    ))

    # Book 2: தொல்காப்பியம் பொருளதிகாரம்
    b2_id = "book_tolkappiyam_1920"
    cur.execute("""
    INSERT OR IGNORE INTO books (id, title, author, publication_year, source, original_file_path, total_pages, processed_pages, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        b2_id,
        "தொல்காப்பியம் — பொருளதிகாரம்",
        "தொல்காப்பியனார் (உரை: நச்சினார்க்கினியர்)",
        1920,
        "மதுரைத் தமிழ்ச் சங்க வெளியீடு — வரலாற்று ஆவணம்",
        "/data/uploads/original/tolkappiyam_1920.pdf",
        1,
        1,
        "ocr_completed",
        now
    ))

    # Page 1 of Book 2
    p3_id = f"{b2_id}_p1"
    cur.execute("""
    INSERT OR IGNORE INTO pages (id, book_id, page_number, original_image_path, enhanced_image_path, processing_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        p3_id,
        b2_id,
        1,
        "/data/uploads/pages/tolkappiyam_1920_page_001.png",
        None,
        "ocr_completed",
        now
    ))

    # Initial Transcription for Page 1
    t1_text = """திருக்குறள் பரிமேலழகர் உரை பக்கம் ௧
அறத்துப்பால் — பாயிரவியல்
௧. கடவுள் வாழ்த்து

அகர முதல எழுத்தெல்லாம் ஆதி
பகவன் முதற்றே உலகு. (௧)

பரிமேலழகர் உரை: எழுத்துக்களுக்கெல்லாம் அகரவெழுத்து முதலாவதுபோல,
உலகத்திற்கு ஆதிபகவன் முதலாகின்றான். எழுத்துக்களுக்கு முதன்மை வடிவாலும்
ஒலியாலும் இயல்பாக உண்டானதுபோல உலகத்திற்குப் பரம்பொருள் முதன்மை என்றார்.
இதனால் இறைவனது உண்மை நிலையும் ஆதிமுதல்மையும் உணர்த்தப்பட்டது.

கற்றதனா லாய பயனென்கொல் வாலறிவன்
நற்றாள் தொழாஅர் எனின். (௨)

உரை: மெய்யுணர்வுடைய தூய அறிவுடையானது சிறந்த திருவடிகளைத்
தொழாரெனின், அவர் நூல்களைக் கற்றதனால் ஆய பயன் யாதுமில்லையாம்.
வாலறிவன் என்பது தூய பேரறிவினையுடைய இறைவனைக்குறிக்கும் சொற்றொடர்."""

    cur.execute("""
    INSERT OR IGNORE INTO transcriptions (id, page_id, original_ocr_text, reviewed_text, ocr_engine, ocr_confidence, is_verified, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"trans_{p1_id}",
        p1_id,
        t1_text,
        t1_text,
        "Tesseract OCR (tam)",
        92.0,
        0,
        now
    ))

    # Add realistic correction candidates for Page 1
    # Example: candidate 1 for 'தொழாஅர்' (alapedai classical form)
    cur.execute("""
    INSERT OR IGNORE INTO correction_candidates (id, page_id, word_index, char_index, bbox, original_text, proposed_text, evidence, confidence, decision, reviewer_note, image_supported, dictionary_supported, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"cand_{p1_id}_1",
        p1_id,
        47,
        0,
        json.dumps({"x": 335, "y": 793, "w": 163, "h": 36}),
        "தொழாஅர்",
        "தொழார்",
        "மரபுவழிச் செய்யுளிசை அளபெடை வடிவம் (தொழாஅர்). நவீன வடிவம் 'தொழார்' ஆயினும் மூல நூலின் பழைமை பேணப்பட வேண்டும்.",
        81.0,
        "pending",
        "அளபெடை எழுத்து தெளிவாக மூலத்தில் காணப்படுகிறது, மாற்றலாகாது.",
        1,
        1,
        now
    ))

    # Example: candidate 2 for ancient ligature / number '(\u0be8)'
    cur.execute("""
    INSERT OR IGNORE INTO correction_candidates (id, page_id, word_index, char_index, bbox, original_text, proposed_text, evidence, confidence, decision, reviewer_note, image_supported, dictionary_supported, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        f"cand_{p1_id}_2",
        p1_id,
        49,
        0,
        json.dumps({"x": 628, "y": 790, "w": 47, "h": 33}),
        "(௨)",
        "(2)",
        "தமிழ் மரபு எண் ௨ (இரண்டு). நவீன அரபு எண்ணாக மாற்றப்படக் கூடாது.",
        96.0,
        "accepted",
        "தமிழ் எண் ௨ மூலத்தின்படியே காக்கப்பட வேண்டும்.",
        1,
        1,
        now
    ))

    # Page 1 audit history
    cur.execute("""
    INSERT OR IGNORE INTO audit_history (id, page_id, previous_text, updated_text, action, reviewer_note, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        f"audit_{p1_id}_1",
        p1_id,
        "OCR முதற்கட்ட செயலாக்கம் நிறைவுற்றது",
        "உரைக் கோப்பு உருவாக்கப்பட்டது",
        "ocr_initialization",
        "Tesseract OCR tam இயந்திரம் மூலம் 76 சொற்கள் அடையாளம் காணப்பட்டன.",
        now
    ))

if __name__ == "__main__":
    init_database()
