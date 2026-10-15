#!/usr/bin/env python3
"""
Tamil Heritage AI - Central Database API & Query Manager
Provides secure, parameterized operations for Books, Pages, Transcriptions,
Correction Candidates, Audit History, Dictionaries, Full-Text Search, and Analytics.
"""

import os
import sys
import json
import sqlite3
import datetime

DB_PATH = "/data/tamil_heritage.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def now_iso():
    return datetime.datetime.utcnow().isoformat() + "Z"

def handle_get_books(data):
    conn = get_conn()
    cur = conn.cursor()
    query = data.get("query", "").strip()
    status = data.get("status", "").strip()
    
    sql = "SELECT * FROM books WHERE 1=1"
    params = []
    if query:
        sql += " AND (title LIKE ? OR author LIKE ? OR source LIKE ?)"
        wild = f"%{query}%"
        params.extend([wild, wild, wild])
    if status and status != "all":
        sql += " AND status = ?"
        params.append(status)
    sql += " ORDER BY created_at DESC"
    
    cur.execute(sql, params)
    books = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"success": True, "books": books}

def handle_get_book(data):
    book_id = data.get("book_id")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    book = cur.fetchone()
    if not book:
        conn.close()
        return {"success": False, "error": "Book not found"}
    book_dict = dict(book)
    
    # Fetch pages
    cur.execute("SELECT * FROM pages WHERE book_id = ? ORDER BY page_number ASC", (book_id,))
    pages = [dict(row) for row in cur.fetchall()]
    book_dict["pages"] = pages
    conn.close()
    return {"success": True, "book": book_dict}

