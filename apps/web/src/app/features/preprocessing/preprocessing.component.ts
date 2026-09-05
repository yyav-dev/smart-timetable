import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableStateService } from '../../core/services/timetable-state.service';

@Component({
  selector: 'app-preprocessing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Section header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <i class="pi pi-sliders-h"></i> Step 2: OpenCV Image Preprocessing
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Image Optimization & Denoising
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Compare the original image with the OpenCV enhanced grayscale and thresholded image used for grid line detection.
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
            (click)="proceedToGrid()" 
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all"
          >
            <span>Proceed to Grid Editor</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Side-by-Side Comparison Card -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Left: Original Image -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span> Original Image
              </h3>
              <span class="text-xs text-slate-500">Unfiltered Source</span>
            </div>
            <div class="relative max-h-[440px] h-[380px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
              <img 
                [src]="stateService.originalImagePreviewUrl()" 
                alt="Original Timetable" 
                class="max-h-full w-auto object-contain rounded"
              />
            </div>
          </div>

          <!-- Right: Processed Image -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-brand-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span> OpenCV Processed (Adaptive Threshold)
              </h3>
              <span class="text-xs text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Grayscale & Deskewed</span>
            </div>
            <div class="relative max-h-[440px] h-[380px] bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
              <img 
                [src]="stateService.processedImagePreviewUrl()" 
                alt="OpenCV Processed Timetable" 
                [style.filter]="'contrast(' + contrast() + '%) grayscale(100%)'"
                class="max-h-full w-auto object-contain rounded"
              />
            </div>
          </div>

        </div>

        <!-- Preprocessing Tuning Controls -->
        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          
          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400 font-medium">Contrast Enhancement</span>
              <span class="text-brand-400 font-bold">{{ contrast() }}%</span>
            </div>
            <input 
              type="range" 
              min="80" 
              max="200" 
              [value]="contrast()" 
              (input)="onContrastChange($event)"
              class="w-full accent-brand-500 bg-slate-700 h-2 rounded-lg cursor-pointer" 
            />
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400 font-medium">Noise Reduction Threshold</span>
              <span class="text-brand-400 font-bold">{{ noiseThreshold() }}px</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              [value]="noiseThreshold()" 
              (input)="onNoiseChange($event)"
              class="w-full accent-brand-500 bg-slate-700 h-2 rounded-lg cursor-pointer" 
            />
          </div>

          <div class="flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div>
              <div class="text-xs font-semibold text-slate-200">Auto Deskewing</div>
              <div class="text-[11px] text-slate-400">Correct camera tilt angle</div>
            </div>
            <button 
              (click)="autoDeskew.set(!autoDeskew())"
              [ngClass]="autoDeskew() ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-400'"
              class="px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            >
              {{ autoDeskew() ? 'ENABLED' : 'OFF' }}
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class PreprocessingComponent {
  readonly stateService = inject(TimetableStateService);

  readonly contrast = signal(120);
  readonly noiseThreshold = signal(3);
  readonly autoDeskew = signal(true);

  onContrastChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.contrast.set(val);
  }

  onNoiseChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.noiseThreshold.set(val);
  }

  proceedToGrid() {
    this.stateService.setStep(3);
  }
}
