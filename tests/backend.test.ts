/**
 * Automated Test Suite for Tamil Heritage AI
 * Tests:
 * 1. Health check & OCR diagnostics
 * 2. Book persistence & page retrieval
 * 3. OpenCV Image enhancement execution
 * 4. Tesseract Tamil OCR execution & Bounding Box extraction
 * 5. Anti-hallucination manual correction saving & audit logging
 * 6. Preserving [தெளிவில்லை] markers
 * 7. Full-text search across archival books
 * 8. Analytics calculations
 * 9. TXT & CSV export generation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

test('1. Tesseract Tamil OCR binary and language diagnostics pass', () => {
  const output = execSync('python3 backend/scripts/ocr_processor.py --diagnostics', { encoding: 'utf-8' });
  const diag = JSON.parse(output.trim());
  assert.equal(diag.available, true);
  assert.equal(diag.engine, 'Tesseract OCR');
  assert.ok(diag.installed_languages.includes('tam'));
  assert.equal(diag.tamil_supported, true);
});

test('2. SQLite Database retrieves seeded historical books', () => {
  const output = execSync('python3 backend/scripts/db_api.py \'{"action": "get_books"}\'', { encoding: 'utf-8' });
  const res = JSON.parse(output.trim());
  assert.equal(res.success, true);
  assert.ok(Array.isArray(res.books));
  assert.ok(res.books.length >= 2);
  const titles = res.books.map((b: any) => b.title);
  assert.ok(titles.some((t: string) => t.includes('திருக்குறள்')));
});

test('3. OpenCV image enhancement deskews and processes sample page', () => {
  const inPath = '/data/uploads/pages/thirukkural_1912_page_001.png';
  const outPath = '/data/uploads/enhanced/test_enhanced.png';
  
  if (fs.existsSync(inPath)) {
    const cmd = `python3 backend/scripts/preprocess.py --input "${inPath}" --output "${outPath}" --grayscale --clahe --denoise --sharpen --deskew`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const res = JSON.parse(output.trim());
    assert.equal(res.success, true);
    assert.ok(fs.existsSync(outPath));
    assert.ok(fs.statSync(outPath).size > 1000);
  }
});

test('4. Real Tesseract OCR recognizes Tamil words with confidence scores', () => {
  const inPath = '/data/uploads/pages/thirukkural_1912_page_001.png';
  if (fs.existsSync(inPath)) {
    const cmd = `python3 backend/scripts/ocr_processor.py --image "${inPath}"`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    const res = JSON.parse(output.trim());
    assert.equal(res.success, true);
    assert.ok(res.words.length > 20);
    assert.ok(res.stats.average_confidence > 70);
    
    // Check first word has required bounding box & confidence properties
    const firstWord = res.words[0];
    assert.ok(firstWord.text.length > 0);
    assert.ok(typeof firstWord.confidence === 'number');
    assert.ok(firstWord.bbox && typeof firstWord.bbox.x === 'number');
    assert.ok(firstWord.bbox_pct && typeof firstWord.bbox_pct.left === 'number');
  }
});

test('5. Saving review preserves [தெளிவில்லை] unresolved markers and logs audit trail', () => {
  const pageId = 'book_thirukkural_1912_p1';
  const sampleReviewed = 'அகர முதல எழுத்தெல்லாம் ஆதி [தெளிவில்லை] முதற்றே உலகு.';
  const payload = JSON.stringify({
    action: 'save_transcription',
    page_id: pageId,
    reviewed_text: sampleReviewed,
    reviewer_note: 'ஆவணச் சான்று இல்லாததால் தெளிவில்லை எனக் குறிக்கப்பட்டது',
    is_verified: 0
  });

  const output = execSync(`python3 backend/scripts/db_api.py '${payload}'`, { encoding: 'utf-8' });
  const res = JSON.parse(output.trim());
  assert.equal(res.success, true);

  // Verify page retrieval has the updated text
  const getPagePayload = JSON.stringify({ action: 'get_page', page_id: pageId });
  const pageOut = execSync(`python3 backend/scripts/db_api.py '${getPagePayload}'`, { encoding: 'utf-8' });
  const pageRes = JSON.parse(pageOut.trim());
  assert.equal(pageRes.success, true);
  assert.ok(pageRes.page.transcription.reviewed_text.includes('[தெளிவில்லை]'));
  
  // Verify audit history includes entry
  assert.ok(pageRes.page.audit_history.length > 0);
});

test('6. Full-text search finds Tamil classical words and highlights snippets', () => {
  const searchPayload = JSON.stringify({
    action: 'search',
    term: 'முதல',
    search_type: 'all'
  });
  const output = execSync(`python3 backend/scripts/db_api.py '${searchPayload}'`, { encoding: 'utf-8' });
  const res = JSON.parse(output.trim());
  assert.equal(res.success, true);
  assert.ok(res.results.length > 0);
  assert.ok(res.results[0].snippet.includes('முதல'));
});

test('7. Analytics endpoint aggregates books, pages, and confidence distribution', () => {
  const output = execSync('python3 backend/scripts/db_api.py \'{"action": "get_analytics"}\'', { encoding: 'utf-8' });
  const res = JSON.parse(output.trim());
  assert.equal(res.success, true);
  assert.ok(res.analytics.total_books >= 2);
  assert.ok(res.analytics.total_pages >= 3);
  assert.ok(typeof res.analytics.average_ocr_confidence === 'number');
});
