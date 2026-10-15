/**
 * Tamil Heritage AI - REST API Client Service
 */

import { Book, Page, AnalyticsData, DictionaryEntry, OcrDiagnostics } from '../types.ts';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; ocr: OcrDiagnostics }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchOcrDiagnostics(): Promise<OcrDiagnostics> {
  const res = await fetch(`${API_BASE}/ocr/diagnostics`);
  return res.json();
}

export async function fetchBooks(query = '', status = 'all'): Promise<{ success: boolean; books: Book[] }> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (status && status !== 'all') params.append('status', status);
  const res = await fetch(`${API_BASE}/books?${params.toString()}`);
  return res.json();
}

export async function fetchBook(id: string): Promise<{ success: boolean; book: Book }> {
  const res = await fetch(`${API_BASE}/books/${id}`);
  return res.json();
}

export async function updateBook(id: string, data: Partial<Book>): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteBook(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function uploadBookFile(formData: FormData): Promise<{ success: boolean; book_id: string; message: string }> {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function uploadCameraScan(imageBase64: string, bookId?: string, pageNum?: number): Promise<any> {
  const res = await fetch(`${API_BASE}/camera-capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      book_id: bookId,
      page_number: pageNum
    })
  });
  return res.json();
}

export async function fetchPage(pageId: string): Promise<{ success: boolean; page: Page }> {
  const res = await fetch(`${API_BASE}/pages/${pageId}`);
  return res.json();
}

export async function enhancePage(pageId: string, options: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });
  return res.json();
}

export async function runOcrOnPage(pageId: string, useEnhanced = false): Promise<any> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ use_enhanced: useEnhanced })
  });
  return res.json();
}

export async function savePageTranscription(
  pageId: string,
  reviewedText: string,
  reviewerNote: string,
  isVerified: boolean,
  verifiedBy: string,
  wordsData?: any
): Promise<any> {
  const res = await fetch(`${API_BASE}/pages/${pageId}/transcription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewed_text: reviewedText,
      reviewer_note: reviewerNote,
      is_verified: isVerified,
      verified_by: verifiedBy,
      words_data: wordsData
    })
  });
  return res.json();
}

export async function updateCandidateDecision(
  candidateId: string,
  decision: 'accepted' | 'rejected' | 'unresolved' | 'pending',
  reviewerNote: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/candidates/${candidateId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reviewer_note: reviewerNote })
  });
  return res.json();
}

export async function searchArchive(term: string, searchType = 'all'): Promise<any> {
  const res = await fetch(`${API_BASE}/search?term=${encodeURIComponent(term)}&search_type=${searchType}`);
  return res.json();
}

export async function fetchAnalytics(): Promise<{ success: boolean; analytics: AnalyticsData }> {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
}

export async function fetchDictionary(search = ''): Promise<{ success: boolean; entries: DictionaryEntry[] }> {
  const res = await fetch(`${API_BASE}/dictionary?search=${encodeURIComponent(search)}`);
  return res.json();
}

export async function addDictionaryEntry(entry: Partial<DictionaryEntry>): Promise<any> {
  const res = await fetch(`${API_BASE}/dictionary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  return res.json();
}
