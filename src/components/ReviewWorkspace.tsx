import React, { useState, useEffect } from 'react';
import { 
  CheckCheck, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Save, 
  Undo2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  FileCheck, 
  History, 
  BookOpen,
  Edit3,
  ExternalLink,
  Info
} from 'lucide-react';
import { Book, Page, OcrWord, CorrectionCandidate, AuditEntry } from '../types.ts';
import { fetchPage, savePageTranscription, updateCandidateDecision } from '../services/api.ts';
import { validateAntiHallucination, calculateCER, calculateWER } from '../utils/metrics.ts';
import { findArchaicSuggestions } from '../utils/tamil.ts';

interface ReviewWorkspaceProps {
  books: Book[];
  selectedBook: Book | null;
  selectedPageId: string | null;
  onSelectBook: (book: Book) => void;
  onSelectPageId: (pageId: string) => void;
  onRefresh: () => void;
}

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  books,
  selectedBook,
  selectedPageId,
  onSelectBook,
  onSelectPageId,
  onRefresh
}) => {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable text & history
  const [editableText, setEditableText] = useState('');
  const [initialText, setInitialText] = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [reviewerName, setReviewerName] = useState('ஆவணக் காப்பாளர்');
  const [isVerified, setIsVerified] = useState(false);

  // Active word / candidate selection
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [activeCandidate, setActiveCandidate] = useState<CorrectionCandidate | null>(null);

  // Image zoom
  const [zoomLevel, setZoomLevel] = useState(100);

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
    setIsLoading(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await fetchPage(pageId);
      if (res.success && res.page) {
        setCurrentPage(res.page);
        const text = res.page.transcription?.reviewed_text || res.page.transcription?.original_ocr_text || '';
        setEditableText(text);
        setInitialText(text);
        setIsVerified(!!res.page.transcription?.is_verified);
        if (res.page.candidates && res.page.candidates.length > 0) {
          setActiveCandidate(res.page.candidates[0]);
        }
      }
    } catch (e: any) {
      setSaveError('பக்க விவரங்களை ஏற்றுவதில் பிழை: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse words from transcription
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

  // Find candidate for selected word
  const candidates = currentPage?.candidates || [];

  const handleSelectWord = (w: OcrWord) => {
    setSelectedWordIndex(w.index);
    const foundCand = candidates.find(c => c.word_index === w.index);
    if (foundCand) {
      setActiveCandidate(foundCand);
    } else {
      // Find archaic variants if available
      const archSuggestions = findArchaicSuggestions(w.text);
      const proposed = archSuggestions.length > 0 ? archSuggestions[0].modern : w.text;
      const evidence = archSuggestions.length > 0 
        ? `மரபுவழி வடிவம்: ${archSuggestions[0].note}`
        : `OCR நம்பிக்கை அளவு: ${w.confidence}%. மூலப் படத்தைக் கவனித்து சரிபார்க்கவும்.`;

      setActiveCandidate({
        id: `cand_temp_${w.index}`,
        page_id: currentPage?.id || '',
        word_index: w.index,
        original_text: w.text,
        proposed_text: proposed,
        evidence: evidence,
        confidence: w.confidence,
        decision: 'pending',
        image_supported: 1,
        dictionary_supported: archSuggestions.length > 0 ? 1 : 0,
        created_at: new Date().toISOString()
      });
    }
  };

  // Navigate uncertain words
  const uncertainWords = words.filter(w => w.is_low_confidence || w.confidence < 75);

  const handleNextUncertain = () => {
    if (uncertainWords.length === 0) return;
    const currentIdx = uncertainWords.findIndex(w => w.index === selectedWordIndex);
    const nextIdx = (currentIdx + 1) % uncertainWords.length;
    handleSelectWord(uncertainWords[nextIdx]);
  };

  const handlePrevUncertain = () => {
    if (uncertainWords.length === 0) return;
    const currentIdx = uncertainWords.findIndex(w => w.index === selectedWordIndex);
    const prevIdx = (currentIdx - 1 + uncertainWords.length) % uncertainWords.length;
    handleSelectWord(uncertainWords[prevIdx]);
  };

  // Handle Candidate Decisions
  const handleCandidateDecision = async (decision: 'accepted' | 'rejected' | 'unresolved') => {
    if (!activeCandidate || !currentPage) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      if (decision === 'unresolved') {
        // Replace word in editableText with [தெளிவில்லை]
        const origWord = activeCandidate.original_text;
        setEditableText(prev => prev.replace(origWord, '[தெளிவில்லை]'));
      } else if (decision === 'accepted') {
        // Replace with proposed text
        const origWord = activeCandidate.original_text;
        const propWord = activeCandidate.proposed_text;
        setEditableText(prev => prev.replace(origWord, propWord));
      }

      if (activeCandidate.id && !activeCandidate.id.startsWith('cand_temp_')) {
        await updateCandidateDecision(activeCandidate.id, decision, reviewerNote || 'சரிபார்ப்பாளர் முடிவு');
      }

      setSaveSuccess(`சொல் முடிவு (${decision === 'accepted' ? 'ஏற்கப்பட்டது' : decision === 'rejected' ? 'நிராகரிக்கப்பட்டது' : 'தெளிவில்லை எனக் குறிக்கப்பட்டது'}) பதிவு செய்யப்பட்டது.`);
      loadPage(currentPage.id);
    } catch (e: any) {
      setSaveError('முடிவைச் சேமிப்பதில் பிழை: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save full transcription draft or mark verified
  const handleSavePage = async (markVerified: boolean) => {
    if (!currentPage) return;

    // Strict Anti-Hallucination validation check
    const validation = validateAntiHallucination(
      initialText,
      editableText,
      reviewerNote,
      markVerified
    );

    if (!validation.allowed && validation.warnings.length > 0) {
      setSaveError(validation.warnings.join(' '));
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await savePageTranscription(
        currentPage.id,
        editableText,
        reviewerNote || (markVerified ? 'முழுப் பக்கமும் மனித சரிபார்ப்பு செய்யப்பட்டது' : 'உரை மாற்றங்கள் சேமிக்கப்பட்டன'),
        markVerified,
        reviewerName,
        words
      );
      if (res.success) {
        setIsVerified(markVerified);
        setSaveSuccess(markVerified ? 'பக்கம் மனித சரிபார்ப்பு செய்யப்பட்டதாக உறுதிப்படுத்தப்பட்டது!' : 'வரைவு உரை வெற்றிகரமாகச் சேமிக்கப்பட்டது.');
        loadPage(currentPage.id);
        onRefresh();
      } else {
        setSaveError('சேமிப்பதில் பிழை');
      }
    } catch (e: any) {
      setSaveError(e.message || 'சேவையகப் பிழை');
    } finally {
      setIsSaving(false);
    }
  };

  const originalImgUrl = currentPage
    ? `/api/images/original/${currentPage.original_image_path.split('/').pop()}`
    : '';
  const enhancedImgUrl = currentPage?.enhanced_image_path
    ? `/api/images/enhanced/${currentPage.enhanced_image_path.split('/').pop()}`
    : originalImgUrl;

  // Selected word bbox for crop
  const selectedWordObj = words.find(w => w.index === selectedWordIndex);
  const cropUrl = selectedWordObj && currentPage
    ? `/api/images/crop?path=${encodeURIComponent(currentPage.original_image_path)}&x=${selectedWordObj.bbox.x}&y=${selectedWordObj.bbox.y}&w=${selectedWordObj.bbox.w}&h=${selectedWordObj.bbox.h}`
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Page Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D6C3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
              <CheckCheck className="w-6 h-6 text-[#8B2635]" />
              எழுத்துச் சரிபார்ப்புப் பணிமனை (Evidence-Based Review)
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                சரிபார்க்கப்பட்டது
              </span>
            )}
          </div>
          <p className="text-xs text-[#706257]">
            மூல ஸ்கேன், மேம்பட்ட படம் மற்றும் உரை மூன்றையும் ஒருசேர ஒப்புநோக்கிச் சான்றாதாரங்களுடன் சரிபார்க்கவும்.
          </p>
        </div>

        {/* Page Switcher */}
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

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 3-Panel Synchronized Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* PANEL A: Original Scanned Page (3.5 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-[#E2D6C3] shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0E8DC] pb-2 text-xs">
            <span className="font-serif font-bold text-[#6B1724]">பகுதி ௧: மூல ஸ்கேன் (அசல்)</span>
            <span className="text-[11px] text-[#8C7E74]">100% உண்மை வடிவம்</span>
          </div>

          <div className="relative h-[480px] bg-stone-900 rounded-xl overflow-auto p-2 flex items-center justify-center">
            {currentPage && (
              <div className="relative max-h-full max-w-full">
                <img src={originalImgUrl} alt="மூல ஸ்கேன்" className="max-h-[460px] w-auto object-contain block rounded-xs" />
                {/* Highlight active word */}
                {selectedWordObj && (
                  <div
                    className="absolute border-2 border-amber-400 bg-amber-400/30 z-20 animate-pulse pointer-events-none"
                    style={{
                      left: `${selectedWordObj.bbox_pct.left}%`,
                      top: `${selectedWordObj.bbox_pct.top}%`,
                      width: `${selectedWordObj.bbox_pct.width}%`,
                      height: `${selectedWordObj.bbox_pct.height}%`
                    }}
                  />
                )}
              </div>
            )}
          </div>
          <div className="text-[11px] text-[#7C6E65] text-center">
            மூல வரலாற்று ஆவணம் (எவ்வித மாற்றமும் இன்றிப் பாதுகாக்கப்படுகிறது)
          </div>
        </div>

        {/* PANEL B: Enhanced Image (3.5 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-[#E2D6C3] shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0E8DC] pb-2 text-xs">
            <span className="font-serif font-bold text-[#1E3A2F] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              பகுதி ௨: மேம்பட்ட படம் (OpenCV)
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold">தெளிவுபடுத்தப்பட்டது</span>
          </div>

          <div className="relative h-[480px] bg-stone-900 rounded-xl overflow-auto p-2 flex items-center justify-center">
            {currentPage && (
              <div className="relative max-h-full max-w-full">
                <img src={enhancedImgUrl} alt="மேம்பட்ட படம்" className="max-h-[460px] w-auto object-contain block rounded-xs" />
                {/* Highlight active word */}
                {selectedWordObj && (
                  <div
                    className="absolute border-2 border-cyan-400 bg-cyan-400/30 z-20 animate-pulse pointer-events-none"
                    style={{
                      left: `${selectedWordObj.bbox_pct.left}%`,
                      top: `${selectedWordObj.bbox_pct.top}%`,
                      width: `${selectedWordObj.bbox_pct.width}%`,
                      height: `${selectedWordObj.bbox_pct.height}%`
                    }}
                  />
                )}
              </div>
            )}
          </div>
          <div className="text-[11px] text-[#7C6E65] text-center">
            கறை நீக்கம், மாறுபட்ட செறிவு மற்றும் சாய்வு சரிசெய்யப்பட்ட பார்வை
          </div>
        </div>

        {/* PANEL C: Interactive Word Transcription & Anti-Hallucination Inspector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-[#E2D6C3] shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0E8DC] pb-2 text-xs">
            <span className="font-serif font-bold text-[#6B1724]">பகுதி ௩: எழுத்துச் சரிபார்ப்புக் களம்</span>
            {uncertainWords.length > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {uncertainWords.length} தெளிவற்றவை
              </span>
            )}
          </div>

          {/* Navigation between uncertain words */}
          {uncertainWords.length > 0 && (
            <div className="flex items-center justify-between bg-[#FAF7F2] p-2 rounded-lg border border-[#E8DFC9] text-xs">
              <span className="text-[11px] text-[#6E6157]">தெளிவற்ற சொல் தேடல்:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevUncertain}
                  className="p-1 hover:bg-[#EFE7D8] rounded text-[#4A3E36]"
                  title="முந்தைய தெளிவற்ற சொல்"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextUncertain}
                  className="p-1 hover:bg-[#EFE7D8] rounded text-[#4A3E36]"
                  title="அடுத்த தெளிவற்ற சொல்"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ANTI-HALLUCINATION WORD INSPECTOR */}
          {activeCandidate && (
            <div className="bg-[#FAF5ED] rounded-xl p-3 border-2 border-[#D49A3D]/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6B1724] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8C5A20]" />
                  சான்றாதார ஆய்வு (Word Inspector)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeCandidate.confidence >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  OCR: {activeCandidate.confidence}%
                </span>
              </div>

              {/* Dynamic Image Crop Snippet */}
              {cropUrl && (
                <div className="p-2 bg-stone-900 rounded-lg text-center">
                  <span className="text-[9px] text-stone-400 block mb-1">மூல ஆவணப் படம் (Crop):</span>
                  <img src={cropUrl} alt="சொல் துணுக்கு" className="max-h-16 mx-auto rounded object-contain border border-stone-700" />
                </div>
              )}

              {/* Original OCR vs Proposed Suggestion */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded-lg border border-[#E0D3C1]">
                  <span className="text-[10px] text-[#8C7E74] block">OCR கண்டறிந்த வடிவம்:</span>
                  <span className="font-serif font-bold text-[#2C241E] text-sm">
                    {activeCandidate.original_text}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-amber-300">
                  <span className="text-[10px] text-[#8C5A20] block">பரிந்துரை வடிவம்:</span>
                  <span className="font-serif font-bold text-[#8B2635] text-sm">
                    {activeCandidate.proposed_text}
                  </span>
                </div>
              </div>

              {/* Supporting Evidence Note */}
              <div className="text-[11px] text-[#5A4D43] bg-white/80 p-2 rounded-lg border border-[#E2D6C3]">
                <span className="font-semibold text-[#8C5A20] block">ஆதாரக் குறிப்பு:</span>
                {activeCandidate.evidence}
              </div>

              {/* Reviewer Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCandidateDecision('accepted')}
                  className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ஏற்கவும்
                </button>
                <button
                  type="button"
                  onClick={() => handleCandidateDecision('rejected')}
                  className="px-2 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  நிராகரி
                </button>
                <button
                  type="button"
                  onClick={() => handleCandidateDecision('unresolved')}
                  className="px-2 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  title="தெளிவற்றதாகக் குறிக்க"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                  [தெளிவில்லை]
                </button>
              </div>
            </div>
          )}

          {/* Editable Transcription Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4A3E36]">
              <span>திருத்தக்கூடிய தமிழ் உரை:</span>
              <button
                onClick={() => setEditableText(initialText)}
                className="text-[11px] text-[#8C7E74] hover:text-[#6B1724] flex items-center gap-1"
                title="முந்தைய உரையை மீட்டெடுக்க"
              >
                <Undo2 className="w-3 h-3" />
                மீட்டெடு
              </button>
            </div>
            <textarea
              rows={9}
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full p-2.5 text-xs sm:text-sm font-serif leading-relaxed bg-[#FAF7F2] border border-[#D5C9B3] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8B2635] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Reviewer Note & Name */}
          <div className="space-y-2 pt-1 border-t border-[#F0E8DC]">
            <div>
              <label className="block text-[11px] font-semibold text-[#5A4D43] mb-0.5">
                சரிபார்ப்புக் குறிப்பு (Audit Note):
              </label>
              <input
                type="text"
                placeholder="எ.கா. அளபெடை வடிவம் ஒப்புநோக்கப்பட்டு உறுதிசெய்யப்பட்டது"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
              />
            </div>

            {/* Bottom Actions: Save Draft vs Mark Verified */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSavePage(false)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                வரைவைச் சேமி
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSavePage(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#8B2635] hover:bg-[#6B1724] text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-102"
              >
                <CheckCheck className="w-4 h-4 text-amber-300" />
                பக்கத்தை உறுதிப்படுத்து
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Timeline for this Page */}
      {currentPage?.audit_history && currentPage.audit_history.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-xs space-y-3">
          <h3 className="font-serif text-sm font-bold text-[#6B1724] flex items-center gap-2">
            <History className="w-4 h-4 text-[#8B2635]" />
            இப்பக்கத்தின் திருத்த வரலாறு (Audit Trail)
          </h3>
          <div className="divide-y divide-[#F0E8DC] text-xs">
            {currentPage.audit_history.map((entry, idx) => (
              <div key={idx} className="py-2.5 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#3A2E26]">{entry.action}</span>
                    <span className="text-[10px] text-[#8C7E74]">{new Date(entry.timestamp).toLocaleString('ta-IN')}</span>
                  </div>
                  {entry.reviewer_note && (
                    <p className="text-[11px] text-[#5D5046] italic">குறிப்பு: {entry.reviewer_note}</p>
                  )}
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-[#FAF7F2] rounded text-[#6E6157] shrink-0 border border-[#E0D2BE]">
                  {entry.updated_text.slice(0, 30)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
