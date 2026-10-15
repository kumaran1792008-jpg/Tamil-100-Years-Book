import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './components/HomeView.tsx';
import { UploadView } from './components/UploadView.tsx';
import { LibraryView } from './components/LibraryView.tsx';
import { EnhanceView } from './components/EnhanceView.tsx';
import { OcrView } from './components/OcrView.tsx';
import { ReviewWorkspace } from './components/ReviewWorkspace.tsx';
import { AuditHistoryView } from './components/AuditHistoryView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { Book, AnalyticsData, OcrDiagnostics } from './types.ts';
import { fetchBooks, fetchBook, fetchAnalytics, fetchOcrDiagnostics } from './services/api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [ocrDiagnostics, setOcrDiagnostics] = useState<OcrDiagnostics | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [booksRes, analyticsRes, diagRes] = await Promise.all([
        fetchBooks(),
        fetchAnalytics(),
        fetchOcrDiagnostics()
      ]);

      if (booksRes.success && booksRes.books) {
        setBooks(booksRes.books);
        if (booksRes.books.length > 0 && !selectedBook) {
          // Fetch full book details with pages
          const detailRes = await fetchBook(booksRes.books[0].id);
          if (detailRes.success && detailRes.book) {
            setSelectedBook(detailRes.book);
            if (detailRes.book.pages && detailRes.book.pages.length > 0) {
              setSelectedPageId(detailRes.book.pages[0].id);
            }
          }
        }
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.analytics);
      }

      if (diagRes) {
        setOcrDiagnostics(diagRes);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  const handleSelectBook = async (book: Book) => {
    try {
      const detailRes = await fetchBook(book.id);
      if (detailRes.success && detailRes.book) {
        setSelectedBook(detailRes.book);
        if (detailRes.book.pages && detailRes.book.pages.length > 0) {
          setSelectedPageId(detailRes.book.pages[0].id);
        }
      } else {
        setSelectedBook(book);
      }
    } catch (e) {
      setSelectedBook(book);
    }
  };

  const handleNavigatePage = (bookId: string, pageId: string, targetView: 'enhance' | 'ocr' | 'review') => {
    const b = books.find(item => item.id === bookId);
    if (b) {
      handleSelectBook(b);
    }
    setSelectedPageId(pageId);
    setActiveTab(targetView);
  };

  const handleUploadSuccess = async (bookId: string) => {
    await loadInitialData();
    const b = books.find(item => item.id === bookId);
    if (b) {
      await handleSelectBook(b);
    }
    setActiveTab('library');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C241E] font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        ocrDiagnostics={ocrDiagnostics}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <HomeView
            books={books}
            analytics={analytics}
            ocrDiagnostics={ocrDiagnostics}
            onNavigate={(tab, bId, pId) => {
              if (bId && pId) {
                handleNavigatePage(bId, pId, tab as any);
              } else {
                setActiveTab(tab);
              }
            }}
            onSelectBook={handleSelectBook}
          />
        )}

        {activeTab === 'upload' && (
          <UploadView onUploadSuccess={handleUploadSuccess} />
        )}

        {activeTab === 'library' && (
          <LibraryView
            books={books}
            selectedBook={selectedBook}
            onSelectBook={handleSelectBook}
            onNavigatePage={handleNavigatePage}
            onRefresh={loadInitialData}
          />
        )}

        {activeTab === 'enhance' && (
          <EnhanceView
            books={books}
            selectedBook={selectedBook}
            selectedPageId={selectedPageId}
            onSelectBook={handleSelectBook}
            onSelectPageId={(pId) => setSelectedPageId(pId)}
            onNavigateToOcr={(pId) => {
              setSelectedPageId(pId);
              setActiveTab('ocr');
            }}
          />
        )}

        {activeTab === 'ocr' && (
          <OcrView
            books={books}
            selectedBook={selectedBook}
            selectedPageId={selectedPageId}
            ocrDiagnostics={ocrDiagnostics}
            onSelectBook={handleSelectBook}
            onSelectPageId={(pId) => setSelectedPageId(pId)}
            onNavigateToReview={(pId) => {
              setSelectedPageId(pId);
              setActiveTab('review');
            }}
          />
        )}

        {activeTab === 'review' && (
          <ReviewWorkspace
            books={books}
            selectedBook={selectedBook}
            selectedPageId={selectedPageId}
            onSelectBook={handleSelectBook}
            onSelectPageId={(pId) => setSelectedPageId(pId)}
            onRefresh={loadInitialData}
          />
        )}

        {activeTab === 'history' && (
          <AuditHistoryView
            books={books}
            onNavigateToPage={(bId, pId) => handleNavigatePage(bId, pId, 'review')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} />
        )}

        {activeTab === 'reports' && (
          <ReportsView books={books} analytics={analytics} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            ocrDiagnostics={ocrDiagnostics}
            onRefreshDiagnostics={loadInitialData}
          />
        )}
      </main>

      {/* Global Full-Text Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigateToPage={(bId, pId) => handleNavigatePage(bId, pId, 'review')}
      />

      {/* Historical Archival Footer */}
      <footer className="mt-auto border-t border-[#E2D6C3] bg-[#F4EFE6]/80 text-[#6B5E55] py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-1">
            <span className="font-serif font-bold text-[#6B1724]">தமிழ் மரபு AI</span> — 100 ஆண்டுப் பழைமையான தமிழ் நூல்கள் எண்மியப் பாதுகாப்பு அமைப்பு
            <p className="text-[11px] text-[#8C7E74]">
              உண்மையான பட மீட்பு • Tesseract OCR (tam) • சான்றாதார எழுத்துச் சரிபார்ப்பு (Anti-Hallucination)
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#8C5A20] font-semibold">தமிழ் மரபுச் சுவடிகள் காப்பகம்</span>
            <span>•</span>
            <span>திறந்த எண்மியப் படிவகம்</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
