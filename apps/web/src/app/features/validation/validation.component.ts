import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { ValidationIssue } from '@smart-timetable/shared-types';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <i class="pi pi-shield"></i> Step 9: Final Timetable Validation
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Quality Assurance & Verification
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Automated compliance check for unassigned staff, low-confidence OCR text, missing periods, or unverified slots.
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
            (click)="proceedToExport()" 
            [disabled]="!stateService.validation()?.canExport"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <span>Proceed to Excel Export</span>
            <i class="pi pi-file-excel"></i>
          </button>
        </div>
      </div>

      <!-- Validation Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl text-center space-y-1">
          <div class="text-3xl font-extrabold text-white">
            {{ stateService.validation()?.totalCells || 0 }}
          </div>
          <div class="text-xs font-medium text-slate-400">Total Matrix Cells</div>
        </div>

        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl text-center space-y-1">
          <div class="text-3xl font-extrabold text-emerald-400">
            {{ stateService.validation()?.validCount || 0 }}
          </div>
          <div class="text-xs font-medium text-emerald-300">Valid & Verified</div>
        </div>

        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl text-center space-y-1">
          <div class="text-3xl font-extrabold text-amber-400">
            {{ stateService.validation()?.needsReviewCount || 0 }}
          </div>
          <div class="text-xs font-medium text-amber-300">Needs Review / Unassigned</div>
        </div>

        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl text-center space-y-1">
          <div class="text-3xl font-extrabold text-rose-400">
            {{ stateService.validation()?.errorCount || 0 }}
          </div>
          <div class="text-xs font-medium text-rose-300">Critical Errors</div>
        </div>

      </div>

      <!-- Issues List Card -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i class="pi pi-list-check text-brand-400"></i> Validation Issues & Warnings
          </h3>
          
          <button 
            (click)="stateService.runValidation()" 
            class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          >
            <i class="pi pi-refresh"></i> Re-Run Validation
          </button>
        </div>

        <!-- Issue Rows -->
        <div *ngIf="(stateService.validation()?.issues?.length || 0) > 0" class="space-y-3">
          <div 
            *ngFor="let issue of stateService.validation()?.issues"
            [ngClass]="{
              'bg-rose-950/20 border-rose-500/30 text-rose-300': issue.severity === 'error',
              'bg-amber-950/20 border-amber-500/30 text-amber-300': issue.severity === 'warning'
            }"
            class="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-center gap-3">
              <i 
                [ngClass]="issue.severity === 'error' ? 'pi pi-times-circle text-rose-400 text-lg' : 'pi pi-exclamation-triangle text-amber-400 text-lg'"
              ></i>
              <div>
                <div class="font-bold text-slate-100">{{ issue.message }}</div>
                <div class="text-slate-400 text-[11px] mt-0.5" *ngIf="issue.day && issue.period">
                  Location: {{ issue.day }}, Period {{ issue.period }}
                </div>
              </div>
            </div>

            <!-- Action: Mark as Free Period -->
            <button 
              *ngIf="issue.day && issue.period"
              (click)="markFreePeriod(issue.day, issue.period)"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shrink-0 self-end sm:self-center transition-colors"
            >
              Mark as Free Period
            </button>
          </div>
        </div>

        <!-- All Clean Message -->
        <div *ngIf="(stateService.validation()?.issues?.length || 0) === 0" class="text-center py-8 text-emerald-400 space-y-2">
          <i class="pi pi-check-circle text-4xl"></i>
          <h4 class="text-lg font-bold text-white">All Timetable Cells Validated Cleanly!</h4>
          <p class="text-slate-400 text-xs">No missing subjects, staff, or critical errors found. Ready for Excel export.</p>
        </div>

      </div>
    </div>
  `,
})
export class ValidationComponent {
  readonly stateService = inject(TimetableStateService);

  markFreePeriod(day: string, period: number) {
    this.stateService.toggleCellFreePeriod(day, period);
  }

  proceedToExport() {
    this.stateService.setStep(10);
  }
}
