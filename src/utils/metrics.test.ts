/**
 * Unit Tests for Tamil Heritage AI Pure Logic
 * Runs via: node --test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCER, calculateWER, classifyConfidence, validateAntiHallucination, editDistance } from './metrics.ts';
import { splitTamilGraphemes, parseTamilNumerals, findArchaicSuggestions } from './tamil.ts';

test('Levenshtein edit distance calculates correctly', () => {
  assert.equal(editDistance(['a', 'b', 'c'], ['a', 'b', 'c']), 0);
  assert.equal(editDistance(['a', 'b'], ['a', 'b', 'c']), 1);
  assert.equal(editDistance(['x', 'y'], ['a', 'b']), 2);
});

test('Tamil grapheme cluster splitting preserves compound vowels & pulli', () => {
  const graphemes = splitTamilGraphemes('தமிழ்');
  // த (1), மி (2), ழ் (3)
  assert.equal(graphemes.length, 3);
  assert.equal(graphemes[0], 'த');
  assert.equal(graphemes[1], 'மி');
  assert.equal(graphemes[2], 'ழ்');
});

test('calculateCER calculates Character Error Rate accurately', () => {
  // Identical text -> 0% error
  assert.equal(calculateCER('அகர முதல', 'அகர முதல'), 0);

  // 1 substitution in 4 graphemes: 'அகர' (3) vs 'அகம' (1 sub out of 3 = 33.3%)
  const cer = calculateCER('அகர', 'அகம');
  assert.ok(cer > 30 && cer < 35);

  // Empty hypothesis
  assert.equal(calculateCER('தமிழ்', ''), 100);
});

test('calculateWER calculates Word Error Rate accurately', () => {
  const ref = 'அகர முதல எழுத்தெல்லாம் ஆதி';
  const hypExact = 'அகர முதல எழுத்தெல்லாம் ஆதி';
  assert.equal(calculateWER(ref, hypExact), 0);

  // 1 word replaced out of 4 words = 25%
  const hypOneOff = 'அகர முதல நூலெல்லாம் ஆதி';
  assert.equal(calculateWER(ref, hypOneOff), 25);
});

test('classifyConfidence assigns proper tier', () => {
  assert.equal(classifyConfidence(95), 'high');
  assert.equal(classifyConfidence(75), 'medium');
  assert.equal(classifyConfidence(55), 'low');
  assert.equal(classifyConfidence(30), 'critical');
});

test('parseTamilNumerals parses archaic numbers correctly', () => {
  assert.equal(parseTamilNumerals('௧'), 1);
  assert.equal(parseTamilNumerals('௨'), 2);
  assert.equal(parseTamilNumerals('௰'), 10);
});

test('findArchaicSuggestions identifies historical variants', () => {
  const suggestions = findArchaicSuggestions('தொழாஅர்');
  assert.ok(suggestions.length > 0);
  assert.equal(suggestions[0].archaic, 'தொழாஅர்');
  assert.equal(suggestions[0].modern, 'தொழார்');
});

test('validateAntiHallucination blocks unevidenced substitutions', () => {
  // Disallow automatic replacement without evidence
  const res1 = validateAntiHallucination('அகர', 'ஆதி', '', false);
  assert.equal(res1.allowed, false);

  // Disallow grammar alone as proof
  const res2 = validateAntiHallucination(
    'அகர',
    'ஆதி',
    'இலக்கணப்படி சரியானது என்பதால் மாற்றப்பட்டது',
    false
  );
  assert.equal(res2.allowed, false);

  // Allow when image evidence or human verification is provided
  const res3 = validateAntiHallucination(
    'அகர',
    'அகரம்',
    'மூலப் படம் மற்றும் சுவடி ஒப்புநோக்கப்பட்டு மகர மெய் தெளிவுபடுத்தப்பட்டது',
    false
  );
  assert.equal(res3.allowed, true);

  // Always allow when human verified explicitly
  const res4 = validateAntiHallucination('அகர', 'அகரம்', '', true);
  assert.equal(res4.allowed, true);
});
