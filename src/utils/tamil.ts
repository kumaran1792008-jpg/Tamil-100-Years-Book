/**
 * Tamil Heritage AI - Classical Tamil Linguistic & Unicode Utilities
 */

// Tamil Grantha & Classical Numerals mapping
export const TAMIL_NUMERALS: Record<string, number> = {
  '௧': 1,
  '௨': 2,
  '௩': 3,
  '௪': 4,
  '௫': 5,
  '௬': 6,
  '௭': 7,
  '௮': 8,
  '௯': 9,
  '௰': 10,
  '௱': 100,
  '௲': 1000
};

/**
 * Splits a Tamil string into authentic grapheme clusters
 * Handles base consonants, dependent vowel signs, and virama (pulli).
 */
export function splitTamilGraphemes(text: string): string[] {
  if (!text) return [];
  // Intl.Segmenter is standard in modern JS / Node 22
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ta', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), s => s.segment);
  }

  // Fallback regex for Tamil syllable clusters
  const matches = text.match(/[\u0B80-\u0BFF][\u0BBE-\u0BCD\u0BD7]*|[^\u0B80-\u0BFF]/g);
  return matches || Array.from(text);
}

/**
 * Converts Tamil archaic numerals to standard Arabic integers
 */
export function parseTamilNumerals(tamilNumStr: string): number | null {
  const clean = tamilNumStr.trim();
  if (clean in TAMIL_NUMERALS) {
    return TAMIL_NUMERALS[clean];
  }
  let sum = 0;
  for (const char of clean) {
    if (char in TAMIL_NUMERALS) {
      sum += TAMIL_NUMERALS[char];
    }
  }
  return sum > 0 ? sum : null;
}

/**
 * Historical spelling / archaic variant pairs
 */
export const ARCHAIC_PAIRS: Array<{ archaic: string; modern: string; note: string }> = [
  { archaic: 'தொழாஅர்', modern: 'தொழார்', note: 'செய்யுளிசை அளபெடை' },
  { archaic: 'தூஉம்', modern: 'தூவும்', note: 'இன்னிசை அளபெடை' },
  { archaic: 'அமிர்து', modern: 'அமிழ்தம்', note: 'பண்டைப் பயன்பாடு' },
  { archaic: 'ஒல்கா', modern: 'ஒல்காத', note: 'ஈறுகெட்ட எதிர்மறை' },
  { archaic: 'யாணர்', modern: 'புதுமை / செழிப்பு', note: 'சங்கச் சொல்' },
  { archaic: 'துப்பு', modern: 'உணவு / வலிமை', note: 'பழந்தமிழ்ச் சொல்' }
];

export function findArchaicSuggestions(word: string) {
  const clean = word.replace(/[.,:;()—"']/g, '').trim();
  return ARCHAIC_PAIRS.filter(p => p.archaic === clean || p.modern === clean);
}
