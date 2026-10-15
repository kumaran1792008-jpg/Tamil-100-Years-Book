import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  BookA, 
  Search, 
  Plus, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Check, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DictionaryEntry, OcrDiagnostics } from '../types.ts';
import { fetchDictionary, addDictionaryEntry, fetchOcrDiagnostics } from '../services/api.ts';

interface SettingsViewProps {
  ocrDiagnostics: OcrDiagnostics | null;
  onRefreshDiagnostics: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  ocrDiagnostics,
  onRefreshDiagnostics
}) => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'diagnostics'>('dictionary');

  // Dictionary state
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [searchWord, setSearchWord] = useState('');
  const [isLoadingDict, setIsLoadingDict] = useState(false);

  // Add entry modal/form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newAlts, setNewAlts] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newPeriod, setNewPeriod] = useState('சங்க காலம் / மரபு');
  const [isAdding, setIsAdding] = useState(false);
  const [dictMessage, setDictMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDictionary(searchWord);
  }, [searchWord]);

  const loadDictionary = async (query = '') => {
    setIsLoadingDict(true);
    try {
      const res = await fetchDictionary(query);
      if (res.success) {
        setEntries(res.entries);
      }
    } catch (e) {
      // continue
    } finally {
      setIsLoadingDict(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;
    setIsAdding(true);
    setDictMessage(null);

    try {
      const res = await addDictionaryEntry({
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        alternate_spellings: newAlts.trim(),
        source_reference: newSource.trim() || 'பயனர் குறிப்பு',
        period: newPeriod
      });
      if (res.success) {
        setDictMessage(`சொல் "${newWord}" அகராதியில் வெற்றிகரமாகச் சேர்க்கப்பட்டது!`);
        setNewWord('');
        setNewMeaning('');
        setNewAlts('');
        setNewSource('');
        setShowAddModal(false);
        loadDictionary(searchWord);
      } else {
        setDictMessage(res.error || 'சொல்லைச் சேர்ப்பதில் பிழை');
      }
    } catch (err: any) {
      setDictMessage(err.message || 'சேவையகப் பிழை');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2D6C3] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#8B2635]" />
            அமைப்புகள் & வரலாற்றுத் தமிழ் அகராதி
          </h1>
          <p className="text-xs text-[#706257]">
            பழந்தமிழ் சொற்களஞ்சியம், OCR இயந்திர நிலவரம் மற்றும் கணினி அமைப்புகள்
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex p-1 bg-[#FAF7F2] rounded-xl border border-[#D5C9B3] text-xs">
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'dictionary'
                ? 'bg-[#8B2635] text-white shadow-xs'
                : 'text-[#4A3E36] hover:text-[#6B1724]'
            }`}
          >
            <BookA className="w-4 h-4" />
            வரலாற்று அகராதி
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-[#8B2635] text-white shadow-xs'
                : 'text-[#4A3E36] hover:text-[#6B1724]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            OCR இயந்திர நிலவரம்
          </button>
        </div>
      </div>

      {dictMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dictMessage}</span>
        </div>
      )}

      {/* TAB 1: HISTORICAL DICTIONARY */}
      {activeTab === 'dictionary' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7E74]" />
              <input
                type="text"
                placeholder="பழந்தமிழ்ச் சொல்லைத் தேடுக (எ.கா: ஒல்கா, தொழாஅர், யாணர்)..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D5C9B3] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#8B2635]"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#8B2635] hover:bg-[#6B1724] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              புதிய சொல்லைச் சேர்க்க
            </button>
          </div>

          {/* Dictionary Entries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingDict ? (
              <div className="col-span-2 p-12 text-center text-xs text-[#8C7E74]">
                அகராதித் தரவுகள் ஏற்றப்படுகின்றன...
              </div>
            ) : entries.length === 0 ? (
              <div className="col-span-2 p-12 bg-white rounded-2xl border border-[#E2D6C3] text-center text-xs text-[#8C7E74]">
                பொருத்தமான அகராதிச் சொல் எதுவும் கிடைக்கவில்லை. புதிய சொல்லைச் சேர்க்கலாம்.
              </div>
            ) : (
              entries.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-[#E2D6C3] shadow-xs space-y-2.5 hover:border-[#B47B36] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-serif text-lg font-bold text-[#6B1724]">
                      {item.word}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF7F2] text-[#8C5A20] border border-[#E0D2BE]">
                      {item.period || 'பண்டைப் பயன்பாடு'}
                    </span>
                  </div>

                  <p className="text-xs text-[#2C241E] leading-relaxed">
                    {item.meaning}
                  </p>

                  {item.alternate_spellings && (
                    <div className="text-[11px] text-[#786B62]">
                      <span className="font-semibold text-[#4A3E36]">மாற்று வடிவங்கள்: </span>
                      {item.alternate_spellings}
                    </div>
                  )}

                  {item.source_reference && (
                    <div className="text-[11px] text-[#8C5A20] font-medium pt-1 border-t border-[#F0E8DC]">
                      ஆதாரம்: {item.source_reference}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OCR DIAGNOSTICS & SYSTEM STATUS */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2D6C3] shadow-md space-y-6">
          <div className="border-b border-[#F0E8DC] pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#6B1724] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#8B2635]" />
                Tesseract OCR & Python சூழல் பரிசோதனை
              </h2>
              <p className="text-xs text-[#706257]">
                இயந்திரத்தின் பதிப்பு, நிறுவப்பட்ட மொழிப்பொதிகள் மற்றும் செயல்திறன்
              </p>
            </div>
            <button
              onClick={onRefreshDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EDE4D6] text-[#4A3E36] rounded-lg border border-[#D5C9B3] text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              மீளாய்வு செய்
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E2D6C3] space-y-2">
              <span className="text-[#8C7E74] block">OCR பொறி:</span>
              <span className="font-bold text-sm text-[#2C241E] block">
                {ocrDiagnostics?.engine || 'Tesseract OCR'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                பதிப்பு: {ocrDiagnostics?.version || '5.3.0'}
              </span>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E2D6C3] space-y-2">
              <span className="text-[#8C7E74] block">தமிழ் மொழிப் பொதி நிலை:</span>
              <div className="flex items-center gap-2">
                {ocrDiagnostics?.tamil_supported ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-800">நிறுவப்பட்டு தயாராக உள்ளது (tam)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-sm text-rose-800">மொழிப்பொதி தேவை (Missing)</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-[#7C6E65] block">
                நிறுவப்பட்டுள்ள மொழிகள்: {ocrDiagnostics?.installed_languages?.join(', ') || 'eng, osd, tam'}
              </span>
            </div>
          </div>

          {/* Installation & Troubleshooting guide */}
          <div className="p-5 bg-[#FAF5ED] rounded-xl border border-[#D49A3D]/40 space-y-3 text-xs">
            <span className="font-bold text-[#6B1724] block">
              கணினி நிறுவல் மற்றும் தீர்வுக் குறிப்புகள் (Troubleshooting Guide)
            </span>
            <p className="text-[#5D5046] leading-relaxed">
              புதிய சேவையகத்தில் அல்லது லினக்ஸ்/விண்டோஸ் சூழலில் தமிழ் OCR ஐ இயக்க பின்வரும் கட்டளைகளை இயக்கலாம்:
            </p>
            <div className="p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
              <div># Linux (Debian/Ubuntu):</div>
              <div className="text-amber-400">sudo apt-get update && sudo apt-get install -y tesseract-ocr tesseract-ocr-tam</div>
              <div className="pt-1"># Python Dependencies:</div>
              <div className="text-emerald-400">pip install pillow pytesseract pymupdf opencv-python-headless</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Dictionary Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddEntry} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2D6C3] space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#6B1724]">
              புதிய பழந்தமிழ்ச் சொல்லைச் சேர்க்க
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#4A3E36] mb-1">சொல் *</label>
                <input
                  type="text"
                  required
                  placeholder="எ.கா. ஒல்கா"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A3E36] mb-1">பொருள் *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="எ.கா. தளராத, கெடாத நிலை"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A3E36] mb-1">மாற்று எழுத்து வடிவங்கள்</label>
                <input
                  type="text"
                  placeholder="எ.கா. ஒல்காத"
                  value={newAlts}
                  onChange={(e) => setNewAlts(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4A3E36] mb-1">மூல இலக்கியம் / ஆதாரம்</label>
                <input
                  type="text"
                  placeholder="எ.கா. தொல்காப்பியம் சிறப்புப் பாயிரம்"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                ரத்து
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="px-5 py-1.5 text-xs font-bold bg-[#8B2635] text-white hover:bg-[#6B1724] rounded-lg shadow-xs"
              >
                {isAdding ? 'சேமிக்கிறது...' : 'சேமிக்க'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
