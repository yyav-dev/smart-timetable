import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { TimetableApiService } from '../../core/services/timetable-api.service';

@Component({
  selector: 'app-days-periods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <i class="pi pi-calendar"></i> Step 5: Day & Period Header Extraction
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Configure Operating Days & Periods
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Specify the days of the week and active period numbers detected from the timetable image header/columns.
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
            (click)="extractSubjects()" 
            [disabled]="isExtracting()"
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <i *ngIf="!isExtracting()" class="pi pi-arrow-right"></i>
            <i *ngIf="isExtracting()" class="pi pi-spin pi-spinner"></i>
            <span>{{ isExtracting() ? 'Extracting Subjects...' : 'Next: Subject OCR Extraction' }}</span>
          </button>
        </div>
      </div>

      <!-- Config Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Days Configuration -->
        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i class="pi pi-calendar text-brand-400"></i> Active Days List
            </h3>
            <button 
              (click)="addDay()" 
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all"
            >
              <i class="pi pi-plus"></i> Add Day
            </button>
          </div>

          <div class="space-y-2">
            <div *ngFor="let day of stateService.days(); let i = index" class="flex items-center gap-2">
              <input 
                type="text" 
                [ngModel]="day" 
                (ngModelChange)="onDayChange(i, $event)"
                class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <button 
                (click)="removeDay(i)" 
                class="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                title="Remove Day"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Periods Count Configuration -->
        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i class="pi pi-th-large text-emerald-400"></i> Periods Count (Columns)
            </h3>
            <span class="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              {{ stateService.periods().length }} Periods Total
            </span>
          </div>

          <p class="text-xs text-slate-400">
            Timetable matrix will be constructed as <strong class="text-white">{{ stateService.days().length }} Days × {{ stateService.periods().length }} Periods</strong> = <strong class="text-brand-300">{{ stateService.days().length * stateService.periods().length }} total cells</strong>.
          </p>

          <div class="flex items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <button 
              (click)="removePeriod()" 
              class="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
            >
              -
            </button>
            <div class="flex-1 text-center font-extrabold text-2xl text-white">
              {{ stateService.periods().length }}
            </div>
            <button 
              (click)="addPeriod()" 
              class="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
            >
              +
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class DaysPeriodsComponent {
  readonly stateService = inject(TimetableStateService);
  readonly apiService = inject(TimetableApiService);

  readonly isExtracting = signal(false);

  onDayChange(index: number, value: string) {
    const days = [...this.stateService.days()];
    days[index] = value;
    this.stateService.setDaysAndPeriods(days, this.stateService.periods());
  }

  addDay() {
    const days = [...this.stateService.days(), 'Saturday'];
    this.stateService.setDaysAndPeriods(days, this.stateService.periods());
  }

  removeDay(index: number) {
    const days = this.stateService.days().filter((_, i) => i !== index);
    this.stateService.setDaysAndPeriods(days, this.stateService.periods());
  }

  addPeriod() {
    const periods = [...this.stateService.periods()];
    periods.push(periods.length + 1);
    this.stateService.setDaysAndPeriods(this.stateService.days(), periods);
  }

  removePeriod() {
    const periods = [...this.stateService.periods()];
    if (periods.length > 1) {
      periods.pop();
      this.stateService.setDaysAndPeriods(this.stateService.days(), periods);
    }
  }

  async extractSubjects() {
    this.isExtracting.set(true);
    try {
      const g = this.stateService.grid();
      if (g) {
        const res = await this.apiService.extractSubjects(g, this.stateService.days(), this.stateService.periods());
        this.stateService.setSubjects(res.subjects);
        this.stateService.setTimetableEntries(res.timetableEntries);
      }
      this.stateService.setStep(6);
    } catch (err) {
      console.error('Error extracting subjects:', err);
    } finally {
      this.isExtracting.set(false);
    }
  }
}
