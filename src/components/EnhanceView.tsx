import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Sliders, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeftRight,
  ShieldCheck,
  Eye,
  Undo2
} from 'lucide-react';
import { Book, Page } from '../types.ts';
import { enhancePage, fetchPage } from '../services/api.ts';

interface EnhanceViewProps {
  books: Book[];
  selectedBook: Book | null;
  selectedPageId: string | null;
  onSelectBook: (book: Book) => void;
  onSelectPageId: (pageId: string) => void;
  onNavigateToOcr: (pageId: string) => void;
}

export const EnhanceView: React.FC<EnhanceViewProps> = ({
  books,
  selectedBook,
  selectedPageId,
  onSelectBook,
  onSelectPageId,
  onNavigateToOcr
}) => {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  // Filter options state
  const [grayscale, setGrayscale] = useState(true);
  const [stainReduction, setStainReduction] = useState(true);
  const [clahe, setClahe] = useState(true);
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(false);
  const [denoise, setDenoise] = useState(true);
  const [sharpen, setSharpen] = useState(true);
  const [deskew, setDeskew] = useState(true);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(25);
  const [rotation, setRotation] = useState(0);

  // UI View state
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100% split
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTabMode, setActiveTabMode] = useState<'split' | 'enhanced' | 'original'>('split');

  // Load current page
  useEffect(() => {
    if (selectedPageId) {
      loadPage(selectedPageId);
    } else if (selectedBook && selectedBook.pages && selectedBook.pages.length > 0) {
      loadPage(selectedBook.pages[0].id);
      onSelectPageId(selectedBook.pages[0].id);
    }
  }, [selectedPageId, selectedBook]);

  const loadPage = async (pageId: string) => {
    setIsLoadingPage(true);
    setProcessError(null);
    setProcessSuccess(null);
    try {
      const res = await fetchPage(pageId);
      if (res.success) {
        setCurrentPage(res.page);
      }
    } catch (e: any) {
      setProcessError('பக்க விவரங்களை ஏற்றுவதில் பிழை: ' + e.message);
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handleApplyEnhancement = async () => {
    if (!currentPage) return;
    setIsProcessing(true);
    setProcessError(null);
    setProcessSuccess(null);

    const options = {
      grayscale,
      stain_reduction: stainReduction,
      clahe,
      adaptive_threshold: adaptiveThreshold,
      denoise,
      sharpen,
      deskew,
      brightness,
      contrast,
      rotation
    };

    try {
      const res = await enhancePage(currentPage.id, options);
      if (res.success) {
        setProcessSuccess('பக்கப் படம் OpenCV மூலம் வெற்றிகரமாக மேம்படுத்தப்பட்டது!');
        loadPage(currentPage.id);
      } else {
        setProcessError(res.error || 'படத்தைச் செயலாக்குவதில் பிழை');
      }
    } catch (e: any) {
      setProcessError(e.message || 'சேவையகப் பிழை');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const originalImgUrl = currentPage
    ? `/api/images/original/${currentPage.original_image_path.split('/').pop()}`
    : '';
  const enhancedImgUrl = currentPage?.enhanced_image_path
    ? `/api/images/enhanced/${currentPage.enhanced_image_path.split('/').pop()}?t=${Date.now()}`
    : originalImgUrl;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Page Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D6C3] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#8B2635]" />
            பக்கங்களை மேம்படுத்து & மீட்டமை (OpenCV Restoration)
          </h1>
          <p className="text-xs text-[#706257]">
            மங்கிய மை மற்றும் கறைபடிந்த வரலாற்றுப் பக்கங்களின் தெளிவை மேம்படுத்துகிறது. புதிய எழுத்துக்களை உருவாக்காது.
          </p>
        </div>

        {/* Book & Page Dropdowns */}
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
            className="text-xs bg-white border border-[#D5C9B3] rounded-lg px-3 py-1.5 font-medium text-[#4A3E36] focus:outline-hidden"
          >
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>

          {selectedBook?.pages && (
            <select
              value={currentPage?.id || ''}
              onChange={(e) => onSelectPageId(e.target.value)}
              className="text-xs bg-white border border-[#D5C9B3] rounded-lg px-3 py-1.5 font-medium text-[#4A3E36] focus:outline-hidden"
            >
              {selectedBook.pages.map(p => (
                <option key={p.id} value={p.id}>பக்கம் {p.page_number}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Strict Anti-Fabrication Safeguard Banner */}
      <div className="bg-[#FAF5ED] rounded-xl p-4 border border-[#D49A3D]/40 text-xs text-[#5D5046] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#8C5A20] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#8C5A20] block mb-0.5">
            உண்மையான பட மீட்பு உறுதிமொழி (No Generative Hallucination)
          </span>
          இம்மேம்பாட்டு முறை OpenCV வரைகலை வழிமுறைகளை மட்டுமே பயன்படுத்துகிறது. இல்லாத எழுத்துக் கீற்றுகளையோ வடிவங்களையோ AI முறையில் கற்பனையாக உருவாக்காது. மூல ஆவணத்தின் உண்மைத்தன்மை முழுமையாகக் காக்கப்படுகிறது.
        </div>
      </div>

      {/* Notifications */}
      {processSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{processSuccess}</span>
        </div>
      )}

      {processError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{processError}</span>
        </div>
      )}

      {/* Main Grid: Control Panel (4 cols) + Comparison Viewport (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Enhancement Filters (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0E8DC] pb-3">
            <h2 className="font-serif text-base font-bold text-[#6B1724] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#8B2635]" />
              மீட்டமைப்பு அமைப்புகள்
            </h2>
            <button
              onClick={handleRotate}
              className="p-1.5 text-stone-600 hover:text-[#6B1724] bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="90° சுழற்றுக"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Toggles */}
          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <span className="font-medium text-[#4A3E36]">சாம்பல் நிறமாக்கம் (Grayscale)</span>
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <div>
                <span className="font-medium text-[#4A3E36] block">கறை குறைப்பு (Stain Removal)</span>
                <span className="text-[10px] text-[#8C7E74]">பின்னணி நீர் மற்றும் எண்ணெய் கறைகளை நீக்குகிறது</span>
              </div>
              <input
                type="checkbox"
                checked={stainReduction}
                onChange={(e) => setStainReduction(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <div>
                <span className="font-medium text-[#4A3E36] block">CLAHE மாறுபட்ட செறிவு (Contrast)</span>
                <span className="text-[10px] text-[#8C7E74]">மங்கிய பழைய மையின் அடர்த்தியை மீட்டெடுக்கிறது</span>
              </div>
              <input
                type="checkbox"
                checked={clahe}
                onChange={(e) => setClahe(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <div>
                <span className="font-medium text-[#4A3E36] block">தகவமை நிலைப்பிரிப்பு (Sauvola Binarize)</span>
                <span className="text-[10px] text-[#8C7E74]">சுத்தமான கருப்பு-வெள்ளை அச்சு உரை</span>
              </div>
              <input
                type="checkbox"
                checked={adaptiveThreshold}
                onChange={(e) => setAdaptiveThreshold(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <div>
                <span className="font-medium text-[#4A3E36] block">இரைச்சல் நீக்கம் (Noise Filtering)</span>
                <span className="text-[10px] text-[#8C7E74]">காகிதத் துகள்கள் மற்றும் புள்ளிகளை அகற்றும்</span>
              </div>
              <input
                type="checkbox"
                checked={denoise}
                onChange={(e) => setDenoise(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <div>
                <span className="font-medium text-[#4A3E36] block">எழுத்துக் கூர்மையாக்கம் (Sharpen)</span>
                <span className="text-[10px] text-[#8C7E74]">எழுத்து விளிம்புகளைத் துல்லியமாக்கும்</span>
              </div>
              <input
                type="checkbox"
                checked={sharpen}
                onChange={(e) => setSharpen(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E8DFC9] cursor-pointer hover:bg-[#F3EBDD]">
              <div>
                <span className="font-medium text-[#4A3E36] block">சாய்வு திருத்தம் (Auto Deskew)</span>
                <span className="text-[10px] text-[#8C7E74]">கோணல் வரியமைப்பை நேராக்குகிறது</span>
              </div>
              <input
                type="checkbox"
                checked={deskew}
                onChange={(e) => setDeskew(e.target.checked)}
                className="rounded-sm text-[#8B2635] focus:ring-[#8B2635]"
              />
            </label>
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-[#F0E8DC]">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#4A3E36] mb-1">
                <span>மாறுபாடு (Contrast):</span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                className="w-full accent-[#8B2635]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#4A3E36] mb-1">
                <span>பிரகாசம் (Brightness):</span>
                <span>{brightness}</span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-[#8B2635]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleApplyEnhancement}
              disabled={isProcessing || !currentPage}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                isProcessing
                  ? 'bg-stone-300 text-stone-600 cursor-not-allowed'
                  : 'bg-[#8B2635] hover:bg-[#6B1724] text-white hover:scale-102'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  செயலாக்கம் நடைபெறுகிறது...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  படத்தை மேம்படுத்துக
                </>
              )}
            </button>

            {currentPage?.enhanced_image_path && (
              <button
                onClick={() => onNavigateToOcr(currentPage.id)}
                className="w-full py-2 rounded-xl font-semibold text-xs bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                மேம்பட்ட படத்தில் OCR இயக்குக
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Comparison Viewport & Split Slider (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-md flex flex-col justify-between space-y-4">
          {/* Viewport Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E8DC] pb-3">
            {/* View Mode Switch */}
            <div className="inline-flex p-1 bg-[#FAF7F2] rounded-lg border border-[#D5C9B3] text-xs">
              <button
                onClick={() => setActiveTabMode('split')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTabMode === 'split' ? 'bg-[#8B2635] text-white' : 'text-[#5C4F46]'
                }`}
              >
                ஒப்பீட்டுச் சறுக்கி (Split)
              </button>
              <button
                onClick={() => setActiveTabMode('enhanced')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTabMode === 'enhanced' ? 'bg-[#8B2635] text-white' : 'text-[#5C4F46]'
                }`}
              >
                மேம்பட்ட படம்
              </button>
              <button
                onClick={() => setActiveTabMode('original')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTabMode === 'original' ? 'bg-[#8B2635] text-white' : 'text-[#5C4F46]'
                }`}
              >
                மூல ஸ்கேன்
              </button>
            </div>

            {/* Zoom Controls & Download */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                className="p-1.5 bg-[#FAF7F2] hover:bg-[#EDE4D6] rounded-md border border-[#D5C9B3] text-[#4A3E36]"
                title="சிறிதாக்கு"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-[#5A4D43] w-12 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(300, zoomLevel + 25))}
                className="p-1.5 bg-[#FAF7F2] hover:bg-[#EDE4D6] rounded-md border border-[#D5C9B3] text-[#4A3E36]"
                title="பெரிதாக்கு"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {currentPage?.enhanced_image_path && (
                <a
                  href={enhancedImgUrl}
                  download="enhanced_page.png"
                  className="p-1.5 bg-[#FAF7F2] hover:bg-[#EDE4D6] rounded-md border border-[#D5C9B3] text-[#6B1724]"
                  title="மேம்பட்ட படத்தைப் பதிவிறக்குக"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Interactive Split Viewport */}
          <div className="relative h-[560px] bg-stone-900 rounded-xl overflow-hidden border border-[#D5C9B3] flex items-center justify-center select-none">
            {isLoadingPage ? (
              <div className="flex items-center gap-2 text-white text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                படம் ஏற்றப்படுகிறது...
              </div>
            ) : currentPage ? (
              <div 
                className="relative w-full h-full overflow-auto flex items-center justify-center p-4 cursor-grab"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
              >
                {activeTabMode === 'original' && (
                  <img src={originalImgUrl} alt="மூல ஸ்கேன்" className="max-h-full max-w-full object-contain shadow-2xl" />
                )}

                {activeTabMode === 'enhanced' && (
                  <img src={enhancedImgUrl} alt="மேம்பட்ட படம்" className="max-h-full max-w-full object-contain shadow-2xl" />
                )}

                {activeTabMode === 'split' && (
                  <div className="relative w-full h-full max-w-[850px] flex items-center justify-center">
                    {/* Background: Enhanced Image */}
                    <img
                      src={enhancedImgUrl}
                      alt="மேம்பட்ட படம்"
                      className="absolute inset-0 w-full h-full object-contain"
                    />

                    {/* Foreground: Original Image with clip path */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img
                        src={originalImgUrl}
                        alt="மூல ஸ்கேன்"
                        className="absolute inset-0 w-full h-full object-contain max-w-none"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Divider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 cursor-ew-resize z-20 flex items-center justify-center"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg border border-white">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-400">பக்கம் எதுவும் தேர்ந்தெடுக்கப்படவில்லை</p>
            )}
          </div>

          {/* Split Slider Controller */}
          {activeTabMode === 'split' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[#7C6E65]">
                <span>← மூல ஸ்கேன் (அசல்)</span>
                <span>மேம்பட்ட படம் (OpenCV) →</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(parseInt(e.target.value, 10))}
                className="w-full accent-[#B47B36] cursor-ew-resize"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
