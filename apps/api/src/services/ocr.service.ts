import {
  Grid,
  Subject,
  Staff,
  TimetableEntry,
  ConfidenceLevel,
  confidenceLevel,
} from '@smart-timetable/shared-types';

export interface OCRExtractionResult {
  rawText: string;
  normalizedSubject: string;
  confidence: number;
  confidenceRating: ConfidenceLevel;
}

/**
 * Calculates string similarity using Levenshtein distance
 * to map raw OCR text (e.g. "MATHS", "MAT") to normalized subject names ("Mathematics").
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // insertion
        track[j - 1][i] + 1, // deletion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLen = Math.max(str1.length, str2.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Core OCR cell text normalizer.
 * Takes raw OCR output text and matches it against the Subject Master list.
 */
export function normalizeOCRSubject(rawOCRText: string, masterSubjects: Subject[]): OCRExtractionResult {
  let bestMatch: Subject | null = null;
  let highestSimilarity = 0;

  for (const subject of masterSubjects) {
    const sim = calculateStringSimilarity(rawOCRText, subject.name);
    if (sim > highestSimilarity) {
      highestSimilarity = sim;
      bestMatch = subject;
    }
    if (subject.code) {
      const codeSim = calculateStringSimilarity(rawOCRText, subject.code);
      if (codeSim > highestSimilarity) {
        highestSimilarity = codeSim;
        bestMatch = subject;
      }
    }
  }

  const normalizedSubject = bestMatch ? bestMatch.name : rawOCRText;
  const confidence = Math.round(highestSimilarity * 100) / 100;
  const confidenceRating = confidenceLevel(confidence);

  return {
    rawText: rawOCRText,
    normalizedSubject,
    confidence,
    confidenceRating,
  };
}
