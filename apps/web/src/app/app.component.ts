import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableStateService } from './core/services/timetable-state.service';
import { StepperComponent } from './features/stepper/stepper.component';
import { UploadComponent } from './features/upload/upload.component';
import { PreprocessingComponent } from './features/preprocessing/preprocessing.component';
import { GridEditorComponent } from './features/grid-editor/grid-editor.component';
import { TimeslotsComponent } from './features/timeslots/timeslots.component';
import { DaysPeriodsComponent } from './features/days-periods/days-periods.component';
import { SubjectsComponent } from './features/subjects/subjects.component';
import { StaffComponent } from './features/staff/staff.component';
import { AssignmentComponent } from './features/assignment/assignment.component';
import { ValidationComponent } from './features/validation/validation.component';
import { ExportComponent } from './features/export/export.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    StepperComponent,
    UploadComponent,
    PreprocessingComponent,
    GridEditorComponent,
    TimeslotsComponent,
    DaysPeriodsComponent,
    SubjectsComponent,
    StaffComponent,
    AssignmentComponent,
    ValidationComponent,
    ExportComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      
      <!-- App Header -->
      <header class="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <i class="pi pi-table text-xl"></i>
          </div>
          <div>
            <h1 class="text-lg font-bold text-white tracking-tight font-outfit">
              Smart Timetable Image to Excel
            </h1>
            <p class="text-xs text-slate-400">Intelligent Timetable OCR, Grid Detection & XLSX Converter</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            No-DB / Stateless Mode
          </span>
          <button 
            *ngIf="stateService.hasImage()" 
            (click)="stateService.reset()" 
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
          >
            <i class="pi pi-refresh"></i> Reset Session
          </button>
        </div>
      </header>

      <!-- Stepper Navigation -->
      <app-stepper />

      <!-- Main Step View Container -->
      <main class="flex-1 pb-16">
        <ng-container [ngSwitch]="stateService.currentStep()">
          <app-upload *ngSwitchCase="1" />
          <app-preprocessing *ngSwitchCase="2" />
          <app-grid-editor *ngSwitchCase="3" />
          <app-timeslots *ngSwitchCase="4" />
          <app-days-periods *ngSwitchCase="5" />
          <app-subjects *ngSwitchCase="6" />
          <app-staff *ngSwitchCase="7" />
          <app-assignment *ngSwitchCase="8" />
          <app-validation *ngSwitchCase="9" />
          <app-export *ngSwitchCase="10" />
        </ng-container>
      </main>

      <!-- Footer -->
      <footer class="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Smart Timetable Image to Excel &copy; 2026</span>
        <span>Temporary in-memory processing. No authentication or database required.</span>
      </footer>

    </div>
  `,
})
export class AppComponent {
  readonly stateService = inject(TimetableStateService);
}
