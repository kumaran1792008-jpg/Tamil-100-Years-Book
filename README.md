# தமிழ் மரபு AI — Tamil Heritage AI
### 100 ஆண்டுப் பழைமையான தமிழ் நூல்கள் எண்மியப் பாதுகாப்பு & எழுத்துச் சரிபார்ப்பு அமைப்பு
**Complete Functional Tamil Book Digitization, OpenCV Image Restoration, and Evidence-Based Tesseract OCR System**

---

## 📖 திட்டத்தின் நோக்கம் (Project Overview)
நூற்றாண்டு காலப் பழைமையான தமிழ் நூல்கள் (எ.கா: 1912-ஆம் ஆண்டு திருக்குறள் பரிமேலழகர் உரை, 1920-ஆம் ஆண்டு தொல்காப்பிய நச்சினார்க்கினியர் பதிப்பு) மங்கிய மை, எண்ணெய்/நீர் கறைகள், சிதைந்த காகித விளிம்புகள் ஆகியவற்றால் வாசிக்கக் கடினமாக உள்ளன.

**தமிழ் மரபு AI** அமைப்பு:
1. **உண்மையான பட மீட்பு (OpenCV & Pillow):** சாம்பல் நிறமாக்கம், CLAHE மாறுபட்ட செறிவு, சாய்வு திருத்தம் (Deskew), கறை நீக்கம், மற்றும் Sauvola நிலைப்பிரிப்பு மூலம் பக்கங்களின் தெளிவை மீட்டெடுக்கிறது. (கற்பனை எழுத்துக்களை AI உருவாக்காது).
2. **நேரடி தமிழ் OCR (Tesseract 5.3 Neural LSTM):** தமிழ் மொழிப்பொதி (`tam`) கொண்டு சொல்வரியாகவும், எல்லைப் பெட்டிகள் (Bounding Boxes) மற்றும் நம்பிக்கையளவுடன் (Confidence %) எழுத்துக்களை அடையாளம் காண்கிறது.
3. **கற்பனை எழுத்துத் தடுப்புக் கொள்கை (Anti-Hallucination Framework):** மூலப் படச் சான்றின்றியோ அல்லது அகராதிச் சான்றின்றியோ AI தானாக சொற்களை மாற்ற இயலாது. இலக்கணப் பொருத்தம் மட்டுமே மூல ஆவணச் சான்றாகாது.
4. **மனித சரிபார்ப்பு (Human-in-the-loop Review Workspace):** மூல ஸ்கேன், மேம்பட்ட படம், மற்றும் OCR உரையை ஒருசேர ஒப்புநோக்கி திருத்தங்களை மேற்கொள்ளும் 3-பகுதிப் பணிமனை.
5. **[தெளிவில்லை] குறியீடு:** வாசிக்க இயலாத அல்லது உறுதியற்ற பகுதிகள் நீக்கப்படாமல் `[தெளிவில்லை]` எனக் குறிக்கப்பட்டு மூல உண்மைத்தன்மை பேணப்படும்.
6. **முழு தணிக்கை வரலாறு (Audit Trail):** ஏற்றுக்கொள்ளப்பட்ட, நிராகரிக்கப்பட்ட ஒவ்வொரு மாற்றமும் காலக் குறிப்புடன் சேமிக்கப்படுகிறது.
7. **ஏற்றுமதி வடிவங்கள்:** TXT, CSV, JSON, மற்றும் அச்சிடத்தக்க வரலாற்றுப் படிவக அறிக்கை.

---

## 🛠 தொழில்நுட்பக் கட்டமைப்பு (Technology Stack)

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Google Noto Serif Tamil & Mukta Malar Fonts.
- **Backend Server:** Node.js Express (`server.ts`) with Vite dev middleware.
- **Image Processing Engine:** Python 3, OpenCV (`cv2`), NumPy, Pillow (`PIL`).
- **OCR Engine:** Tesseract OCR 5.3 (`tam` Tamil language pack), PyTesseract.
- **Document Parser:** PyMuPDF (`fitz`) for multi-page high-resolution PDF rendering.
- **Database:** SQLite 3 with ACID transactions, foreign keys, and persistent storage (`/data/tamil_heritage.db`).

---

## 🚀 கணினியில் இயக்கும் வழிமுறைகள் (Quick Start Guide)

