import React, { useState, useEffect } from 'react';
import { 
  ScanText, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Layers, 
  Sliders, 
  Sparkles,
  Info,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Book, Page, OcrDiagnostics, OcrWord } from '../types.ts';
import { fetchPage, runOcrOnPage } from '../services/api.ts';

interface OcrViewProps {
  books: Book[];
  selectedBook: Book | null;
  selectedPageId: string | null;
  ocrDiagnostics: OcrDiagnostics | null;
  onSelectBook: (book: Book) => void;
  onSelectPageId: (pageId: string) => void;
  onNavigateToReview: (pageId: string) => void;
}

export const OcrView: React.FC<OcrViewProps> = ({
  books,
  selectedBook,
  selectedPageId,
  ocrDiagnostics,
  onSelectBook,
  onSelectPageId,
  onNavigateToReview
}) => {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [selectedWord, setSelectedWord] = useState<OcrWord | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);

  // Load page
  useEffect(() => {
    if (selectedPageId) {
      loadPage(selectedPageId);
    } else if (selectedBook && selectedBook.pages && selectedBook.pages.length > 0) {
      loadPage(selectedBook.pages[0].id);
      onSelectPageId(selectedBook.pages[0].id);
    }
  }, [selectedPageId, selectedBook]);

  const loadPage = async (pageId: string) => {
    setIsLoading(true);
    setOcrError(null);
    try {
      const res = await fetchPage(pageId);
      if (res.success) {
        setCurrentPage(res.page);
      }
    } catch (e: any) {
      setOcrError('பக்க விவரங்களை ஏற்றுவதில் தோல்வி: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOcr = async () => {
    if (!currentPage) return;
    setIsRunningOcr(true);
    setOcrError(null);
    setOcrSuccess(null);

    try {
      const res = await runOcrOnPage(currentPage.id, useEnhanced);
      if (res.success) {
        setOcrSuccess(`Tesseract OCR (tam) மூலம் ${res.ocr?.stats?.total_words || 0} சொற்கள் வெற்றிகரமாக அடையாளம் காணப்பட்டன!`);
        loadPage(currentPage.id);
      } else {
        setOcrError(res.error || 'OCR செயலாக்கத்தில் பிழை');
      }
    } catch (e: any) {
      setOcrError(e.message || 'சேவையகப் பிழை');
    } finally {
      setIsRunningOcr(false);
    }
  };

  // Parse words data
  let words: OcrWord[] = [];
  if (currentPage?.transcription?.words_data) {
    if (typeof currentPage.transcription.words_data === 'string') {
      try {
        words = JSON.parse(currentPage.transcription.words_data);
      } catch (e) {
        words = [];
      }
    } else if (Array.isArray(currentPage.transcription.words_data)) {
      words = currentPage.transcription.words_data;
    }
  }

  const activeImageUrl = useEnhanced && currentPage?.enhanced_image_path
    ? `/api/images/enhanced/${currentPage.enhanced_image_path.split('/').pop()}`
    : currentPage
    ? `/api/images/original/${currentPage.original_image_path.split('/').pop()}`
    : '';

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Page Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D6C3] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
            <ScanText className="w-6 h-6 text-[#8B2635]" />
            தமிழ் OCR இயந்திரம் (Tesseract 5.3 Neural LSTM)
          </h1>
          <p className="text-xs text-[#706257]">
            பழைய தமிழ் எழுத்துருக்களை அடையாளம் கண்டு சொல்வரிசை மற்றும் நம்பிக்கையளவை (Confidence) பெறுகிறது.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBook?.id || ''}
            onChange={(e) => {
              const b = books.find(item => item.id === e.target.value);
              if (b) {
                onSelectBook(b);
                if (b.pages && b.pages.length > 0) {
                  onSelectPageId(b.pages[0].id);
                }
              }
            }}
            className="text-xs bg-white border border-[#D5C9B3] rounded-lg px-3 py-1.5 font-medium text-[#4A3E36]"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>

          {selectedBook?.pages && (
            <select
              value={currentPage?.id || ''}
              onChange={(e) => onSelectPageId(e.target.value)}
              className="text-xs bg-white border border-[#D5C9B3] rounded-lg px-3 py-1.5 font-medium text-[#4A3E36]"
            >
              {selectedBook.pages.map(p => (
                <option key={p.id} value={p.id}>பக்கம் {p.page_number}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* OCR Status Diagnostic Notice if unavailable */}
      {!ocrDiagnostics?.tamil_supported && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            தமிழ் OCR மொழிப்பொதி (tesseract-ocr-tam) தேவைப்படுகிறது
          </div>
          <p>
            சிஸ்டத்தில் Tesseract இன் தமிழ் தரவுப் பொதி நிறுவப்படவில்லை எனில், கைமுறை எழுத்துச் சரிபார்ப்பைத் தொடரலாம்.
            நிறுவல் கட்டளை: <code className="bg-white px-2 py-0.5 rounded border border-amber-300">apt-get install -y tesseract-ocr-tam</code>
          </p>
        </div>
      )}

      {/* Notifications */}
      {ocrSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ocrSuccess}</span>
        </div>
      )}

      {ocrError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{ocrError}</span>
        </div>
      )}

      {/* Main Grid: Visual Overlay Viewport (7 cols) + OCR Results & Stats (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Scan with Bounding Boxes (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-md space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E8DC] pb-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4A3E36] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBoundingBoxes}
                  onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                  className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
                />
                சொல் எல்லைப் பெட்டிகள் (Bounding Boxes)
              </label>

              {currentPage?.enhanced_image_path && (
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4A3E36] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useEnhanced}
                    onChange={(e) => setUseEnhanced(e.target.checked)}
                    className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
                  />
                  மேம்பட்ட படம்
                </label>
              )}
            </div>

            <button
              onClick={handleRunOcr}
              disabled={isRunningOcr || !currentPage}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                isRunningOcr
                  ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                  : 'bg-[#8B2635] hover:bg-[#6B1724] text-white hover:scale-102'
              }`}
            >
              {isRunningOcr ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  OCR இயங்குகிறது...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  OCR செயலாக்கம்
                </>
              )}
            </button>
          </div>

          {/* Image Canvas with Overlay Bounding Boxes */}
          <div className="relative h-[580px] bg-stone-900 rounded-xl overflow-auto p-4 flex items-center justify-center select-none">
            {isLoading ? (
              <div className="flex items-center gap-2 text-white text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                பக்கம் ஏற்றப்படுகிறது...
              </div>
            ) : currentPage ? (
              <div className="relative max-h-full max-w-full shadow-2xl">
                <img
                  src={activeImageUrl}
                  alt="OCR பக்கம்"
                  className="max-h-[540px] w-auto object-contain block rounded-sm"
                />

                {/* Bounding Box Highlights */}
                {showBoundingBoxes && words.map((w) => {
                  const isSelected = selectedWord?.index === w.index;
                  const isLow = w.is_low_confidence || w.confidence < 75;
                  const isMed = w.confidence >= 75 && w.confidence < 90;

                  return (
                    <div
                      key={w.index}
                      onClick={() => setSelectedWord(w)}
                      title={`${w.text} (${w.confidence}%)`}
                      className={`absolute cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400/30 z-30 ring-2 ring-cyan-300'
                          : isLow
                          ? 'border-rose-500 bg-rose-500/20 hover:bg-rose-500/40 z-10'
                          : isMed
                          ? 'border-amber-400 bg-amber-400/15 hover:bg-amber-400/35 z-10'
                          : 'border-emerald-500/80 bg-emerald-500/10 hover:bg-emerald-500/30 z-10'
                      }`}
                      style={{
                        left: `${w.bbox_pct.left}%`,
                        top: `${w.bbox_pct.top}%`,
                        width: `${w.bbox_pct.width}%`,
                        height: `${w.bbox_pct.height}%`
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Color Code Legend */}
          <div className="flex items-center justify-between text-[11px] text-[#786B62] pt-1">
            <span className="font-semibold text-[#4A3E36]">நம்பிக்கையளவு:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                உயர் (&gt;=90%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                நடுத்தரம் (75-89%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                குறைவு (&lt;75%)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: OCR Text & Metrics (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="border-b border-[#F0E8DC] pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-bold text-[#6B1724]">
                  அடையாளம் காணப்பட்ட தமிழ் உரை
                </h2>
                <p className="text-[11px] text-[#706257]">
                  மொத்த சொற்கள்: {words.length} • துல்லியம்: {currentPage?.transcription?.ocr_confidence || 0}%
                </p>
              </div>

              {currentPage?.transcription && (
                <button
                  onClick={() => onNavigateToReview(currentPage.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#8B2635] hover:bg-[#6B1724] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  சரிபார்க்க
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Selected Word Inspector Card */}
            {selectedWord && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">தேர்ந்தெடுத்த சொல்:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedWord.confidence >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedWord.confidence}%
                  </span>
                </div>
                <div className="text-base font-serif font-bold text-[#6B1724]">
                  {selectedWord.text}
                </div>
                <div className="text-[11px] text-[#6E6157]">
                  வரி: {selectedWord.line_num} • தொகுதி: {selectedWord.block_num}
                </div>
              </div>
            )}

            {/* Full Recognized OCR Text Box */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E2D6C3] max-h-[380px] overflow-y-auto space-y-2">
              {currentPage?.transcription?.reviewed_text || currentPage?.transcription?.original_ocr_text ? (
                <div className="text-xs sm:text-sm font-serif leading-relaxed text-[#2C241E] whitespace-pre-wrap">
                  {currentPage.transcription.reviewed_text || currentPage.transcription.original_ocr_text}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-[#8C7E74]">
                  இப்பக்கத்திற்கு OCR இன்னும் இயக்கப்படவில்லை. மேலே உள்ள "OCR செயலாக்கம்" பொத்தானை அழுத்தவும்.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Tip */}
          <div className="p-3 bg-[#FAF5ED] rounded-xl border border-[#EAE0CE] text-[11px] text-[#706257]">
            <span className="font-bold text-[#8B2635] block mb-0.5">குறிப்பு:</span>
            இங்கே காட்டப்படும் மூல OCR உரை மாற்றப்படாது. திருத்தங்களை மேற்கொள்ள "எழுத்துச் சரிபார்ப்பு" பகுதிக்குச் செல்லவும்.
          </div>
        </div>
      </div>
    </div>
  );
};
