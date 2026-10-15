import React, { useState } from 'react';
import { 
  Search, 
  X, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Filter
} from 'lucide-react';
import { searchArchive } from '../services/api.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (bookId: string, pageId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPage
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchArchive(searchTerm.trim(), searchType);
      if (res.success) {
        setResults(res.results || []);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E2D6C3] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <form onSubmit={handleSearch} className="p-4 border-b border-[#EAE0D0] flex items-center gap-3 bg-[#FAF7F2]">
          <Search className="w-5 h-5 text-[#8B2635] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="நூல்களில் உரை தேடுக (எ.கா: அகர முதல, கைக்கிளை, அமிழ்தம்)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#2C241E] focus:outline-hidden font-serif"
          />
          <div className="flex items-center gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="text-xs text-[#5D5046] bg-white border border-[#D5C9B3] rounded-lg px-2 py-1"
            >
              <option value="all">அனைத்து உரை</option>
              <option value="reviewed">சரிபார்க்கப்பட்டவை</option>
              <option value="ocr">மூல OCR</option>
            </select>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#8C7E74] hover:text-[#2C241E] rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isSearching ? (
            <div className="py-12 text-center text-xs text-[#8C7E74]">
              நூல்களில் தேடப்படுகிறது...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#7C6E65]">
                கண்டுபிடிக்கப்பட்ட பொருத்தங்கள் ({results.length}):
              </span>
              {results.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onNavigateToPage(r.book_id, r.page_id);
                    onClose();
                  }}
                  className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E2D6C3] hover:border-[#B47B36] cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-sm font-bold text-[#6B1724] group-hover:underline">
                      {r.book_title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-[#8C5A20] border border-[#E0D2BE]">
                      பக்கம் {r.page_number}
                    </span>
                  </div>

                  <p className="text-xs font-serif text-[#3A2E26] leading-relaxed bg-white p-2 rounded-lg border border-[#EDE3D4]">
                    {r.snippet}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#8C7E74] pt-1">
                    <span>ஆசிரியர்: {r.book_author}</span>
                    <span className="text-[#8B2635] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      பக்கத்தைத் திறக்க
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="py-12 text-center text-xs text-[#8C7E74]">
              "{searchTerm}" என்பதற்குப் பொருத்தமான வரிகள் எதுவும் காணப்படவில்லை.
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#8C7E74]">
              தேட விரும்பும் தமிழ் சொல் அல்லது தொடரை மேலே தட்டச்சு செய்து 'Enter' அழுத்தவும்.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
