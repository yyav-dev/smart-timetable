import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { Timeslot } from '@smart-timetable/shared-types';

@Component({
  selector: 'app-timeslots',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <i class="pi pi-clock"></i> Step 4: Timeslot Configuration
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Configure Period Schedules & Breaks
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Specify start time, end time, and break periods for each grid period column.
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
            (click)="proceedToDaysPeriods()" 
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all"
          >
            <span>Next: Days & Periods</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Timeslot Table Card -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="pi pi-list text-brand-400"></i> Period Schedule Table
            </h3>
            <p class="text-xs text-slate-400">Grid Period ≠ Timeslot (grid defines columns, timeslots define actual times)</p>
          </div>

          <button 
            (click)="addPeriodTimeslot()" 
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
          >
            <i class="pi pi-plus"></i> Add Period
          </button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3.5 px-4">Period</th>
                <th class="py-3.5 px-4">Start Time</th>
                <th class="py-3.5 px-4">End Time</th>
                <th class="py-3.5 px-4">Duration</th>
                <th class="py-3.5 px-4">Break Period?</th>
                <th class="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let slot of stateService.timeslots(); let i = index" class="hover:bg-slate-800/40 transition-colors">
                
                <!-- Period # -->
                <td class="py-3 px-4 font-bold text-white">
                  <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-brand-400">
                    Period {{ slot.period }}
                  </span>
                </td>

                <!-- Start Time -->
                <td class="py-3 px-4">
                  <input 
                    type="time" 
                    [ngModel]="slot.startTime" 
                    (ngModelChange)="onTimeChange(slot.period, 'startTime', $event)"
                    class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </td>

                <!-- End Time -->
                <td class="py-3 px-4">
                  <input 
                    type="time" 
                    [ngModel]="slot.endTime" 
                    (ngModelChange)="onTimeChange(slot.period, 'endTime', $event)"
                    class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </td>

                <!-- Duration -->
                <td class="py-3 px-4 font-mono text-xs text-slate-400">
                  {{ calculateDuration(slot.startTime, slot.endTime) }} mins
                </td>

                <!-- Break Toggle -->
                <td class="py-3 px-4">
                  <button 
                    (click)="toggleBreak(slot.period)"
                    [ngClass]="slot.isBreak ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'"
                    class="px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5"
                  >
                    <i [ngClass]="slot.isBreak ? 'pi pi-coffee' : 'pi pi-calendar'"></i>
                    {{ slot.isBreak ? 'Yes (Break)' : 'No (Class)' }}
                  </button>
                </td>

                <!-- Delete -->
                <td class="py-3 px-4 text-right">
                  <button 
                    (click)="removePeriodTimeslot(slot.period)"
                    class="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove Period"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `,
})
export class TimeslotsComponent {
  readonly stateService = inject(TimetableStateService);

  onTimeChange(period: number, field: 'startTime' | 'endTime', value: string) {
    this.stateService.updateTimeslot(period, field, value);
  }

  toggleBreak(period: number) {
    const current = this.stateService.timeslots().find((t) => t.period === period);
    if (current) {
      this.stateService.updateTimeslot(period, 'isBreak', !current.isBreak);
    }
  }

  calculateDuration(start: string, end: string): number {
    try {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      return eH * 60 + eM - (sH * 60 + sM);
    } catch {
      return 45;
    }
  }

  addPeriodTimeslot() {
    const currentSlots = this.stateService.timeslots();
    const lastPeriod = currentSlots.length > 0 ? currentSlots[currentSlots.length - 1].period : 0;
    const nextPeriod = lastPeriod + 1;

    const newSlot: Timeslot = {
      period: nextPeriod,
      startTime: '14:00',
      endTime: '14:45',
      isBreak: false,
    };

    this.stateService.setTimeslots([...currentSlots, newSlot]);
  }

  removePeriodTimeslot(period: number) {
    const filtered = this.stateService.timeslots().filter((t) => t.period !== period);
    this.stateService.setTimeslots(filtered);
  }

  proceedToDaysPeriods() {
    this.stateService.setStep(5);
  }
}