### 1. தேவைகள் (Prerequisites)
- **Node.js:** v20 அல்லது v22+
- **Python:** v3.10+
- **Tesseract OCR:** பதிப்பு 5.0+ தமிழ் மொழிப்பொதியுடன் (`tam`)

### 2. லினக்ஸ் (Debian / Ubuntu) நிறுவல்:
```bash
# 1. Tesseract மற்றும் தமிழ் மொழிப் பொதியை நிறுவுக:
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-tam

# 2. Python நூலகங்களை நிறுவுக:
pip3 install pillow pytesseract pymupdf opencv-python-headless numpy

# 3. Node தொகுப்புகளை நிறுவுக:
npm install

# 4. தரவுத்தளத்தை துவக்குக:
python3 backend/scripts/init_db.py

# 5. செயலியை இயக்குக (Port 3000):
npm run dev
```

### 3. விண்டோஸ் (Windows 10 / 11) நிறுவல் வழிகாட்டி:
1. **Tesseract OCR பதிவிறக்கம்:**
   - UB-Mannheim Tesseract Windows Installer ஐ பதிவிறக்கவும்: [Tesseract at UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
   - நிறுவும் போது **"Additional language data (download)"** பட்டியலில் **"Tamil"** என்பதைத் தேர்ந்தெடுக்கவும்.
   - விண்டோஸ் Environment Variables-இல் `C:\Program Files\Tesseract-OCR` ஐ `PATH`-இல் சேர்க்கவும்.
2. **Python நூலகங்கள்:**
   ```cmd
   pip install pillow pytesseract pymupdf opencv-python-headless numpy
   ```
3. **இயக்குதல்:**
   ```cmd
   npm install
   python backend\scripts\init_db.py
   npm run dev
   ```

---

## 🧪 சோதனைகள் இயக்குதல் (Running Automated Tests)

```bash
# தூய கணித & மொழி நெறிமுறை அலகுகளின் சோதனை (Logic tests):
npm test

# முழுமையான ஒருங்கிணைப்பு சோதனைகள் (Integration tests):
node --test tests/backend.test.ts
```

---

## 📂 கோப்பு அமைப்பு (Directory Architecture)

```
/
├── server.ts                    # Fullstack Express API server
├── index.html                   # HTML entry with Tamil fonts
├── metadata.json                # AI Studio application metadata
├── backend/
│   └── scripts/
│       ├── preprocess.py        # OpenCV image restoration & deskew
│       ├── ocr_processor.py     # Tesseract Tamil OCR & Bounding Boxes
│       ├── pdf_extractor.py     # Multi-page PDF renderer
│       ├── init_db.py           # Database schema & classical Tamil dictionary seeder
│       ├── db_api.py            # Central SQLite repository manager
│       └── generate_sample_pages.py # Realistic historical page generator
├── src/
│   ├── App.tsx                  # Main application orchestrator
│   ├── types.ts                 # TypeScript data contracts
│   ├── services/
│       └── api.ts               # REST API client
│   ├── utils/
│       ├── metrics.ts           # CER, WER, Anti-hallucination validation
│       ├── tamil.ts             # Classical Tamil Unicode grapheme cluster tools
│       └── metrics.test.ts      # Unit tests
│   └── components/
│       ├── Navbar.tsx           # Archival header with live OCR status
│       ├── HomeView.tsx         # Dashboard with metrics & principles
│       ├── UploadView.tsx       # File upload & live camera scanner
│       ├── LibraryView.tsx      # Digital library & page grid
│       ├── EnhanceView.tsx      # Split comparison slider & OpenCV filters
│       ├── OcrView.tsx          # Bounding box visualizer & OCR runner
│       ├── ReviewWorkspace.tsx  # 3-Panel review & word inspector
│       ├── AuditHistoryView.tsx # Provenance audit timeline
│       ├── AnalyticsView.tsx    # CER/WER calculator & confidence histogram
│       ├── ReportsView.tsx      # Formal archival report & exports
│       ├── SettingsView.tsx     # Historical Tamil dictionary & diagnostics
│       └── SearchModal.tsx      # Archival full-text search
├── tests/
│   └── backend.test.ts          # Automated integration test suite
└── /data/                       # Persistent storage for books, scans, exports & SQLite db
```
