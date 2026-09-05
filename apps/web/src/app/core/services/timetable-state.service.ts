import { Injectable, signal, computed } from '@angular/core';
import {
  TimetableProcessingState,
  createEmptyState,
  ImageMeta,
  Grid,
  GridCell,
  Timeslot,
  Subject,
  Staff,
  Assignment,
  TimetableEntry,
  ValidationResult,
  confidenceLevel,
} from '@smart-timetable/shared-types';

@Injectable({ providedIn: 'root' })
export class TimetableStateService {
  private readonly _state = signal<TimetableProcessingState>({
    ...createEmptyState(),
    filename: 'Grade_10_D_Timetable',
  });

  private readonly _currentStep = signal<number>(1);
  private readonly _isProcessing = signal<boolean>(false);
  private readonly _processingStatus = signal<string>('');

  // Readonly signals
  readonly state = this._state.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly processingStatus = this._processingStatus.asReadonly();

  // Computed properties
  readonly hasImage = computed(() => !!this._state().image);
  readonly imageMeta = computed(() => this._state().image);
  readonly originalImagePreviewUrl = computed(() => this._state().originalImagePreviewUrl);
  readonly processedImagePreviewUrl = computed(() => this._state().processedImagePreviewUrl);
  readonly grid = computed(() => this._state().grid);
  readonly days = computed(() => this._state().days);
  readonly periods = computed(() => this._state().periods);
  readonly timeslots = computed(() => this._state().timeslots);
  readonly subjects = computed(() => this._state().subjects);
  readonly staff = computed(() => this._state().staff);
  readonly assignments = computed(() => this._state().assignments);
  readonly timetableEntries = computed(() => this._state().timetableEntries);
  readonly validation = computed(() => this._state().validation);
  readonly filename = computed(() => this._state().filename);

  readonly canNavigateNext = computed(() => {
    const step = this._currentStep();
    if (step === 1) return this.hasImage();
    if (step === 3) return !!this._state().grid;
    return true;
  });

  // Step Navigation
  setStep(step: number) {
    if (step >= 1 && step <= 10) {
      this._currentStep.set(step);
    }
  }

  nextStep() {
    if (this._currentStep() < 10) {
      this._currentStep.update((s) => s + 1);
    }
  }

  prevStep() {
    if (this._currentStep() > 1) {
      this._currentStep.update((s) => s - 1);
    }
  }

  setProcessing(processing: boolean, status: string = '') {
    this._isProcessing.set(processing);
    this._processingStatus.set(status);
  }

  // Image updates
  setImage(image: ImageMeta, processedImagePreviewUrl: string, originalPreviewUrl: string) {
    this._state.update((s) => ({
      ...s,
      image,
      processedImagePreviewUrl,
      originalImagePreviewUrl: originalPreviewUrl,
    }));
  }

  clearImage() {
    this._state.update((s) => ({
      ...s,
      image: undefined,
      processedImagePreviewUrl: undefined,
      originalImagePreviewUrl: undefined,
      grid: undefined,
      timetableEntries: [],
    }));
  }

  // Grid updates
  setGrid(grid: Grid) {
    this._state.update((s) => ({ ...s, grid }));
  }

