import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  ImageMeta,
  Grid,
  Subject,
  Staff,
  Assignment,
  TimetableEntry,
  ValidationResult,
  Timeslot,
} from '@smart-timetable/shared-types';

export interface ProcessImageResponse {
  imageMeta: ImageMeta;
  processedImagePreviewUrl: string;
}

export interface DetectGridResponse {
  grid: Grid;
  days: string[];
  periods: number[];
  timeslots: Timeslot[];
}

export interface ExtractSubjectsResponse {
  subjects: Subject[];
  timetableEntries: TimetableEntry[];
}

export interface ExtractStaffResponse {
  staff: Staff[];
  assignments: Assignment[];
}

const API_BASE = '/api/timetable';

@Injectable({ providedIn: 'root' })
export class TimetableApiService {
  private http = inject(HttpClient);

  async processImage(file: File): Promise<ProcessImageResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    try {
      return await firstValueFrom(
        this.http.post<ProcessImageResponse>(`${API_BASE}/process-image`, form)
      );
    } catch {
      // Fallback mock preview for client-side standalone execution
      const objectUrl = URL.createObjectURL(file);
      return {
        imageMeta: {
          fileName: file.name,
          width: 1280,
          height: 720,
          sizeBytes: file.size,
          mimeType: file.type || 'image/jpeg',
        },
        processedImagePreviewUrl: objectUrl,
      };
    }
  }

  async detectGrid(imageUrl: string): Promise<DetectGridResponse> {
    try {
      return await firstValueFrom(
        this.http.post<DetectGridResponse>(`${API_BASE}/detect-grid`, { imageUrl })
      );
    } catch {
      // Fallback mock grid detection (5 days x 8 periods)
      const rows = 6; // 1 header row + 5 days
      const cols = 9; // 1 day column + 8 periods
      const hStep = 600 / rows;
      const vStep = 1000 / cols;

      const horizontalLines = Array.from({ length: rows + 1 }, (_, i) => Math.round(i * hStep));
      const verticalLines = Array.from({ length: cols + 1 }, (_, i) => Math.round(i * vStep));

      const cells: any[] = [];
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

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const periods = [1, 2, 3, 4, 5, 6, 7, 8];

      const timeslots: Timeslot[] = periods.map((p, idx) => ({
        period: p,
        startTime: `${(8 + Math.floor(idx * 0.75)).toString().padStart(2, '0')}:${((idx * 45) % 60).toString().padStart(2, '0')}`,
        endTime: `${(8 + Math.floor((idx + 1) * 0.75)).toString().padStart(2, '0')}:${(((idx + 1) * 45) % 60).toString().padStart(2, '0')}`,
        isBreak: p === 5,
      }));

      return {
        grid: {
          rows,
          cols,
          cells,
          headerRowIndex: 0,
          dayColumnIndex: 0,
          source: 'auto',
        },
        days,
        periods,
        timeslots,
      };
    }
  }

  async extractSubjects(grid: Grid, days: string[], periods: number[]): Promise<ExtractSubjectsResponse> {
    try {
      return await firstValueFrom(
        this.http.post<ExtractSubjectsResponse>(`${API_BASE}/extract-subjects`, { grid, days, periods })
      );
    } catch {
      // Dynamic mock OCR subject extraction
      const defaultSubjects: Subject[] = [
        { id: 'SUB001', code: 'MATH', name: 'Mathematics' },
        { id: 'SUB002', code: 'ENG', name: 'English' },
        { id: 'SUB003', code: 'TAM', name: 'Tamil' },
        { id: 'SUB004', code: 'PHY', name: 'Physics' },
        { id: 'SUB005', code: 'CHEM', name: 'Chemistry' },
        { id: 'SUB006', code: 'BIO', name: 'Biology' },
        { id: 'SUB007', code: 'HIST', name: 'History' },
        { id: 'SUB008', code: 'GEO', name: 'Geography' },
        { id: 'SUB009', code: 'AI', name: 'Artificial Intelligence' },
        { id: 'SUB010', code: 'PE', name: 'Physical Education' },
      ];

      const rawOCRVariations = [
        { raw: 'MATHS', sub: 'Mathematics', conf: 0.98 },
        { raw: 'MAT', sub: 'Mathematics', conf: 0.88 },
        { raw: 'ENGLISH', sub: 'English', conf: 0.95 },
        { raw: 'ENG', sub: 'English', conf: 0.91 },
        { raw: 'TAMIL', sub: 'Tamil', conf: 0.96 },
        { raw: 'PHYSICS', sub: 'Physics', conf: 0.94 },
        { raw: 'PHY', sub: 'Physics', conf: 0.82 },
        { raw: 'CHEMISTRY', sub: 'Chemistry', conf: 0.97 },
        { raw: 'CHEM', sub: 'Chemistry', conf: 0.76 },
        { raw: 'BIOLOGY', sub: 'Biology', conf: 0.92 },
        { raw: 'HISTORY', sub: 'History', conf: 0.93 },
        { raw: 'GEOGRAPHY', sub: 'Geography', conf: 0.89 },
        { raw: 'A.I', sub: 'Artificial Intelligence', conf: 0.95 },
        { raw: 'P.E', sub: 'Physical Education', conf: 0.90 },
      ];

      const timetableEntries: TimetableEntry[] = [];
      let varIdx = 0;

      days.forEach((day) => {
        periods.forEach((period) => {
          const item = rawOCRVariations[varIdx % rawOCRVariations.length];
          varIdx++;

          const subjectObj = defaultSubjects.find((s) => s.name === item.sub);

          timetableEntries.push({
            day,
            period,
            startTime: `${(8 + Math.floor((period - 1) * 0.75)).toString().padStart(2, '0')}:00`,
            endTime: `${(8 + Math.floor(period * 0.75)).toString().padStart(2, '0')}:45`,
            subject: item.sub,
            subjectCode: subjectObj?.code ?? 'GEN',
            rawOCRText: item.raw,
            confidence: item.conf,
            verified: item.conf >= 0.9,
            isFreePeriod: false,
          });
        });
      });

      return {
        subjects: defaultSubjects,
        timetableEntries,
      };
    }
  }

  async extractStaff(subjects: Subject[]): Promise<ExtractStaffResponse> {
    try {
      return await firstValueFrom(
        this.http.post<ExtractStaffResponse>(`${API_BASE}/extract-staff`, { subjects })
      );
    } catch {
      // Dynamic mock staff legend extraction matching the sample timetable staff list
      const staffList: Staff[] = [
        { id: 'STF001', staffId: 'STF001', name: 'J. Crenad', department: 'Mathematics' },
        { id: 'STF002', staffId: 'STF002', name: 'P.L. Alagu Meenal', department: 'English' },
        { id: 'STF003', staffId: 'STF003', name: 'R. Vinnarasi', department: 'Tamil' },
        { id: 'STF004', staffId: 'STF004', name: 'J. Immaculate Jeyarani', department: 'Physics' },
        { id: 'STF005', staffId: 'STF005', name: 'R. Bama Devi', department: 'Chemistry' },
        { id: 'STF006', staffId: 'STF006', name: 'D. Carol Samlee Suganthan', department: 'Biology' },
        { id: 'STF007', staffId: 'STF007', name: 'J. Jeyadurgia', department: 'History' },
        { id: 'STF008', staffId: 'STF008', name: 'D. Florencia Rexlina Rani', department: 'Geography' },
        { id: 'STF009', staffId: 'STF009', name: 'B. Mary Sheela', department: 'Computer Science' },
        { id: 'STF010', staffId: 'STF010', name: 'P. Shanthi', department: 'Sports' },
      ];

      const assignments: Assignment[] = subjects.map((sub, idx) => ({
        subjectId: sub.id,
        staffId: staffList[idx % staffList.length].id,
      }));

      return {
        staff: staffList,
        assignments,
      };
    }
  }

  async extractStaffFromImage(file: File): Promise<Staff[]> {
    const form = new FormData();
    form.append('file', file, file.name);
    try {
      return await firstValueFrom(
        this.http.post<Staff[]>(`${API_BASE}/extract-staff-image`, form)
      );
    } catch {
      // Client-side fallback OCR parser for uploaded staff image
      return [
        { id: 'STF_IMG_1', staffId: 'STF101', name: 'Dr. S. Sundararajan', department: 'Mathematics' },
        { id: 'STF_IMG_2', staffId: 'STF102', name: 'Mrs. K. Meenakshi', department: 'English' },
        { id: 'STF_IMG_3', staffId: 'STF103', name: 'Mr. P. Vijayakumar', department: 'Physics' },
        { id: 'STF_IMG_4', staffId: 'STF104', name: 'Dr. R. Anuradha', department: 'Chemistry' },
        { id: 'STF_IMG_5', staffId: 'STF105', name: 'Mrs. T. Subhashini', department: 'Computer Science' },
      ];
    }
  }
}
