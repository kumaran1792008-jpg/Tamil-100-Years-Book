/**
 * Tamil Heritage AI - Evaluation Metrics & Anti-Hallucination Safeguards
 * Implements Character Error Rate (CER), Word Error Rate (WER),
 * Confidence Classification, and Anti-Hallucination Evidence Validation.
 */

import { splitTamilGraphemes } from './tamil.ts';

/**
 * Standard Levenshtein edit distance between two arrays of tokens/graphemes
 */
export function editDistance<T>(seq1: T[], seq2: T[]): number {
  const m = seq1.length;
  const n = seq2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculates Character Error Rate (CER) based on Tamil grapheme clusters
 * CER = (Substitutions + Deletions + Insertions) / Reference_Length * 100%
 */
export function calculateCER(reference: string, hypothesis: string): number {
  const refGraphemes = splitTamilGraphemes(reference.trim());
  const hypGraphemes = splitTamilGraphemes(hypothesis.trim());

  if (refGraphemes.length === 0) {
    return hypGraphemes.length === 0 ? 0 : 100;
  }

  const distance = editDistance(refGraphemes, hypGraphemes);
  const cer = (distance / refGraphemes.length) * 100;
  return Math.min(100, Math.round(cer * 10) / 10);
}

/**
 * Calculates Word Error Rate (WER)
 * WER = (Substitutions + Deletions + Insertions) / Reference_Word_Count * 100%
 */
export function calculateWER(reference: string, hypothesis: string): number {
  const refWords = reference.trim().split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean);

  if (refWords.length === 0) {
    return hypWords.length === 0 ? 0 : 100;
  }

  const distance = editDistance(refWords, hypWords);
  const wer = (distance / refWords.length) * 100;
  return Math.min(100, Math.round(wer * 10) / 10);
}

/**
 * Classifies OCR engine confidence into UI status
 */
export function classifyConfidence(conf: number): 'high' | 'medium' | 'low' | 'critical' {
  if (conf >= 85) return 'high';
  if (conf >= 70) return 'medium';
  if (conf >= 50) return 'low';
  return 'critical';
}

/**
 * Validates whether a proposed correction adheres to Anti-Hallucination rules
 */
export interface ValidationResult {
  allowed: boolean;
  requiresReview: boolean;
  warnings: string[];
}

export function validateAntiHallucination(
  originalText: string,
  proposedText: string,
  evidenceNote: string,
  isHumanVerified: boolean
): ValidationResult {
  const warnings: string[] = [];

  // Rule 1: Never silently delete unreadable markers
  if (originalText.includes('[தெளிவில்லை]') && !proposedText.includes('[தெளிவில்லை]') && !isHumanVerified) {
    warnings.push('தெளிவற்ற பகுதி மனித சரிபார்ப்பாளர் ஒப்புதலின்றி மாற்றப்படக் கூடாது.');
    return { allowed: false, requiresReview: true, warnings };
  }

  // Rule 2: Cannot replace without any evidence or explanation
  if (originalText !== proposedText && !evidenceNote.trim() && !isHumanVerified) {
    warnings.push('திருத்தத்திற்குரிய மூலச்சான்று அல்லது காரணக் குறிப்பு அவசியமாகும்.');
    return { allowed: false, requiresReview: true, warnings };
  }

  // Rule 3: Grammatical speculation alone is insufficient proof of source presence
  if (
    evidenceNote.toLowerCase().includes('இலக்கணப்படி சரியானது') &&
    !evidenceNote.includes('மூலப் படம்') &&
    !evidenceNote.includes('சுவடி') &&
    !isHumanVerified
  ) {
    warnings.push('இலக்கணப் பொருத்தம் மட்டுமே மூல ஆவணத்தில் அச்செழுத்து இருந்ததற்கான சான்றாகாது.');
    return { allowed: false, requiresReview: true, warnings };
  }

  return {
    allowed: true,
    requiresReview: !isHumanVerified,
    warnings
  };
}

/**
 * Ensures exported text retains [தெளிவில்லை] markers and never drops unresolved letters
 */
export function sanitizeForExport(text: string): string {
  if (!text) return '';
  // Ensure [தெளிவில்லை] markers remain intact and clean up trailing artifacts
  return text.trim();
}
