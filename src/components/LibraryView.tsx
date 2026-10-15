import React, { useState } from 'react';
import { 
  Library, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ScanText,
  AlertTriangle,
  X
} from 'lucide-react';
import { Book } from '../types.ts';
import { updateBook, deleteBook } from '../services/api.ts';

interface LibraryViewProps {
  books: Book[];
  selectedBook: Book | null;
  onSelectBook: (book: Book) => void;
  onNavigatePage: (bookId: string, pageId: string, targetView: 'enhance' | 'ocr' | 'review') => void;
  onRefresh: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  selectedBook,
  onSelectBook,
  onNavigatePage,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Metadata State
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editSource, setEditSource] = useState('');

  // Delete Confirmation State
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter books
  const filteredBooks = books.filter((b) => {
    const matchesQuery = 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.source && b.source.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleOpenEdit = (b: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook(b);
    setEditTitle(b.title);
    setEditAuthor(b.author);
    setEditYear(b.publication_year ? String(b.publication_year) : '');
    setEditSource(b.source || '');
  };

  const handleSaveEdit = async () => {
    if (!editingBook) return;
    try {
      await updateBook(editingBook.id, {
        title: editTitle,
        author: editAuthor,
        publication_year: editYear ? parseInt(editYear, 10) : null,
        source: editSource
      });
      setEditingBook(null);
      onRefresh();
    } catch (e: any) {
      alert('சேமிப்பதில் பிழை: ' + e.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    setIsDeleting(true);
    try {
      await deleteBook(deletingBook.id);
      setDeletingBook(null);
      onRefresh();
    } catch (e: any) {
      alert('நீக்குவதில் பிழை: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D6C3] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
            <Library className="w-6 h-6 text-[#8B2635]" />
            டிஜிட்டல் நூலகம் & ஆவணக் காப்பகம்
          </h1>
          <p className="text-xs text-[#706257]">
            சேமிக்கப்பட்ட தமிழ் வரலாற்று நூல்கள், பக்கங்கள் மற்றும் சரிபார்ப்பு நிலை
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7E74]" />
            <input
              type="text"
              placeholder="தலைப்பு அல்லது ஆசிரியர்..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D5C9B3] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#8B2635] w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#D5C9B3] rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-[#8C7E74]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs text-[#4A3E36] bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="all">அனைத்து நிலைகளும்</option>
              <option value="verified">சரிபார்க்கப்பட்டது</option>
              <option value="in_review">சரிபார்ப்பில் உள்ளது</option>
              <option value="ocr_completed">OCR முடிந்தது</option>
              <option value="pending">காத்திருக்கிறது</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Books Grid + Selected Book Page Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Books List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#7C6E65]">
            <span>கிடைத்த நூல்கள் ({filteredBooks.length})</span>
            <span>வரிசை: புதியவை முதலில்</span>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-[#E2D6C3] text-center text-xs text-[#8C7E74]">
              பொருத்தமான நூல்கள் எதுவும் காணப்படவில்லை.
            </div>
          ) : (
            filteredBooks.map((b) => {
              const isSelected = selectedBook?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBook(b)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/70 border-[#B47B36] shadow-md ring-1 ring-[#B47B36]/30'
                      : 'bg-white border-[#E2D6C3] hover:border-[#C8BBA7] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-sm font-bold text-[#2C241E] leading-snug">
                      {b.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      b.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : b.status === 'in_review'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}>
                      {b.status === 'verified' ? 'உறுதியானது' : b.status === 'in_review' ? 'சரிபார்ப்பில்' : 'OCR தயார்'}
                    </span>
                  </div>

                  <p className="text-xs text-[#706257] mt-1">
                    {b.author} {b.publication_year ? `(${b.publication_year})` : ''}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#8C7E74] pt-2 border-t border-[#F0E8DC]">
                    <span>{b.total_pages} பக்கங்கள்</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(b, e)}
                        className="p-1 text-[#8C7E74] hover:text-[#6B1724] rounded-sm transition-colors"
                        title="விவரங்களைத் திருத்து"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingBook(b)}
                        className="p-1 text-[#8C7E74] hover:text-rose-700 rounded-sm transition-colors"
                        title="நூலை நீக்கு"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Book Pages & Details (7 cols) */}
        <div className="lg:col-span-7">
          {selectedBook ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E2D6C3] shadow-md space-y-6">
              {/* Book Header */}
              <div className="border-b border-[#F0E8DC] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#6B1724]">
                    {selectedBook.title}
                  </h2>
                  <p className="text-xs text-[#6F6156] mt-1">
                    ஆசிரியர்: <span className="font-semibold">{selectedBook.author}</span> • வெளியீடு: <span className="font-semibold">{selectedBook.publication_year || 'தெரியவில்லை'}</span>
                  </p>
                  <p className="text-xs text-[#8C7E74] mt-0.5 italic">
                    மூலப்பதிப்பு: {selectedBook.source || 'சுவடிக் காப்பகம்'}
                  </p>
                </div>

                {/* Direct Exports */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/export/${selectedBook.id}/txt`}
                    download
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[#FAF7F2] hover:bg-[#EDE4D6] text-[#4A3E36] rounded-lg border border-[#D5C9B3] transition-colors"
                    title="TXT கோப்பாகப் பதிவிறக்குக"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8B2635]" />
                    TXT
                  </a>
                  <a
                    href={`/api/export/${selectedBook.id}/csv`}
                    download
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[#FAF7F2] hover:bg-[#EDE4D6] text-[#4A3E36] rounded-lg border border-[#D5C9B3] transition-colors"
                    title="சரிபார்ப்பு அறிக்கை CSV பதிவிறக்குக"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B47B36]" />
                    CSV
                  </a>
                  <a
                    href={`/api/export/${selectedBook.id}/json`}
                    download
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[#FAF7F2] hover:bg-[#EDE4D6] text-[#4A3E36] rounded-lg border border-[#D5C9B3] transition-colors"
                    title="JSON காப்பகக் கோப்பாகப் பதிவிறக்குக"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    JSON
                  </a>
                </div>
              </div>

              {/* Pages Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#4A3E36]">
                  <span>நூலின் பக்கங்கள் ({selectedBook.pages?.length || 0})</span>
                  <span className="text-[#8C7E74]">பக்கத்தைத் தேர்ந்தெடுத்து செயலைத் தொடங்கவும்</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedBook.pages?.map((p) => {
                    const thumbUrl = p.enhanced_image_path
                      ? `/api/images/enhanced/${p.enhanced_image_path.split('/').pop()}`
                      : `/api/images/original/${p.original_image_path.split('/').pop()}`;

                    return (
                      <div
                        key={p.id}
                        className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E2D6C3] flex flex-col justify-between hover:border-[#B47B36] transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Thumbnail */}
                          <div className="w-16 h-22 bg-stone-200 rounded-lg overflow-hidden border border-[#D5C9B3] shrink-0">
                            <img
                              src={thumbUrl}
                              alt={`பக்கம் ${p.page_number}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-sm font-bold text-[#6B1724]">
                                பக்கம் {p.page_number}
                              </span>
                              {p.processing_status === 'verified' && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              p.processing_status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.processing_status === 'enhanced'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}>
                              {p.processing_status === 'verified'
                                ? 'சரிபார்க்கப்பட்டது'
                                : p.processing_status === 'enhanced'
                                ? 'மேம்படுத்தப்பட்டது'
                                : 'மூல ஸ்கேன்'}
                            </span>
                            <p className="text-[11px] text-[#786B62]">
                              {p.transcription ? 'உரை அடையாளம் காணப்பட்டது' : 'OCR காத்திருக்கிறது'}
                            </p>
                          </div>
                        </div>

                        {/* Page Action Buttons */}
                        <div className="mt-3 pt-2 border-t border-[#E8DFC9] flex items-center justify-between gap-1 text-[11px]">
                          <button
                            onClick={() => onNavigatePage(selectedBook.id, p.id, 'enhance')}
                            className="px-2 py-1 bg-white hover:bg-[#EFE7D8] text-[#5A4D43] rounded-md border border-[#D5C9B3] flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-[#B47B36]" />
                            மேம்படுத்து
                          </button>
                          <button
                            onClick={() => onNavigatePage(selectedBook.id, p.id, 'ocr')}
                            className="px-2 py-1 bg-white hover:bg-[#EFE7D8] text-[#5A4D43] rounded-md border border-[#D5C9B3] flex items-center gap-1 transition-colors"
                          >
                            <ScanText className="w-3 h-3 text-blue-600" />
                            OCR
                          </button>
                          <button
                            onClick={() => onNavigatePage(selectedBook.id, p.id, 'review')}
                            className="px-2.5 py-1 bg-[#8B2635] hover:bg-[#6B1724] text-white rounded-md font-semibold flex items-center gap-1 transition-colors"
                          >
                            சரிபார்
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 bg-white rounded-2xl border border-dashed border-[#D5C9B3] flex flex-col items-center justify-center p-6 text-center text-[#8C7E74]">
              <Library className="w-10 h-10 text-[#C8BBA7] mb-2" />
              <p className="text-sm font-semibold">இடது பட்டியலிலிருந்து ஒரு நூலைத் தேர்ந்தெடுக்கவும்</p>
              <p className="text-xs text-[#A09388] mt-1">
                பக்கங்களின் விவரங்கள், பட மேம்பாடு மற்றும் சரிபார்ப்புப் பலகை இங்கே தோன்றும்.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Book Metadata Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2D6C3] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E8DC] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#6B1724]">
                நூல் விவரங்களைத் திருத்து
              </h3>
              <button onClick={() => setEditingBook(null)} className="text-[#8C7E74] hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">தலைப்பு</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">ஆசிரியர்</label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">பதிப்பு ஆண்டு</label>
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">மூல ஆவணம்</label>
                <input
                  type="text"
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingBook(null)}
                className="px-4 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                ரத்து செய்க
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-1.5 text-xs font-semibold bg-[#8B2635] text-white hover:bg-[#6B1724] rounded-lg shadow-xs"
              >
                சேமிக்க
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="font-serif text-base font-bold text-rose-900">
                நூலை நீக்குவதை உறுதிசெய்க
              </h3>
            </div>

            <p className="text-xs text-[#5D5046]">
              "{deletingBook.title}" என்னும் நூல் மற்றும் அதன் அனைத்துப் பக்கங்கள், OCR உரைகள் நிரந்தரமாக நீக்கப்படும்.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBook(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                ரத்து
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                {isDeleting ? 'நீக்குகிறது...' : 'ஆம், நீக்குக'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
