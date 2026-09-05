import {
  ImageMeta,
  GridCell,
  Grid,
  Timeslot,
  Subject,
  Staff,
  Assignment,
  TimetableEntry,
  ValidationResult,
  ValidationIssue,
  ConfidenceLevel,
} from '@smart-timetable/shared-types';

export {
  ImageMeta,
  GridCell,
  Grid,
  Timeslot,
  Subject,
  Staff,
  Assignment,
  TimetableEntry,
  ValidationResult,
  ValidationIssue,
  ConfidenceLevel,
};

export interface GridLine {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // Y coordinate for horizontal, X coordinate for vertical
  isHeader?: boolean;
}

export interface InteractiveGrid {
  rows: number;
  cols: number;
  horizontalLines: number[];
  verticalLines: number[];
  headerRowIndex: number;
  dayColumnIndex: number;
  cells: GridCell[];
  selectedCell?: { row: number; col: number };
}

export interface AppStep {
  id: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
}

export const APP_STEPS: AppStep[] = [
  { id: 1, title: 'Upload Image', shortTitle: 'Upload', description: 'Upload timetable image file', icon: 'pi pi-upload' },
  { id: 2, title: 'Preprocessing', shortTitle: 'Preprocessing', description: 'Grayscale & contrast enhancement', icon: 'pi pi-sliders-h' },
  { id: 3, title: 'Grid Editor', shortTitle: 'Grid', description: 'Detect & edit timetable grid', icon: 'pi pi-table' },
  { id: 4, title: 'Timeslots', shortTitle: 'Timeslots', description: 'Configure period schedules', icon: 'pi pi-clock' },
  { id: 5, title: 'Days & Periods', shortTitle: 'Schedule', description: 'Set days and period headers', icon: 'pi pi-calendar' },
  { id: 6, title: 'Subject Extraction', shortTitle: 'Subjects', description: 'OCR cell extraction & master', icon: 'pi pi-book' },
  { id: 7, title: 'Staff Extraction', shortTitle: 'Staff', description: 'Teacher legend & master', icon: 'pi pi-users' },
  { id: 8, title: 'Subject → Staff', shortTitle: 'Assignment', description: 'Assign teachers to subjects', icon: 'pi pi-user-plus' },
  { id: 9, title: 'Validation', shortTitle: 'Validation', description: 'Quality checks & free periods', icon: 'pi pi-shield' },
  { id: 10, title: 'Excel Export', shortTitle: 'Export', description: 'Preview & download XLSX', icon: 'pi pi-file-excel' },
];