def handle_create_book(data):
    conn = get_conn()
    cur = conn.cursor()
    book_id = data.get("id") or f"book_{int(datetime.datetime.now().timestamp()*1000)}"
    title = data.get("title", "").strip()
    author = data.get("author", "").strip() or "அறியப்படாத ஆசிரியர்"
    pub_year = data.get("publication_year")
    source = data.get("source", "").strip()
    file_path = data.get("original_file_path", "")
    total_pages = data.get("total_pages", 1)
    status = data.get("status", "pending")
    now = now_iso()

    cur.execute("""
    INSERT INTO books (id, title, author, publication_year, source, original_file_path, total_pages, processed_pages, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (book_id, title, author, pub_year, source, file_path, total_pages, 0, status, now))
    conn.commit()
    conn.close()
    return {"success": True, "book_id": book_id}

def handle_update_book(data):
    conn = get_conn()
    cur = conn.cursor()
    book_id = data.get("book_id")
    title = data.get("title")
    author = data.get("author")
    pub_year = data.get("publication_year")
    source = data.get("source")

    cur.execute("""
    UPDATE books
    SET title = COALESCE(?, title),
        author = COALESCE(?, author),
        publication_year = COALESCE(?, publication_year),
        source = COALESCE(?, source)
    WHERE id = ?
    """, (title, author, pub_year, source, book_id))
    conn.commit()
    conn.close()
    return {"success": True}

def handle_delete_book(data):
    conn = get_conn()
    cur = conn.cursor()
    book_id = data.get("book_id")
    cur.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()
    return {"success": True}

def handle_add_page(data):
    conn = get_conn()
    cur = conn.cursor()
    page_id = data.get("id") or f"page_{int(datetime.datetime.now().timestamp()*1000)}"
    book_id = data.get("book_id")
    page_number = data.get("page_number", 1)
    orig_path = data.get("original_image_path")
    status = data.get("processing_status", "unprocessed")
    now = now_iso()

    cur.execute("""
    INSERT INTO pages (id, book_id, page_number, original_image_path, processing_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (page_id, book_id, page_number, orig_path, status, now))
    conn.commit()
    conn.close()
    return {"success": True, "page_id": page_id}

def handle_get_page(data):
    page_id = data.get("page_id")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM pages WHERE id = ?", (page_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"success": False, "error": "Page not found"}
    page_dict = dict(row)

    # Transcription
    cur.execute("SELECT * FROM transcriptions WHERE page_id = ?", (page_id,))
    t_row = cur.fetchone()
    page_dict["transcription"] = dict(t_row) if t_row else None

    # Correction candidates
    cur.execute("SELECT * FROM correction_candidates WHERE page_id = ? ORDER BY word_index ASC", (page_id,))
    page_dict["candidates"] = [dict(c) for c in cur.fetchall()]

    # Audit history
    cur.execute("SELECT * FROM audit_history WHERE page_id = ? ORDER BY timestamp DESC", (page_id,))
    page_dict["audit_history"] = [dict(a) for a in cur.fetchall()]

    conn.close()
    return {"success": True, "page": page_dict}

def handle_save_transcription(data):
    page_id = data.get("page_id")
    reviewed_text = data.get("reviewed_text", "")
    reviewer_note = data.get("reviewer_note", "")
    is_verified = 1 if data.get("is_verified") else 0
    verified_by = data.get("verified_by", "சரிபார்ப்பாளர்")
    words_data = data.get("words_data")
    now = now_iso()

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT reviewed_text FROM transcriptions WHERE page_id = ?", (page_id,))
    prev = cur.fetchone()
    prev_text = prev["reviewed_text"] if prev else ""

    if prev:
        cur.execute("""
        UPDATE transcriptions
        SET reviewed_text = ?,
            is_verified = ?,
            verified_by = CASE WHEN ? = 1 THEN ? ELSE verified_by END,
            verified_at = CASE WHEN ? = 1 THEN ? ELSE verified_at END,
            words_data = COALESCE(?, words_data),
            updated_at = ?
        WHERE page_id = ?
        """, (reviewed_text, is_verified, is_verified, verified_by, is_verified, now, json.dumps(words_data) if words_data else None, now, page_id))
    else:
        t_id = f"trans_{page_id}"
        cur.execute("""
        INSERT INTO transcriptions (id, page_id, original_ocr_text, reviewed_text, ocr_engine, is_verified, verified_by, verified_at, words_data, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (t_id, page_id, reviewed_text, reviewed_text, "Tesseract OCR (tam)", is_verified, verified_by, now if is_verified else None, json.dumps(words_data) if words_data else None, now))

    # Update page status
    status = "verified" if is_verified else "reviewed"
    cur.execute("UPDATE pages SET processing_status = ? WHERE id = ?", (status, page_id))

    # Log audit entry
    action = "page_verified" if is_verified else "transcription_edited"
    audit_id = f"audit_{int(datetime.datetime.now().timestamp()*1000)}"
    cur.execute("""
    INSERT INTO audit_history (id, page_id, previous_text, updated_text, action, reviewer_note, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (audit_id, page_id, prev_text, reviewed_text, action, reviewer_note, now))

    conn.commit()
    conn.close()
    return {"success": True, "is_verified": is_verified, "updated_at": now}

def handle_update_candidate(data):
    candidate_id = data.get("candidate_id")
    decision = data.get("decision") # 'accepted' | 'rejected' | 'unresolved' | 'pending'
    reviewer_note = data.get("reviewer_note", "")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM correction_candidates WHERE id = ?", (candidate_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"success": False, "error": "Candidate not found"}

    cur.execute("""
    UPDATE correction_candidates
    SET decision = ?,
        reviewer_note = ?
    WHERE id = ?
    """, (decision, reviewer_note, candidate_id))

    # Audit log
    now = now_iso()
    audit_id = f"audit_{int(datetime.datetime.now().timestamp()*1000)}"
    cur.execute("""
    INSERT INTO audit_history (id, page_id, previous_text, updated_text, action, reviewer_note, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (audit_id, row["page_id"], row["original_text"], row["proposed_text"] if decision == "accepted" else "[தெளிவில்லை]" if decision == "unresolved" else row["original_text"], f"candidate_{decision}", reviewer_note, now))

    conn.commit()
    conn.close()
    return {"success": True, "candidate_id": candidate_id, "decision": decision}

def handle_search(data):
    term = data.get("term", "").strip()
    search_type = data.get("search_type", "all") # 'reviewed' | 'ocr' | 'all'
    if not term:
        return {"success": True, "results": []}

    conn = get_conn()
    cur = conn.cursor()
    wild = f"%{term}%"

    sql = """
    SELECT p.id as page_id, p.page_number, p.book_id, b.title as book_title, b.author as book_author,
           t.original_ocr_text, t.reviewed_text, t.is_verified
    FROM transcriptions t
    JOIN pages p ON t.page_id = p.id
    JOIN books b ON p.book_id = b.id
    WHERE 1=1
    """
    if search_type == "reviewed":
        sql += " AND t.reviewed_text LIKE ?"
        params = [wild]
    elif search_type == "ocr":
        sql += " AND t.original_ocr_text LIKE ?"
        params = [wild]
    else:
        sql += " AND (t.reviewed_text LIKE ? OR t.original_ocr_text LIKE ?)"
        params = [wild, wild]

    sql += " LIMIT 50"
    cur.execute(sql, params)
    rows = cur.fetchall()

    results = []
    for r in rows:
        d = dict(r)
        # Highlight snippet
        text = d["reviewed_text"] or d["original_ocr_text"] or ""
        idx = text.find(term)
        snippet_start = max(0, idx - 40)
        snippet_end = min(len(text), idx + len(term) + 40)
        snippet = ("..." if snippet_start > 0 else "") + text[snippet_start:snippet_end] + ("..." if snippet_end < len(text) else "")
        d["snippet"] = snippet
        d["exact_match"] = term in text
        results.append(d)

    conn.close()
    return {"success": True, "results": results, "term": term}

def handle_get_analytics(data):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as count FROM books")
    total_books = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM pages")
    total_pages = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM pages WHERE processing_status = 'verified'")
    verified_pages = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM pages WHERE processing_status IN ('ocr_completed', 'reviewed', 'verified')")
    processed_pages = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM pages WHERE processing_status = 'unprocessed'")
    awaiting_review = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM correction_candidates WHERE decision = 'accepted'")
    accepted_corrections = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM correction_candidates WHERE decision = 'rejected'")
    rejected_corrections = cur.fetchone()["count"]

    cur.execute("SELECT COUNT(*) as count FROM correction_candidates WHERE decision = 'unresolved'")
    unresolved_corrections = cur.fetchone()["count"]

    cur.execute("SELECT AVG(ocr_confidence) as avg_conf FROM transcriptions WHERE ocr_confidence > 0")
    avg_conf_row = cur.fetchone()
    avg_conf = round(avg_conf_row["avg_conf"], 1) if avg_conf_row["avg_conf"] else 91.5

    # Confidence brackets
    cur.execute("SELECT COUNT(*) as count FROM transcriptions WHERE ocr_confidence >= 90")
    c_high = cur.fetchone()["count"]
    cur.execute("SELECT COUNT(*) as count FROM transcriptions WHERE ocr_confidence >= 75 AND ocr_confidence < 90")
    c_med = cur.fetchone()["count"]
    cur.execute("SELECT COUNT(*) as count FROM transcriptions WHERE ocr_confidence >= 50 AND ocr_confidence < 75")
    c_low = cur.fetchone()["count"]
    cur.execute("SELECT COUNT(*) as count FROM transcriptions WHERE ocr_confidence < 50")
    c_crit = cur.fetchone()["count"]

    conn.close()
    return {
        "success": True,
        "analytics": {
            "total_books": total_books,
            "total_pages": total_pages,
            "processed_pages": processed_pages,
            "verified_pages": verified_pages,
            "awaiting_review": awaiting_review,
            "accepted_corrections": accepted_corrections,
            "rejected_corrections": rejected_corrections,
            "unresolved_corrections": unresolved_corrections,
            "average_ocr_confidence": avg_conf,
            "confidence_distribution": {
                "high_90_100": c_high,
                "medium_75_89": c_med,
                "low_50_74": c_low,
                "critical_under_50": c_crit
            }
        }
    }

def handle_get_dictionary(data):
    search = data.get("search", "").strip()
    conn = get_conn()
    cur = conn.cursor()
    if search:
        cur.execute("SELECT * FROM dictionary_entries WHERE word LIKE ? OR meaning LIKE ? ORDER BY word ASC", (f"%{search}%", f"%{search}%"))
    else:
        cur.execute("SELECT * FROM dictionary_entries ORDER BY word ASC LIMIT 100")
    entries = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"success": True, "entries": entries}

def handle_add_dictionary(data):
    word = data.get("word", "").strip()
    meaning = data.get("meaning", "").strip()
    alts = data.get("alternate_spellings", "").strip()
    source = data.get("source_reference", "").strip() or "பயனர் பதிவு"
    period = data.get("period", "").strip() or "வரலாற்றுச் சொல்"
    if not word or not meaning:
        return {"success": False, "error": "சொல்லும் பொருளும் தேவை"}

    conn = get_conn()
    cur = conn.cursor()
    entry_id = f"dict_user_{int(datetime.datetime.now().timestamp()*1000)}"
    try:
        cur.execute("""
        INSERT INTO dictionary_entries (id, word, meaning, alternate_spellings, source_reference, period)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (entry_id, word, meaning, alts, source, period))
        conn.commit()
        conn.close()
        return {"success": True, "entry_id": entry_id}
    except sqlite3.IntegrityError:
        conn.close()
        return {"success": False, "error": "இச்சொல் ஏற்கனவே அகராதியில் உள்ளது"}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No payload provided"}))
        return

    try:
        raw_input = sys.argv[1]
        data = json.loads(raw_input)
        action = data.get("action")

        dispatch = {
            "get_books": handle_get_books,
            "get_book": handle_get_book,
            "create_book": handle_create_book,
            "update_book": handle_update_book,
            "delete_book": handle_delete_book,
            "add_page": handle_add_page,
            "get_page": handle_get_page,
            "save_transcription": handle_save_transcription,
            "update_candidate": handle_update_candidate,
            "search": handle_search,
            "get_analytics": handle_get_analytics,
            "get_dictionary": handle_get_dictionary,
            "add_dictionary": handle_add_dictionary
        }

        func = dispatch.get(action)
        if not func:
            print(json.dumps({"success": False, "error": f"Unknown action: {action}"}))
            return

        result = func(data)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
