import React, { useState, useEffect } from 'react';
import { 
  History, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Edit3, 
  FileCheck,
  Search,
  Clock
} from 'lucide-react';
import { Book, AuditEntry } from '../types.ts';
import { fetchPage } from '../services/api.ts';

interface AuditHistoryViewProps {
  books: Book[];
  onNavigateToPage: (bookId: string, pageId: string) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  books,
  onNavigateToPage
}) => {
  const [auditList, setAuditList] = useState<Array<AuditEntry & { bookTitle: string; pageNumber: number; bookId: string }>>([]);
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAllAudits();
  }, [books]);

  const loadAllAudits = async () => {
    setIsLoading(true);
    const accumulated: Array<AuditEntry & { bookTitle: string; pageNumber: number; bookId: string }> = [];

    for (const b of books) {
      if (b.pages) {
        for (const p of b.pages) {
          try {
            const res = await fetchPage(p.id);
            if (res.success && res.page?.audit_history) {
              res.page.audit_history.forEach(a => {
                accumulated.push({
                  ...a,
                  bookTitle: b.title,
                  pageNumber: p.page_number,
                  bookId: b.id
                });
              });
            }
          } catch (e) {
            // continue
          }
        }
      }
    }

    // Sort by timestamp desc
    accumulated.sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
    setAuditList(accumulated);
    setIsLoading(false);
  };

  const filtered = auditList.filter(entry => {
    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    const matchesSearch = 
      entry.previous_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.updated_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.reviewer_note && entry.reviewer_note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.bookTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'candidate_accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            பரிந்துரை ஏற்கப்பட்டது
          </span>
        );
      case 'candidate_rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-200 text-stone-800">
            <XCircle className="w-3 h-3 text-stone-600" />
            பரிந்துரை நிராகரிப்பு
          </span>
        );
      case 'candidate_unresolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
            <HelpCircle className="w-3 h-3 text-rose-600" />
            [தெளிவில்லை] குறிக்கப்பட்டது
          </span>
        );
      case 'page_verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            <FileCheck className="w-3 h-3 text-blue-600" />
            பக்கம் மனித சரிபார்ப்பு
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <Edit3 className="w-3 h-3 text-amber-700" />
            உரை மாற்றம்
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D6C3] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#6B1724] flex items-center gap-2">
            <History className="w-6 h-6 text-[#8B2635]" />
            திருத்த வரலாறு & ஆவண உண்மைத்தன்மைப் பதிவு
          </h1>
          <p className="text-xs text-[#706257]">
            ஒவ்வொரு சொல் மற்றும் பக்க சரிபார்ப்பின் முழுமையான காலம், திருத்தம் மற்றும் காரணக் குறிப்புகள்
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8C7E74]" />
            <input
              type="text"
              placeholder="சொல் அல்லது குறிப்பைத் தேடுக..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D5C9B3] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#8B2635] w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#D5C9B3] rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-[#8C7E74]" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs text-[#4A3E36] bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="all">அனைத்து செயல்களும்</option>
              <option value="candidate_accepted">ஏற்கப்பட்ட பரிந்துரைகள்</option>
              <option value="candidate_rejected">நிராகரிக்கப்பட்டவை</option>
              <option value="candidate_unresolved">[தெளிவில்லை] குறிப்புகள்</option>
              <option value="page_verified">மனித சரிபார்ப்புகள்</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#E2D6C3] shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#8C7E74]">
            வரலாற்றுப் பதிவுகள் ஏற்றப்படுகின்றன...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8C7E74]">
            திருத்தப் பதிவுகள் எதுவும் காணப்படவில்லை.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#4A3E36] border-b border-[#E2D6C3] font-semibold">
                <tr>
                  <th className="px-4 py-3">நூல் & பக்கம்</th>
                  <th className="px-4 py-3">செயல் வகை</th>
                  <th className="px-4 py-3">முந்தைய உரை</th>
                  <th className="px-4 py-3">புதிய உரை</th>
                  <th className="px-4 py-3">சரிபார்ப்புக் குறிப்பு</th>
                  <th className="px-4 py-3">நேரம்</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E8DC]">
                {filtered.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => onNavigateToPage(item.bookId, item.page_id)}
                        className="font-bold text-[#6B1724] hover:underline text-left block"
                      >
                        {item.bookTitle}
                      </button>
                      <span className="text-[11px] text-[#7C6E65]">பக்கம் {item.pageNumber}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {getActionBadge(item.action)}
                    </td>
                    <td className="px-4 py-3.5 font-serif text-[#786B62] max-w-[150px] truncate">
                      {item.previous_text || '—'}
                    </td>
                    <td className="px-4 py-3.5 font-serif font-bold text-[#2C241E] max-w-[150px] truncate">
                      {item.updated_text}
                    </td>
                    <td className="px-4 py-3.5 text-[#5D5046] italic max-w-[200px]">
                      {item.reviewer_note || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[#7C6E65] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#B47B36]" />
                        {new Date(item.timestamp).toLocaleString('ta-IN')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