  updateGridLines(horizontalLines: number[], verticalLines: number[]) {
    const currentGrid = this._state().grid;
    if (!currentGrid) return;

    // Recalculate cells from lines
    const rows = horizontalLines.length - 1;
    const cols = verticalLines.length - 1;
    const cells: GridCell[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          row: r,
          col: c,
          x: verticalLines[c],
          y: horizontalLines[r],
          width: verticalLines[c + 1] - verticalLines[c],
          height: horizontalLines[r + 1] - horizontalLines[r],
        });
      }
    }

    this._state.update((s) => ({
      ...s,
      grid: {
        ...currentGrid,
        rows,
        cols,
        cells,
        source: 'manual',
      },
    }));
  }

  // Days and Periods
  setDaysAndPeriods(days: string[], periods: number[]) {
    this._state.update((s) => {
      // Re-generate default timeslots if needed
      const timeslots: Timeslot[] = periods.map((p, idx) => {
        const existing = s.timeslots.find((t) => t.period === p);
        if (existing) return existing;

        const startHour = 8 + Math.floor((idx * 45) / 60);
        const startMin = (idx * 45) % 60;
        const endHour = 8 + Math.floor(((idx + 1) * 45) / 60);
        const endMin = ((idx + 1) * 45) % 60;

        const fmt = (h: number, m: number) =>
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        return {
          period: p,
          startTime: fmt(startHour, startMin),
          endTime: fmt(endHour, endMin),
          isBreak: p === 5,
        };
      });

      return { ...s, days, periods, timeslots };
    });
  }

  // Timeslots
  setTimeslots(timeslots: Timeslot[]) {
    this._state.update((s) => ({ ...s, timeslots }));
  }

  updateTimeslot(period: number, field: keyof Timeslot, value: any) {
    this._state.update((s) => ({
      ...s,
      timeslots: s.timeslots.map((t) =>
        t.period === period ? { ...t, [field]: value } : t
      ),
    }));
  }

  // Subjects Master
  setSubjects(subjects: Subject[]) {
    this._state.update((s) => ({ ...s, subjects }));
  }

  addSubject(subject: Subject) {
    this._state.update((s) => ({
      ...s,
      subjects: [...s.subjects, subject],
    }));
  }

  updateSubject(id: string, updated: Partial<Subject>) {
    this._state.update((s) => ({
      ...s,
      subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...updated } : sub)),
    }));
  }

  deleteSubject(id: string) {
    this._state.update((s) => ({
      ...s,
      subjects: s.subjects.filter((sub) => sub.id !== id),
      assignments: s.assignments.filter((a) => a.subjectId !== id),
    }));
  }

  // Staff Master
  setStaff(staff: Staff[]) {
    this._state.update((s) => ({ ...s, staff }));
  }

  addStaff(member: Staff) {
    this._state.update((s) => ({
      ...s,
      staff: [...s.staff, member],
    }));
  }

  updateStaff(id: string, updated: Partial<Staff>) {
    this._state.update((s) => ({
      ...s,
      staff: s.staff.map((st) => (st.id === id ? { ...st, ...updated } : st)),
    }));
  }

  deleteStaff(id: string) {
    this._state.update((s) => ({
      ...s,
      staff: s.staff.filter((st) => st.id !== id),
      assignments: s.assignments.filter((a) => a.staffId !== id),
    }));
  }

  // Subject-Staff Assignments
  setAssignments(assignments: Assignment[]) {
    this._state.update((s) => ({ ...s, assignments }));
  }

  assignStaffToSubject(subjectId: string, staffIds: string[] | string) {
    const ids = Array.isArray(staffIds) ? staffIds : (staffIds ? [staffIds] : []);
    this._state.update((s) => {
      const filtered = s.assignments.filter((a) => a.subjectId !== subjectId);
      if (ids.length === 0) return { ...s, assignments: filtered };
      return {
        ...s,
        assignments: [...filtered, { subjectId, staffId: ids[0], staffIds: ids }],
      };
    });
  }

  // Timetable Entries & Verification
  setTimetableEntries(entries: TimetableEntry[]) {
    this._state.update((s) => ({ ...s, timetableEntries: entries }));
    this.runValidation();
  }

  updateCellEntry(day: string, period: number, update: Partial<TimetableEntry>) {
    this._state.update((s) => ({
      ...s,
      timetableEntries: s.timetableEntries.map((e) =>
        e.day === day && e.period === period ? { ...e, ...update } : e
      ),
    }));
    this.runValidation();
  }

  toggleCellFreePeriod(day: string, period: number) {
    this._state.update((s) => ({
      ...s,
      timetableEntries: s.timetableEntries.map((e) => {
        if (e.day === day && e.period === period) {
          const isFree = !e.isFreePeriod;
          return {
            ...e,
            isFreePeriod: isFree,
            subject: isFree ? 'Free Period' : e.subject,
            verified: true,
          };
        }
        return e;
      }),
    }));
    this.runValidation();
  }

  // Validation Runner
  runValidation() {
    const s = this._state();
    const entries = s.timetableEntries;
    const subjects = s.subjects;
    const staff = s.staff;

    const issues: any[] = [];
    let validCount = 0;
    let needsReviewCount = 0;
    let errorCount = 0;

    entries.forEach((e) => {
      if (e.isFreePeriod) {
        validCount++;
        return;
      }

      let hasError = false;
      let hasWarning = false;

      // Check subject
      if (!e.subject || e.subject === 'Unknown') {
        issues.push({
          type: 'missing-subject',
          severity: 'error',
          message: `Cell (${e.day}, Period ${e.period}) is missing a subject.`,
          day: e.day,
          period: e.period,
        });
        hasError = true;
      }

      // Check low confidence
      if (e.confidence < 0.7 && !e.verified) {
        issues.push({
          type: 'low-confidence',
          severity: 'warning',
          message: `Cell (${e.day}, Period ${e.period}) has low OCR confidence (${Math.round(e.confidence * 100)}%). Verification required.`,
          day: e.day,
          period: e.period,
        });
        hasWarning = true;
      }

      // Check staff assignment
      if (!e.staff) {
        issues.push({
          type: 'missing-staff',
          severity: 'warning',
          message: `Cell (${e.day}, Period ${e.period}) for subject "${e.subject}" has no assigned staff member.`,
          day: e.day,
          period: e.period,
        });
        hasWarning = true;
      }

      if (hasError) {
        errorCount++;
      } else if (hasWarning || !e.verified) {
        needsReviewCount++;
      } else {
        validCount++;
      }
    });

    const validation: ValidationResult = {
      totalCells: entries.length,
      validCount,
      needsReviewCount,
      errorCount,
      issues,
      canExport: errorCount === 0,
    };

    this._state.update((state) => ({ ...state, validation }));
  }

  setFilename(filename: string) {
    this._state.update((s) => ({ ...s, filename }));
  }

  reset() {
    this._state.set({
      ...createEmptyState(),
      filename: 'Grade_10_D_Timetable',
    });
    this._currentStep.set(1);
  }
}
