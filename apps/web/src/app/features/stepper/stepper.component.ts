import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { APP_STEPS } from '../../core/models/timetable.model';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav aria-label="Workflow Stepper" class="w-full bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        <div 
          *ngFor="let step of steps; let i = index"
          (click)="onStepClick(step.id)"
          [ngClass]="{
            'cursor-pointer': step.id <= stateService.currentStep() || stateService.hasImage(),
            'opacity-40 cursor-not-allowed': step.id > stateService.currentStep() && !stateService.hasImage()
          }"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 group"
        >
          <!-- Step indicator badge -->
          <div 
            [ngClass]="{
              'bg-brand-600 text-white shadow-lg shadow-brand-500/30 ring-2 ring-brand-400': stateService.currentStep() === step.id,
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40': step.id < stateService.currentStep(),
              'bg-slate-800 text-slate-400 border border-slate-700': step.id > stateService.currentStep()
            }"
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-semibold transition-transform group-hover:scale-105"
          >
            <i *ngIf="step.id < stateService.currentStep()" class="pi pi-check text-xs"></i>
            <span *ngIf="step.id >= stateService.currentStep()">{{ step.id }}</span>
          </div>

          <!-- Step Title -->
          <div class="flex flex-col">
            <span 
              [ngClass]="{
                'text-white font-semibold': stateService.currentStep() === step.id,
                'text-slate-300': step.id < stateService.currentStep(),
                'text-slate-500': step.id > stateService.currentStep()
              }"
              class="transition-colors"
            >
              {{ step.shortTitle }}
            </span>
          </div>

          <!-- Arrow separator -->
          <i *ngIf="i < steps.length - 1" class="pi pi-chevron-right text-[10px] text-slate-600 ml-1"></i>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class StepperComponent {
  readonly stateService = inject(TimetableStateService);
  readonly steps = APP_STEPS;

  onStepClick(stepId: number) {
    if (stepId <= this.stateService.currentStep() || this.stateService.hasImage()) {
      this.stateService.setStep(stepId);
    }
  }
}
