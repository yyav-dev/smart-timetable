// Shared types for the whole pipeline. No DB — this is the in-memory
// contract passed between frontend state and stateless API calls.

export interface ImageMeta {
  fileName: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

export interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Grid {
  rows: number;
  cols: number;
  cells: GridCell[];
  headerRowIndex: number;
  dayColumnIndex: number;
  source: 'auto' | 'manual';
}

export interface Timeslot {
  period: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface SubjectCandidate {
  rawText: string;
  subject: string;
  confidence: number; // 0..1
  source: 'OCR' | 'manual';
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
}

export interface Staff {
  id: string;
  name: string;
  staffId?: string;
  employeeCode?: string;
  department?: string;
}

export interface Assignment {
  subjectId: string;
  staffId: string;
  staffIds?: string[];
}

export interface TimetableEntry {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  staff?: string;
  staffId?: string;
  staffIds?: string[];
  rawOCRText?: string;
  confidence: number;
  verified: boolean;
  isFreePeriod?: boolean;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
}

export interface ValidationIssue {
  type:
    | 'missing-day'
    | 'missing-period'
    | 'missing-subject'
    | 'unknown-subject'
    | 'missing-staff'
    | 'unknown-staff'
    | 'invalid-timeslot'
    | 'low-confidence'
    | 'unverified'
    | 'duplicate';
  severity: 'error' | 'warning';
  message: string;
  day?: string;
  period?: number;
}

export interface ValidationResult {
  totalCells: number;
  validCount: number;
  needsReviewCount: number;
  errorCount: number;
  issues: ValidationIssue[];
  canExport: boolean;
}

// The single client-side state object driving the whole wizard.
export interface TimetableProcessingState {
  image?: ImageMeta;
  originalImagePreviewUrl?: string;
  processedImagePreviewUrl?: string;
  grid?: Grid;
  days: string[];
  periods: number[];
  timeslots: Timeslot[];
  subjects: Subject[];
  staff: Staff[];
  assignments: Assignment[];
  timetableEntries: TimetableEntry[];
  validation?: ValidationResult;
  filename: string;
}

export function createEmptyState(): TimetableProcessingState {
  return {
    days: [],
    periods: [],
    timeslots: [],
    subjects: [],
    staff: [],
    assignments: [],
    timetableEntries: [],
    filename: 'Timetable',
  };
}
