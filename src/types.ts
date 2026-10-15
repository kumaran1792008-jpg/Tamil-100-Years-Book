/**
 * Tamil Heritage AI - TypeScript Data Models & Types
 */

export interface Book {
  id: string;
  title: string;
  author: string;
  publication_year: number | null;
  source: string;
  original_file_path: string;
  total_pages: number;
  processed_pages: number;
  status: 'pending' | 'in_review' | 'ocr_completed' | 'verified';
  created_at: string;
  pages?: Page[];
}

export interface Page {
  id: string;
  book_id: string;
  page_number: number;
  original_image_path: string;
  enhanced_image_path?: string | null;
  processing_status: 'unprocessed' | 'enhanced' | 'ocr_completed' | 'reviewed' | 'verified';
  created_at: string;
  transcription?: Transcription | null;
  candidates?: CorrectionCandidate[];
  audit_history?: AuditEntry[];
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoundingBoxPct {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface OcrWord {
  index: number;
  text: string;
  confidence: number;
  is_low_confidence: boolean;
  line_num: number;
  block_num: number;
  bbox: BoundingBox;
  bbox_pct: BoundingBoxPct;
}

export interface Transcription {
  id: string;
  page_id: string;
  original_ocr_text: string;
  reviewed_text: string;
  ocr_engine: string;
  ocr_confidence: number;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  words_data?: string | OcrWord[];
  updated_at: string;
}

export interface CorrectionCandidate {
  id: string;
  page_id: string;
  word_index?: number;
  char_index?: number;
  bbox?: string;
  original_text: string;
  proposed_text: string;
  evidence: string;
  confidence: number;
  decision: 'pending' | 'accepted' | 'rejected' | 'unresolved';
  reviewer_note?: string;
  image_supported?: number;
  dictionary_supported?: number;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  page_id: string;
  previous_text: string;
  updated_text: string;
  action: string;
  reviewer_note?: string;
  timestamp: string;
}

export interface DictionaryEntry {
  id: string;
  word: string;
  meaning: string;
  alternate_spellings?: string;
  source_reference?: string;
  period?: string;
}

export interface AnalyticsData {
  total_books: number;
  total_pages: number;
  processed_pages: number;
  verified_pages: number;
  awaiting_review: number;
  accepted_corrections: number;
  rejected_corrections: number;
  unresolved_corrections: number;
  average_ocr_confidence: number;
  confidence_distribution: {
    high_90_100: number;
    medium_75_89: number;
    low_50_74: number;
    critical_under_50: number;
  };
}

export interface OcrDiagnostics {
  available: boolean;
  engine: string;
  version: string | null;
  installed_languages: string[];
  tamil_supported: boolean;
  missing_dependency: string | null;
}
