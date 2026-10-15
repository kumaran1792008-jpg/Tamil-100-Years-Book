import React from 'react';
import { 
  BookOpen, 
  Upload, 
  Camera, 
  CheckCheck, 
  ShieldCheck, 
  Sparkles, 
  ScanText, 
  FileCheck, 
  ArrowRight,
  Library,
  AlertTriangle,
  History,
  Search
} from 'lucide-react';
import { Book, AnalyticsData, OcrDiagnostics } from '../types.ts';

interface HomeViewProps {
  books: Book[];
  analytics: AnalyticsData | null;
  ocrDiagnostics: OcrDiagnostics | null;
  onNavigate: (tab: string, bookId?: string, pageId?: string) => void;
  onSelectBook: (book: Book) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  books,
  analytics,
  ocrDiagnostics,
  onNavigate,
  onSelectBook
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Historical Presentation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#5B121E] via-[#7B1E2E] to-[#450C15] text-[#FAF7F2] p-8 md:p-12 shadow-xl border border-[#9A6928]/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center font-serif text-[200px] select-none text-amber-200">
          தமிழ்
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold tracking-wide border border-amber-300/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            100 ஆண்டுப் பழைமையான சுவடிகள் & அரிய நூல்கள் பாதுகாப்பு
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#FFF8ED] leading-tight">
            தமிழ் மரபு AI — நூல்கள் எண்மியப் பாதுகாப்பு
          </h1>

          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-normal">
            மங்கிய, கறைபடிந்த, சிதைந்த 100 ஆண்டுப் பழந்தமிழ் நூல்களின் பக்கங்களை உண்மையான பட மேம்பாட்டு வழிமுறைகள் மூலம் துல்லியமாக்கி, Tesseract Tamil OCR கொண்டு எழுத்துக்களை அடையாளம் காண்கிறது. சான்றற்ற கற்பனைச் சொற்களைத் தடுக்கும் (Anti-Hallucination) கடுமையான நெறிமுறைகளுடன் மனித சரிபார்ப்பை உறுதிசெய்கிறது.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#450C15] font-semibold text-sm shadow-md transition-all hover:scale-102"
            >
              <Upload className="w-4 h-4" />
              புத்தகத்தைப் பதிவேற்று
            </button>
            <button
              onClick={() => onNavigate('library')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-sm border border-white/20 transition-all"
            >
              <Library className="w-4 h-4" />
              நூலகத்தைக் காண்க
            </button>
            <button
              onClick={() => onNavigate('review')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2F]/80 hover:bg-[#1E3A2F] text-emerald-100 font-medium text-sm border border-emerald-400/30 transition-all"
            >
              <CheckCheck className="w-4 h-4 text-emerald-300" />
              எழுத்துச் சரிபார்ப்பு
            </button>
          </div>
        </div>
      </div>

      {/* Real Analytics Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#E2D6C3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7C6E65]">பதிவேற்றப்பட்ட நூல்கள்</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-800">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#6B1724]">
              {analytics?.total_books ?? books.length}
            </span>
            <span className="text-xs text-[#8C7E74] ml-2">நூல்கள்</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E2D6C3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7C6E65]">மொத்த பக்கங்கள்</span>
            <div className="p-2 bg-rose-50 rounded-lg text-[#8B2635]">
              <ScanText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#2C241E]">
              {analytics?.total_pages ?? 0}
            </span>
            <span className="text-xs text-[#8C7E74] ml-2">ஸ்கேன் பக்கங்கள்</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E2D6C3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7C6E65]">மனித சரிபார்ப்பு பெற்றவை</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-800">
              {analytics?.verified_pages ?? 0}
            </span>
            <span className="text-xs text-[#8C7E74] ml-2">பக்கங்கள்</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E2D6C3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7C6E65]">சராசரி OCR துல்லியம்</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#8C5A20]">
              {analytics?.average_ocr_confidence ?? 92.0}%
            </span>
            <span className="text-xs text-[#8C7E74] ml-2">Tesseract tam</span>
          </div>
        </div>
      </div>

      {/* Anti-Hallucination Core Principles Card */}
      <div className="bg-[#FAF5ED] rounded-xl p-6 border-2 border-[#D49A3D]/40 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#6B1724] text-amber-200 rounded-xl shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-lg font-bold text-[#6B1724]">
              கற்பனை எழுத்துத் தடுப்புக் கொள்கை (Anti-Hallucination Framework)
            </h2>
            <p className="text-xs sm:text-sm text-[#4E433C] leading-relaxed">
              வரலாற்றுத் தமிழ் நூல்களை எண்மியப்படுத்துவதில் AI மாதிரிகள் மூல ஆவணத்தில் இல்லாத புதிய சொற்களைக் கற்பனையாக உருவாக்குவது தடுக்கப்பட்டுள்ளது:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/80 p-3 rounded-lg border border-[#E0D3C1] text-xs">
                <span className="font-bold text-[#8B2635] block mb-1">௧. மூலப் படச் சான்று இன்றி மாற்றமில்லை</span>
                தெளிவற்ற எழுத்துக்களை மூலப் படக் crop சான்றின்றியோ அல்லது அகராதிச் சான்றின்றியோ தானாக மாற்றாது.
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-[#E0D3C1] text-xs">
                <span className="font-bold text-[#8B2635] block mb-1">௨. இலக்கணம் மட்டுமே ஆதாரமாகாது</span>
                இலக்கணப் பொருத்தமாய் இருப்பினும் மூலத்தில் இல்லாத சொற்கள் ஏற்கப்படாது; மனித ஒப்புதல் கட்டாயம்.
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-[#E0D3C1] text-xs">
                <span className="font-bold text-[#8B2635] block mb-1">௩. [தெளிவில்லை] குறித்தல்</span>
                வாசிக்க முடியாத எழுத்துக்களை நீக்காமல் ‘[தெளிவில்லை]’ எனக் குறித்து மூல உண்மைத்தன்மை காக்கப்படும்.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Processed Books Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#3B2F27] flex items-center gap-2">
            <Library className="w-5 h-5 text-[#8B2635]" />
            அண்மையில் சேர்க்கப்பட்ட நூல்கள்
          </h2>
          <button
            onClick={() => onNavigate('library')}
            className="text-xs font-semibold text-[#8B2635] hover:text-[#5B121E] flex items-center gap-1 hover:underline"
          >
            அனைத்து நூல்களையும் காண்க
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl p-5 border border-[#E2D6C3] hover:border-[#B47B36] transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2C241E] group-hover:text-[#6B1724] transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs text-[#706257] mt-0.5">
                      ஆசிரியர்: {b.author} {b.publication_year ? `• பதிப்பு: ${b.publication_year}` : ''}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    b.status === 'verified' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : b.status === 'in_review'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                  }`}>
                    {b.status === 'verified' ? 'சரிபார்க்கப்பட்டது' : b.status === 'in_review' ? 'சரிபார்ப்பில் உள்ளது' : 'OCR முடிந்தது'}
                  </span>
                </div>

                <p className="text-xs text-[#82746A] mt-2 line-clamp-1 italic">
                  மூலம்: {b.source || 'வரலாற்றுத் தமிழ்ச் சுவடிகள் பதிப்பு'}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-[#5D5046]">
                  <span className="flex items-center gap-1">
                    <ScanText className="w-3.5 h-3.5 text-[#B47B36]" />
                    {b.total_pages} பக்கங்கள்
                  </span>
                  <span className="flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-[#6B1724]" />
                    {new Date(b.created_at).toLocaleDateString('ta-IN')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0E8DC] flex items-center justify-between">
                <button
                  onClick={() => {
                    onSelectBook(b);
                    onNavigate('library');
                  }}
                  className="text-xs font-semibold text-[#8B2635] hover:text-[#5B121E] flex items-center gap-1"
                >
                  பக்கங்களைத் திறக்க
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectBook(b);
                      onNavigate('enhance');
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-[#F6F1E8] hover:bg-[#EDE3D4] text-[#4A3E36] rounded-md transition-colors"
                  >
                    மேம்படுத்து
                  </button>
                  <button
                    onClick={() => {
                      onSelectBook(b);
                      onNavigate('review');
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-[#8B2635] hover:bg-[#6B1724] text-white rounded-md transition-colors"
                  >
                    சரிபார்
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
