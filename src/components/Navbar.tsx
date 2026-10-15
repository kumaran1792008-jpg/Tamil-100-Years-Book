import React, { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  Library, 
  Sparkles, 
  ScanText, 
  CheckCheck, 
  History, 
  BarChart3, 
  FileText, 
  Settings, 
  Menu, 
  X,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { OcrDiagnostics } from '../types.ts';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  ocrDiagnostics: OcrDiagnostics | null;
  onOpenSearch: () => void;
}

export const NAV_ITEMS = [
  { id: 'home', label: 'முகப்பு', icon: BookOpen },
  { id: 'upload', label: 'புத்தகத்தைப் பதிவேற்று', icon: Upload },
  { id: 'library', label: 'டிஜிட்டல் நூலகம்', icon: Library },
  { id: 'enhance', label: 'பக்கங்களை மேம்படுத்து', icon: Sparkles },
  { id: 'ocr', label: 'தமிழ் OCR', icon: ScanText },
  { id: 'review', label: 'எழுத்துச் சரிபார்ப்பு', icon: CheckCheck },
  { id: 'history', label: 'திருத்த வரலாறு', icon: History },
  { id: 'analytics', label: 'தரவுப் பகுப்பாய்வு', icon: BarChart3 },
  { id: 'reports', label: 'அறிக்கைகள்', icon: FileText },
  { id: 'settings', label: 'அமைப்புகள்', icon: Settings }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  ocrDiagnostics,
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E2D6C3] shadow-xs">
      {/* Top Banner with Historical Seal & OCR Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <button 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-3.5 text-left group transition-transform focus:outline-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-radial from-[#8B2635] to-[#5C141F] flex items-center justify-center text-white shadow-md ring-2 ring-[#B47B36]/30 group-hover:ring-[#B47B36] transition-all">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#FAF7F2]">த</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#6B1724]">
                  தமிழ் மரபு AI
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase bg-[#B47B36]/15 text-[#8C5A20] rounded-md border border-[#B47B36]/30">
                  ஆவணப் பாதுகாப்பு
                </span>
              </div>
              <p className="text-xs text-[#6B5E55] hidden sm:block">
                100 ஆண்டுப் பழந்தமிழ் நூல்கள் எண்மியப் படிவகம் & எழுத்துச் சரிபார்ப்பு
              </p>
            </div>
          </button>

          {/* Engine Status & Search Action */}
          <div className="flex items-center gap-3">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#5A4D43] bg-white hover:bg-[#F4EFE6] border border-[#DCD0BE] rounded-lg shadow-2xs transition-colors"
              title="நூல்களில் உரை தேடவும்"
            >
              <Search className="w-4 h-4 text-[#8B2635]" />
              <span className="hidden md:inline">நூலில் தேடுக...</span>
            </button>

            {/* OCR Engine Live Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#FAF7F2] border border-[#DCD0BE] rounded-lg text-xs font-medium">
              {ocrDiagnostics?.tamil_supported ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-emerald-900 font-medium">Tesseract OCR (tam) இயங்குகிறது</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-800">OCR மாதிரிப் பயன்முறை</span>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#6B1724] hover:bg-[#EDE4D6] transition-colors"
              aria-label="வழிசெலுத்தல் மெனு"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex space-x-1 border-t border-[#E8DFC9] py-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#8B2635] text-white shadow-xs font-semibold'
                    : 'text-[#4A3E36] hover:bg-[#EFE7D8] hover:text-[#6B1724]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#8B2635]/80'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2D6C3] bg-[#FAF7F2] px-4 pt-2 pb-6 space-y-1 shadow-xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#8B2635] text-white'
                    : 'text-[#4A3E36] hover:bg-[#EFE7D8]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300' : 'text-[#8B2635]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
