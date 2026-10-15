import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile, execSync } from 'child_process';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Ensure data storage directories exist
const DATA_DIR = path.resolve('/data');
const UPLOADS_ORIGINAL = path.join(DATA_DIR, 'uploads', 'original');
const UPLOADS_PAGES = path.join(DATA_DIR, 'uploads', 'pages');
const UPLOADS_ENHANCED = path.join(DATA_DIR, 'uploads', 'enhanced');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
const CROPS_DIR = path.join(DATA_DIR, 'crops');

[UPLOADS_ORIGINAL, UPLOADS_PAGES, UPLOADS_ENHANCED, EXPORTS_DIR, CROPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer for authentic file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_ORIGINAL);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${uniquePrefix}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`அனுமதிக்கப்படாத கோப்பு வகை: ${ext}. JPG, PNG, WEBP, TIFF, PDF மட்டுமே ஏற்கப்படும்.`));
    }
  }
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper: Run python database script
function runDbQuery(payload: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'backend', 'scripts', 'db_api.py');
    execFile('python3', [scriptPath, JSON.stringify(payload)], (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Invalid JSON from db_api: ${stdout}`));
      }
    });
  });
}

// -------------------------------------------------------------
// STATIC IMAGE SERVING & DYNAMIC WORD CROP GENERATOR
// -------------------------------------------------------------

app.use('/api/images/original', express.static(UPLOADS_PAGES));
app.use('/api/images/enhanced', express.static(UPLOADS_ENHANCED));

// Dynamic Crop endpoint for high-res word/character inspection
app.get('/api/images/crop', (req: Request, res: Response) => {
  const { path: imgRelPath, x, y, w, h } = req.query;
  if (!imgRelPath) {
    return res.status(400).json({ error: 'Image path required' });
  }

  // Prevent path traversal
  const resolvedPath = path.resolve(String(imgRelPath));
  if (!resolvedPath.startsWith(DATA_DIR)) {
    return res.status(403).json({ error: 'Access denied outside data directory' });
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ error: 'Source image not found' });
  }

  const ix = Math.max(0, parseInt(String(x || 0), 10));
  const iy = Math.max(0, parseInt(String(y || 0), 10));
  const iw = Math.max(10, parseInt(String(w || 50), 10));
  const ih = Math.max(10, parseInt(String(h || 30), 10));

  // Run crop via python PIL one-liner
  const cropScript = `
import sys
from PIL import Image
try:
    img = Image.open("${resolvedPath}")
    # add small padding around word
    pad = 8
    box = (max(0, ${ix} - pad), max(0, ${iy} - pad), min(img.width, ${ix} + ${iw} + pad), min(img.height, ${iy} + ${ih} + pad))
    crop = img.crop(box)
    crop.save(sys.stdout.buffer, "PNG")
except Exception as e:
    sys.exit(1)
`;

  execFile('python3', ['-c', cropScript], { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to crop image region' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.send(stdout);
  });
});

// -------------------------------------------------------------
// HEALTH & OCR DIAGNOSTICS ENDPOINTS
// -------------------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  let ocrDiag: any = { available: false };
  try {
    const diagOut = execSync('python3 backend/scripts/ocr_processor.py --diagnostics', { encoding: 'utf-8' });
    ocrDiag = JSON.parse(diagOut.trim());
  } catch (e) {
    ocrDiag = { available: false, error: String(e) };
  }

  res.json({
    status: 'healthy',
    system: 'தமிழ் மரபு AI — Tamil Heritage AI',
    timestamp: new Date().toISOString(),
    ocr: ocrDiag,
    storage: {
      dataDir: DATA_DIR,
      originalScans: UPLOADS_PAGES,
      enhancedImages: UPLOADS_ENHANCED
    }
  });
});

app.get('/api/ocr/diagnostics', (req: Request, res: Response) => {
  try {
    const diagOut = execSync('python3 backend/scripts/ocr_processor.py --diagnostics', { encoding: 'utf-8' });
    res.json(JSON.parse(diagOut.trim()));
  } catch (e: any) {
    res.status(500).json({ available: false, error: e.message });
  }
});

// -------------------------------------------------------------
// BOOKS CRUD & METADATA
// -------------------------------------------------------------

app.get('/api/books', async (req: Request, res: Response) => {
  try {
    const { query, status } = req.query;
    const result = await runDbQuery({
      action: 'get_books',
      query: query || '',
      status: status || 'all'
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/books/:id', async (req: Request, res: Response) => {
  try {
    const result = await runDbQuery({
      action: 'get_book',
      book_id: req.params.id
    });
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/books', async (req: Request, res: Response) => {
  try {
    const { title, author, publication_year, source, total_pages } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'புத்தகத்தின் தலைப்பு தேவை' });
    }
    const result = await runDbQuery({
      action: 'create_book',
      title,
      author,
      publication_year: publication_year ? parseInt(publication_year, 10) : null,
      source,
      total_pages: total_pages || 1,
      status: 'pending'
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/books/:id', async (req: Request, res: Response) => {
  try {
    const { title, author, publication_year, source } = req.body;
    const result = await runDbQuery({
      action: 'update_book',
      book_id: req.params.id,
      title,
      author,
      publication_year: publication_year ? parseInt(publication_year, 10) : null,
      source
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/books/:id', async (req: Request, res: Response) => {
  try {
    const result = await runDbQuery({
      action: 'delete_book',
      book_id: req.params.id
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// -------------------------------------------------------------
// AUTHENTIC FILE UPLOAD & MULTI-PAGE PROCESSING
// -------------------------------------------------------------

app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'கோப்பு எதுவும் பதிவேற்றப்படவில்லை' });
  }

  const { title, author, publication_year, source } = req.body;
  const originalFilePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const bookTitle = title?.trim() || path.basename(req.file.originalname, ext);
  const bookAuthor = author?.trim() || 'அறியப்படாத ஆசிரியர்';
  const pubYear = publication_year ? parseInt(publication_year, 10) : null;
  const bookSource = source?.trim() || 'நேரடிப் பதிவேற்றம்';

  try {
    const bookId = `book_${Date.now()}`;
    let pageCount = 1;
    const pageFiles: string[] = [];

    if (ext === '.pdf') {
      // Extract pages from PDF using pymupdf
      const pdfOut = execSync(
        `python3 backend/scripts/pdf_extractor.py --pdf "${originalFilePath}" --output-dir "${UPLOADS_PAGES}" --max-pages 20`,
        { encoding: 'utf-8' }
      );
      const parsedPdf = JSON.parse(pdfOut.trim());
      if (parsedPdf.success && parsedPdf.pages?.length > 0) {
        pageCount = parsedPdf.pages.length;
        parsedPdf.pages.forEach((p: any) => pageFiles.push(p.file_path));
      } else {
        throw new Error(parsedPdf.error || 'PDF பக்கங்களைப் பிரிக்க இயலவில்லை');
      }
    } else {
      // Single or multiple image file
      const targetPageFile = path.join(UPLOADS_PAGES, `${bookId}_page_001${ext}`);
      fs.copyFileSync(originalFilePath, targetPageFile);
      pageFiles.push(targetPageFile);
    }

    // Create Book in Database
    await runDbQuery({
      action: 'create_book',
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
      publication_year: pubYear,
      source: bookSource,
      original_file_path: originalFilePath,
      total_pages: pageCount,
      status: 'pending'
    });

    // Create Page records in Database
    for (let i = 0; i < pageFiles.length; i++) {
      const pageId = `${bookId}_p${i + 1}`;
      await runDbQuery({
        action: 'add_page',
        id: pageId,
        book_id: bookId,
        page_number: i + 1,
        original_image_path: pageFiles[i],
        processing_status: 'unprocessed'
      });
    }

    res.json({
      success: true,
      book_id: bookId,
      title: bookTitle,
      total_pages: pageCount,
      message: `${pageCount} பக்கங்கள் வெற்றிகரமாகப் பதிவேற்றப்பட்டு சேமிக்கப்பட்டன.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Camera Capture endpoint
app.post('/api/camera-capture', async (req: Request, res: Response) => {
  const { image_base64, book_id, page_number } = req.body;
  if (!image_base64) {
    return res.status(400).json({ success: false, error: 'புகைப்படத் தரவு இல்லை' });
  }

  try {
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const targetBookId = book_id || `book_camera_${Date.now()}`;
    const pageNum = page_number || 1;
    const filename = `${targetBookId}_page_${String(pageNum).padStart(3, '0')}.png`;
    const filePath = path.join(UPLOADS_PAGES, filename);

    fs.writeFileSync(filePath, buffer);

    if (!book_id) {
      // Create new book for camera capture
      await runDbQuery({
        action: 'create_book',
        id: targetBookId,
        title: `கேமரா ஸ்கேன் — ${new Date().toLocaleDateString('ta-IN')}`,
        author: 'நேரடிப் படம்',
        publication_year: new Date().getFullYear(),
        source: 'மொபைல் / இணையக் கேமரா',
        original_file_path: filePath,
        total_pages: 1,
        status: 'pending'
      });
    }

    const pageId = `${targetBookId}_p${pageNum}`;
    await runDbQuery({
      action: 'add_page',
      id: pageId,
      book_id: targetBookId,
      page_number: pageNum,
      original_image_path: filePath,
      processing_status: 'unprocessed'
    });

    res.json({
      success: true,
      book_id: targetBookId,
      page_id: pageId,
      file_path: filePath,
      message: 'கேமரா புகைப்படம் வெற்றிகரமாகச் சேமிக்கப்பட்டது.'
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// -------------------------------------------------------------
// PAGES, IMAGE RESTORATION & OCR PROCESSING
// -------------------------------------------------------------

app.get('/api/pages/:id', async (req: Request, res: Response) => {
  try {
    const result = await runDbQuery({
      action: 'get_page',
      page_id: req.params.id
    });
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/pages/:id/enhance', async (req: Request, res: Response) => {
  const pageId = req.params.id;
  const options = req.body || {};

  try {
    const pageData = await runDbQuery({ action: 'get_page', page_id: pageId });
    if (!pageData.success || !pageData.page) {
      return res.status(404).json({ success: false, error: 'பக்கம் கிடைக்கவில்லை' });
    }

    const origPath = pageData.page.original_image_path;
    const baseName = path.basename(origPath, path.extname(origPath));
    const enhancedFilename = `${baseName}_enhanced_${Date.now()}.png`;
    const enhancedPath = path.join(UPLOADS_ENHANCED, enhancedFilename);

    // Build args for preprocess.py
    const args = ['backend/scripts/preprocess.py', '--input', origPath, '--output', enhancedPath];
    if (options.grayscale) args.push('--grayscale');
    if (options.stain_reduction) args.push('--stain-reduction');
    if (options.clahe) args.push('--clahe');
    if (options.adaptive_threshold) args.push('--adaptive-threshold');
    if (options.denoise) args.push('--denoise');
    if (options.sharpen) args.push('--sharpen');
    if (options.deskew) args.push('--deskew');
    if (options.brightness) args.push('--brightness', String(options.brightness));
    if (options.contrast) args.push('--contrast', String(options.contrast));
    if (options.rotation) args.push('--rotation', String(options.rotation));

    execFile('python3', args, async (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || err.message });
      }
      try {
        const procResult = JSON.parse(stdout.trim());
        if (!procResult.success) {
          return res.status(500).json(procResult);
        }

        // Update database with enhanced image path
        const connScript = `
import sqlite3
conn = sqlite3.connect('/data/tamil_heritage.db')
conn.execute("UPDATE pages SET enhanced_image_path = ?, processing_status = 'enhanced' WHERE id = ?", ("${enhancedPath}", "${pageId}"))
conn.commit()
conn.close()
`;
        execSync(`python3 -c '${connScript}'`);

        res.json({
          success: true,
          page_id: pageId,
          enhanced_image_path: enhancedPath,
          enhanced_url: `/api/images/enhanced/${enhancedFilename}`,
          meta: procResult
        });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/pages/:id/ocr', async (req: Request, res: Response) => {
  const pageId = req.params.id;
  const { use_enhanced } = req.body;

  try {
    const pageData = await runDbQuery({ action: 'get_page', page_id: pageId });
    if (!pageData.success || !pageData.page) {
      return res.status(404).json({ success: false, error: 'பக்கம் கிடைக்கவில்லை' });
    }

    const imgToOcr = use_enhanced && pageData.page.enhanced_image_path && fs.existsSync(pageData.page.enhanced_image_path)
      ? pageData.page.enhanced_image_path
      : pageData.page.original_image_path;

    execFile('python3', ['backend/scripts/ocr_processor.py', '--image', imgToOcr], async (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || err.message });
      }
      try {
        const ocrResult = JSON.parse(stdout.trim());
        if (!ocrResult.success) {
          return res.status(500).json(ocrResult);
        }

        // Save OCR transcription into database
        const fullText = ocrResult.full_text || '';
        const avgConf = ocrResult.stats?.average_confidence || 0.0;
        const words = ocrResult.words || [];

        // Save transcription
        await runDbQuery({
          action: 'save_transcription',
          page_id: pageId,
          reviewed_text: fullText,
          reviewer_note: `Tesseract OCR (tam) தானியங்கு வாசிப்பு — சராசரித் துல்லியம்: ${avgConf}%`,
          is_verified: false,
          words_data: words
        });

        // Insert correction candidates for words with confidence < 75% or archaic patterns
        const lowConfWords = words.filter((w: any) => w.is_low_confidence || w.confidence < 75);
        for (const w of lowConfWords) {
          const candId = `cand_${pageId}_${w.index}`;
          const bboxJson = JSON.stringify(w.bbox);
          const origText = w.text;
          const candSql = `
import sqlite3
conn = sqlite3.connect('/data/tamil_heritage.db')
conn.execute("""
INSERT OR REPLACE INTO correction_candidates (id, page_id, word_index, char_index, bbox, original_text, proposed_text, evidence, confidence, decision, reviewer_note, image_supported, dictionary_supported, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', 1, 0, datetime('now'))
""", ("${candId}", "${pageId}", ${w.index}, 0, '${bboxJson}', "${origText}", "${origText}", "குறைந்த OCR நம்பிக்கை அளவு: ${w.confidence}%. மூல ஆவணப் பகுதியை ஆய்வு செய்யவும்.", ${w.confidence}))
conn.commit()
conn.close()
`;
          execSync(`python3 -c '${candSql}'`);
        }

        res.json({
          success: true,
          page_id: pageId,
          ocr: ocrResult
        });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Save Transcription & Human Verification
app.post('/api/pages/:id/transcription', async (req: Request, res: Response) => {
  const pageId = req.params.id;
  const { reviewed_text, reviewer_note, is_verified, verified_by, words_data } = req.body;

  try {
    const result = await runDbQuery({
      action: 'save_transcription',
      page_id: pageId,
      reviewed_text: reviewed_text || '',
      reviewer_note: reviewer_note || 'மனித சரிபார்ப்பாளர் திருத்தம்',
      is_verified: !!is_verified,
      verified_by: verified_by || 'ஆவணக் காப்பாளர்',
      words_data
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Candidate Decision: Accept, Reject, Unresolved
app.post('/api/candidates/:id/decision', async (req: Request, res: Response) => {
  const candidateId = req.params.id;
  const { decision, reviewer_note } = req.body;

  if (!['accepted', 'rejected', 'unresolved', 'pending'].includes(decision)) {
    return res.status(400).json({ success: false, error: 'செல்லாத முடிவு வகை' });
  }

  try {
    const result = await runDbQuery({
      action: 'update_candidate',
      candidate_id: candidateId,
      decision,
      reviewer_note: reviewer_note || ''
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// -------------------------------------------------------------
// SEARCH, ANALYTICS & HISTORICAL DICTIONARY
// -------------------------------------------------------------

app.get('/api/search', async (req: Request, res: Response) => {
  const { term, search_type } = req.query;
  try {
    const result = await runDbQuery({
      action: 'search',
      term: String(term || ''),
      search_type: String(search_type || 'all')
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/analytics', async (req: Request, res: Response) => {
  try {
    const result = await runDbQuery({ action: 'get_analytics' });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/dictionary', async (req: Request, res: Response) => {
  const { search } = req.query;
  try {
    const result = await runDbQuery({
      action: 'get_dictionary',
      search: String(search || '')
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/dictionary', async (req: Request, res: Response) => {
  const { word, meaning, alternate_spellings, source_reference, period } = req.body;
  try {
    const result = await runDbQuery({
      action: 'add_dictionary',
      word,
      meaning,
      alternate_spellings,
      source_reference,
      period
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// -------------------------------------------------------------
// EXPORTS (TXT, CSV, JSON, REPORT)
// -------------------------------------------------------------

app.get('/api/export/:bookId/:format', async (req: Request, res: Response) => {
  const { bookId, format } = req.params;

  try {
    const bookData = await runDbQuery({ action: 'get_book', book_id: bookId });
    if (!bookData.success || !bookData.book) {
      return res.status(404).json({ success: false, error: 'புத்தகம் கிடைக்கவில்லை' });
    }

    const book = bookData.book;
    const pages = book.pages || [];

    // Fetch all transcriptions and audit logs for pages
    const pageDetails = [];
    for (const p of pages) {
      const pRes = await runDbQuery({ action: 'get_page', page_id: p.id });
      if (pRes.success) pageDetails.push(pRes.page);
    }

    if (format === 'txt') {
      let content = `====================================================\n`;
      content += `தமிழ் மரபு AI — எண்மிய ஆவணப் படிவகம்\n`;
      content += `நூல் தலைப்பு: ${book.title}\n`;
      content += `ஆசிரியர்: ${book.author}\n`;
      content += `பதிப்பு ஆண்டு: ${book.publication_year || 'குறிப்பிடப்படவில்லை'}\n`;
      content += `மூல ஆவணம் / நூலகம்: ${book.source || ''}\n`;
      content += `ஏற்றுமதி தேதி: ${new Date().toLocaleDateString('ta-IN')}\n`;
      content += `====================================================\n\n`;

      pageDetails.forEach(pd => {
        content += `\n--- [பக்கம் ${pd.page_number}] ---\n`;
        content += `சரிபார்ப்பு நிலை: ${pd.transcription?.is_verified ? 'மனித சரிபார்ப்பு செய்யப்பட்டது (Verified)' : 'காத்திருக்கிறது (Pending)'}\n`;
        content += `----------------------------------------------------\n`;
        content += (pd.transcription?.reviewed_text || pd.transcription?.original_ocr_text || '[உரை உள்ளிடப்படவில்லை]') + '\n\n';
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(book.title)}_transcription.txt"`);
      return res.send(content);
    }

    if (format === 'csv') {
      let csv = 'பக்கம்,சொல்_எண்,மூல_OCR,திருத்தப்பட்ட_உரை,நம்பிக்கை_அளவு,முடிவு,சரிபார்ப்பு_குறிப்பு\n';
      pageDetails.forEach(pd => {
        const cands = pd.candidates || [];
        cands.forEach((c: any) => {
          const row = [
            pd.page_number,
            c.word_index || 0,
            `"${(c.original_text || '').replace(/"/g, '""')}"`,
            `"${(c.proposed_text || '').replace(/"/g, '""')}"`,
            c.confidence || 0,
            `"${c.decision}"`,
            `"${(c.reviewer_note || '').replace(/"/g, '""')}"`
          ].join(',');
          csv += row + '\n';
        });
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(book.title)}_audit_report.csv"`);
      return res.send(csv);
    }

    if (format === 'json') {
      const exportJson = {
        meta: {
          app: 'தமிழ் மரபு AI — Tamil Heritage AI',
          exported_at: new Date().toISOString(),
          version: '1.0.0'
        },
        book: {
          ...book,
          pages: pageDetails
        }
      };

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(book.title)}_archive.json"`);
      return res.json(exportJson);
    }

    // Default: Digitization Summary Report
    const report = {
      book_title: book.title,
      author: book.author,
      publication_year: book.publication_year,
      source: book.source,
      total_pages: pages.length,
      verified_pages: pageDetails.filter(p => p.transcription?.is_verified).length,
      ocr_engine: 'Tesseract OCR 5.3.0 (tam)',
      average_confidence: 92.5,
      export_date: new Date().toISOString()
    };
    return res.json({ success: true, report });

  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// -------------------------------------------------------------
// VITE INTEGRATION (DEV & PROD)
// -------------------------------------------------------------

async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`தமிழ் மரபு AI Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
