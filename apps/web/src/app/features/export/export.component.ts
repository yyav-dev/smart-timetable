import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { TimetableApiService } from '../../core/services/timetable-api.service';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <i class="pi pi-file-excel"></i> Step 10: Multi-Sheet Excel Export
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Excel Workbook Preview & Download
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Preview the structured 7-sheet workbook data before generating and downloading your final XLSX file.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button 
            (click)="stateService.prevStep()" 
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 flex items-center gap-2 transition-all"
          >
            <i class="pi pi-arrow-left"></i> Back
          </button>

          <button 
            (click)="downloadExcel()" 
            [disabled]="isExporting()"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <i *ngIf="!isExporting()" class="pi pi-download text-base"></i>
            <i *ngIf="isExporting()" class="pi pi-spin pi-spinner text-base"></i>
            <span>{{ isExporting() ? 'Generating XLSX...' : 'Download Excel (.xlsx)' }}</span>
          </button>
        </div>
      </div>

      <!-- Excel Configuration & Filename Card -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <i class="pi pi-cog text-brand-400"></i> Workbook Naming & Title Headers
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-400">Excel Filename</label>
            <div class="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white">
              <input 
                type="text" 
                [ngModel]="stateService.filename()" 
                (ngModelChange)="stateService.setFilename($event)"
                class="bg-transparent flex-1 outline-none font-medium text-white" 
              />
              <span class="text-slate-500 font-mono text-xs ml-1">.xlsx</span>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-400">Class / Grade Title</label>
            <input 
              type="text" 
              [(ngModel)]="gradeTitle" 
              placeholder="e.g. Grade 10 - Section D"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500" 
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-400">Academic Year</label>
            <input 
              type="text" 
              [(ngModel)]="academicYear" 
              placeholder="e.g. 2026 - 2027"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500" 
            />
          </div>
        </div>
      </div>

      <!-- Excel 7-Sheet Live Preview Tabs -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        <!-- Sheet Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-3">
          <button 
            *ngFor="let sheet of sheetTabs; let i = index"
            (click)="activeSheetTab.set(i)"
            [ngClass]="activeSheetTab() === i ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'"
            class="px-4 py-2 rounded-xl text-xs border transition-all whitespace-nowrap flex items-center gap-2"
          >
            <i class="pi pi-table"></i> Sheet {{ i + 1 }}: {{ sheet }}
          </button>
        </div>

        <!-- Sheet 1: Timetable Grid Preview -->
        <div *ngIf="activeSheetTab() === 0" class="overflow-x-auto">
          <div class="mb-3 text-xs text-slate-400 font-semibold">
            Title Header: {{ gradeTitle || 'Class Timetable' }} (Academic Year: {{ academicYear || '2026-2027' }})
          </div>
          <table class="w-full text-center border-collapse min-w-[700px]">
            <thead>
              <tr class="bg-emerald-950/60 text-emerald-300 text-xs font-bold uppercase border-b border-emerald-800">
                <th class="p-3 border border-slate-800 text-left w-32">Day \\ Period</th>
                <th *ngFor="let p of stateService.periods()" class="p-3 border border-slate-800">
                  Period {{ p }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of stateService.days()" class="hover:bg-slate-800/30 text-xs">
                <td class="p-3 border border-slate-800 text-left font-bold text-white bg-slate-900/80">
                  {{ day }}
                </td>
                <td *ngFor="let p of stateService.periods()" class="p-2 border border-slate-800 bg-slate-900/40">
                  <ng-container *ngWith="getCellEntry(day, p) as entry">
                    <div class="font-bold text-white">{{ entry?.subject || 'Free Period' }}</div>
                    <div class="text-[10px] text-emerald-400 mt-0.5" *ngIf="entry?.staff">
                      {{ entry?.staff }}
                    </div>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sheet 2: Detailed Timetable Preview -->
        <div *ngIf="activeSheetTab() === 1" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3">Day</th>
                <th class="p-3">Period</th>
                <th class="p-3">Start Time</th>
                <th class="p-3">End Time</th>
                <th class="p-3">Subject</th>
                <th class="p-3">Subject Code</th>
                <th class="p-3">Staff ID</th>
                <th class="p-3">Staff Name</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let e of stateService.timetableEntries()" class="hover:bg-slate-800/40">
                <td class="p-3 font-semibold text-white">{{ e.day }}</td>
                <td class="p-3 font-mono text-brand-400">P{{ e.period }}</td>
                <td class="p-3 font-mono">{{ e.startTime }}</td>
                <td class="p-3 font-mono">{{ e.endTime }}</td>
                <td class="p-3 font-bold text-white">{{ e.subject }}</td>
                <td class="p-3 font-mono text-slate-400">{{ e.subjectCode || 'GEN' }}</td>
                <td class="p-3 font-mono text-slate-400">{{ e.staffId || 'N/A' }}</td>
                <td class="p-3 font-semibold text-emerald-400">{{ e.staff || 'Unassigned' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sheet 3: Timeslots Preview -->
        <div *ngIf="activeSheetTab() === 2" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3">Period</th>
                <th class="p-3">Start Time</th>
                <th class="p-3">End Time</th>
                <th class="p-3">Is Break</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let t of stateService.timeslots()">
                <td class="p-3 font-bold text-white">Period {{ t.period }}</td>
                <td class="p-3 font-mono">{{ t.startTime }}</td>
                <td class="p-3 font-mono">{{ t.endTime }}</td>
                <td class="p-3">
                  <span [ngClass]="t.isBreak ? 'text-amber-400 font-bold' : 'text-slate-400'">
                    {{ t.isBreak ? 'Yes (Break)' : 'No' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sheet 4: Subjects Preview -->
        <div *ngIf="activeSheetTab() === 3" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3">Subject Code</th>
                <th class="p-3">Subject Name</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let s of stateService.subjects()">
                <td class="p-3 font-mono text-brand-400 font-bold">{{ s.code || 'SUB' }}</td>
                <td class="p-3 font-semibold text-white">{{ s.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sheet 5: Staff Preview -->
        <div *ngIf="activeSheetTab() === 4" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3">Staff ID</th>
                <th class="p-3">Full Name</th>
                <th class="p-3">Department</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let st of stateService.staff()">
                <td class="p-3 font-mono text-emerald-400 font-bold">{{ st.staffId || st.id }}</td>
                <td class="p-3 font-semibold text-white">{{ st.name }}</td>
                <td class="p-3 text-slate-400">{{ st.department || 'General' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sheet 6: Assignments Preview -->
        <div *ngIf="activeSheetTab() === 5" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 font-semibold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3">Subject Name</th>
                <th class="p-3">Assigned Staff Name</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let sub of stateService.subjects()">
                <td class="p-3 font-bold text-white">{{ sub.name }}</td>
                <td class="p-3 text-emerald-400 font-semibold">
                  {{ getAssignedStaffName(sub.id) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sheet 7: Validation Preview -->
        <div *ngIf="activeSheetTab() === 6" class="overflow-x-auto">
          <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">Total Matrix Coverage:</span>
              <span class="font-bold text-white">{{ stateService.validation()?.totalCells }} Cells</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Valid Cells:</span>
              <span class="font-bold text-emerald-400">{{ stateService.validation()?.validCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Needs Review Count:</span>
              <span class="font-bold text-amber-400">{{ stateService.validation()?.needsReviewCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Critical Error Count:</span>
              <span class="font-bold text-rose-400">{{ stateService.validation()?.errorCount }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class ExportComponent {
  readonly stateService = inject(TimetableStateService);
  readonly apiService = inject(TimetableApiService);

  readonly activeSheetTab = signal(0);
  readonly isExporting = signal(false);

  gradeTitle = 'Grade 10 - Section D';
  academicYear = '2026 - 2027';

  sheetTabs = [
    'Timetable Grid',
    'Detailed Timetable',
    'Timeslots',
    'Subjects',
    'Staff',
    'Subject Staff Assignment',
    'Validation',
  ];

  getCellEntry(day: string, period: number) {
    return this.stateService.timetableEntries().find((e) => e.day === day && e.period === period);
  }

  getAssignedStaffName(subjectId: string): string {
    const assignment = this.stateService.assignments().find((a) => a.subjectId === subjectId);
    if (!assignment) return 'Unassigned';
    const staffMember = this.stateService.staff().find((s) => s.id === assignment.staffId);
    return staffMember?.name || 'Unassigned';
  }

  async downloadExcel() {
    this.isExporting.set(true);
    try {
      // In Phase 8, this calls POST /api/timetable/export to fetch real .xlsx blob
      // Client-side fallback download trigger for Phase 1 UI demo:
      const filename = (this.stateService.filename() || 'Timetable').replace(/\.xlsx$/i, '') + '.xlsx';
      
      const res = await fetch('/api/timetable/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: this.stateService.state(),
          filename,
          gradeTitle: this.gradeTitle,
          academicYear: this.academicYear,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Mock fallback blob trigger if backend endpoint returns stub
        const dummyContent = 'Smart Timetable Excel Export Mock';
        const blob = new Blob([dummyContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading Excel:', err);
    } finally {
      this.isExporting.set(false);
    }
  }
}
