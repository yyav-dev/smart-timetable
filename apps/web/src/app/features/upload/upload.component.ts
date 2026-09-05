import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { TimetableApiService } from '../../core/services/timetable-api.service';

export type StaffLocationConfig = 'embedded' | 'excel' | 'separate' | 'omitted';

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      <!-- Title banner -->
      <div class="text-center space-y-3">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
          <i class="pi pi-sparkles"></i> Step 1: Timetable Upload, Grade Crop & Staff Setup
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
          Smart Timetable Image to Excel
        </h1>
        <p class="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Upload any timetable image. Crop specific grade timetables if a single image contains multiple grades, configure staff sources, and generate Excel.
        </p>
      </div>

      <!-- Main Upload Dropzone / Preview & Cropper Card -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6">
        
        <!-- Upload Dropzone (When no image is selected) -->
        <div 
          *ngIf="!stateService.hasImage()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [ngClass]="{ 'border-brand-500 bg-brand-500/5': isDragging() }"
          class="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-10 text-center transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px]"
          (click)="fileInput.click()"
        >
          <input 
            #fileInput 
            type="file" 
            accept="image/jpeg,image/jpg,image/png" 
            class="hidden" 
            (change)="onFileSelected($event)" 
          />

          <div class="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-lg">
            <i class="pi pi-cloud-upload text-3xl"></i>
          </div>

          <h3 class="text-lg font-semibold text-white mb-1">Drag and drop your timetable image here</h3>
          <p class="text-slate-400 text-sm mb-4">Supports JPG, JPEG, and PNG (up to 15MB)</p>

          <button 
            type="button"
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
          >
            <i class="pi pi-folder-open"></i> Browse File
          </button>
        </div>

        <!-- Image Preview & Canvas Cropper (When image is selected) -->
        <div *ngIf="stateService.hasImage()" class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <!-- Image preview / Canvas cropper element -->
          <div class="md:col-span-7 flex flex-col items-center">
            
            <div class="relative w-full max-h-[400px] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center p-2">
              <canvas 
                #cropCanvas
                (mousedown)="onCanvasMouseDown($event)"
                (mousemove)="onCanvasMouseMove($event)"
                (mouseup)="onCanvasMouseUp()"
                [ngClass]="isCropMode() ? 'cursor-crosshair' : 'cursor-default'"
                class="max-w-full h-auto object-contain rounded shadow-md"
              ></canvas>

              <!-- Crop Mode Banner overlay -->
              <div *ngIf="isCropMode()" class="absolute top-3 left-3 bg-amber-500/90 text-slate-950 font-bold text-xs px-3 py-1 rounded-lg shadow flex items-center gap-1.5 backdrop-blur">
                <i class="pi pi-crop"></i> Drag rectangle over specific grade timetable section
              </div>
            </div>

            <!-- Toolbar: Rotate, Interactive Crop, Replace & Remove Image -->
            <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
              
              <!-- Interactive Crop Toggle -->
              <button 
                (click)="toggleCropMode()" 
                [ngClass]="isCropMode() ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <i class="pi pi-crop"></i> {{ isCropMode() ? 'Exit Crop Mode' : 'Crop Grade Section' }}
              </button>

              <!-- Apply Crop Button (Visible when cropping) -->
              <button 
                *ngIf="isCropMode()"
                (click)="applyCropSelection()" 
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <i class="pi pi-check"></i> Apply Crop Selection
              </button>

              <!-- Reset Crop Button -->
              <button 
                *ngIf="hasAppliedCrop()"
                (click)="resetToOriginalUncropped()" 
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <i class="pi pi-undo"></i> Reset to Full Image
              </button>

              <button 
                (click)="rotateLeft()" 
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Rotate Left 90°"
              >
                <i class="pi pi-undo"></i> Rotate Left
              </button>
              
              <button 
                (click)="rotateRight()" 
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Rotate Right 90°"
              >
                <i class="pi pi-refresh"></i> Rotate Right
              </button>

              <button 
                (click)="replaceImage(fileInputReplace)" 
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <i class="pi pi-sync"></i> Replace
              </button>
              <input #fileInputReplace type="file" accept="image/jpeg,image/jpg,image/png" class="hidden" (change)="onFileSelected($event)" />

              <!-- REMOVE IMAGE BUTTON -->
              <button 
                (click)="removeImage()" 
                class="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1.5 transition-colors"
              >
                <i class="pi pi-trash"></i> Remove Image
              </button>
            </div>
          </div>

          <!-- Metadata & Configuration Panel -->
          <div class="md:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <h3 class="text-base font-bold text-white mb-3 flex items-center gap-2">
                <i class="pi pi-image text-brand-400"></i> Image Specifications
              </h3>

              <div class="space-y-2.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div class="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span class="text-slate-400">File Name</span>
                  <span class="text-slate-200 font-medium truncate max-w-[180px]" [title]="stateService.imageMeta()?.fileName">
                    {{ stateService.imageMeta()?.fileName }}
                  </span>
                </div>

                <div class="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span class="text-slate-400">Dimensions</span>
                  <span class="text-slate-200 font-medium">
                    {{ stateService.imageMeta()?.width || 1280 }} × {{ stateService.imageMeta()?.height || 720 }} px
                  </span>
                </div>

                <div class="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span class="text-slate-400">Crop Status</span>
                  <span [ngClass]="hasAppliedCrop() ? 'text-amber-400 font-bold' : 'text-slate-400'">
                    {{ hasAppliedCrop() ? 'Single Grade Section Cropped' : 'Full Image View' }}
                  </span>
                </div>

                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Format</span>
                  <span class="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold uppercase text-[10px]">
                    {{ (stateService.imageMeta()?.mimeType || 'image/jpeg').split('/')[1] }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Staff Configuration Options -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <i class="pi pi-cog text-emerald-400"></i> Staff Source Configuration
              </h4>

              <div class="space-y-2 text-xs">
                <label 
                  (click)="staffConfig.set('embedded')"
                  [ngClass]="staffConfig() === 'embedded' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-400'"
                  class="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all"
                >
                  <input type="radio" name="staffConfig" [checked]="staffConfig() === 'embedded'" class="accent-brand-500" />
                  <div>
                    <div class="font-bold">Staff Printed in Main Image</div>
                    <div class="text-[11px] opacity-75">Staff names are written inside grid cells or footer legend</div>
                  </div>
                </label>

                <label 
                  (click)="staffConfig.set('excel')"
                  [ngClass]="staffConfig() === 'excel' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-400'"
                  class="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all"
                >
                  <input type="radio" name="staffConfig" [checked]="staffConfig() === 'excel'" class="accent-brand-500" />
                  <div>
                    <div class="font-bold">Upload Staff Excel File (.xlsx / .csv)</div>
                    <div class="text-[11px] opacity-75">Import teacher master list directly from Excel spreadsheet</div>
                  </div>
                </label>

                <label 
                  (click)="staffConfig.set('separate')"
                  [ngClass]="staffConfig() === 'separate' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-400'"
                  class="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all"
                >
                  <input type="radio" name="staffConfig" [checked]="staffConfig() === 'separate'" class="accent-brand-500" />
                  <div>
                    <div class="font-bold">Separate Staff Legend Document (OCR)</div>
                    <div class="text-[11px] opacity-75">Staff list will be OCR scanned from a separate image</div>
                  </div>
                </label>

                <label 
                  (click)="staffConfig.set('omitted')"
                  [ngClass]="staffConfig() === 'omitted' ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-slate-800 bg-slate-900/60 text-slate-400'"
                  class="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all"
                >
                  <input type="radio" name="staffConfig" [checked]="staffConfig() === 'omitted'" class="accent-brand-500" />
                  <div>
                    <div class="font-bold">No Staff Details (Subjects Only)</div>
                    <div class="text-[11px] opacity-75">Omit staff extraction; timetable contains subjects & periods only</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Pipeline Execution Buttons -->
            <div class="pt-4 border-t border-slate-800 space-y-3">
              <button 
                (click)="processTimetable()"
                [disabled]="isProcessing()"
                class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm transition-all shadow-xl shadow-brand-600/30 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <i *ngIf="!isProcessing()" class="pi pi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                <i *ngIf="isProcessing()" class="pi pi-spin pi-spinner"></i>
                <span>{{ isProcessing() ? 'Processing Image...' : 'Process Timetable (Guided Wizard)' }}</span>
              </button>

              <!-- FAST AUTO-OCR TO EXCEL EXTRACTION -->
              <button 
                (click)="runExpressAutoOCR()"
                [disabled]="isProcessing()"
                class="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <i class="pi pi-bolt text-amber-400"></i>
                <span>Fast Express Auto-OCR to Excel Export</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class UploadComponent implements AfterViewInit {
  readonly stateService = inject(TimetableStateService);
  readonly apiService = inject(TimetableApiService);

  @ViewChild('cropCanvas') cropCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly isDragging = signal(false);
  readonly isProcessing = signal(false);
  readonly rotation = signal(0);
  readonly staffConfig = signal<StaffLocationConfig>('embedded');
  readonly isCropMode = signal(false);
  readonly hasAppliedCrop = signal(false);

  private rawImageObj: HTMLImageElement | null = null;
  private rawUncroppedDataUrl: string = '';

  private cropBox: CropBox | null = null;
  private isDrawingCrop = false;
  private startX = 0;
  private startY = 0;

  ngAfterViewInit() {
    this.loadImageToCanvas();
  }

  loadImageToCanvas() {
    const url = this.stateService.originalImagePreviewUrl() || this.stateService.processedImagePreviewUrl();
    if (!url) return;

    if (!this.rawUncroppedDataUrl) {
      this.rawUncroppedDataUrl = url;
    }

    this.rawImageObj = new Image();
    this.rawImageObj.onload = () => {
      this.drawCanvas();
    };
    this.rawImageObj.src = url;
  }

  drawCanvas() {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas || !this.rawImageObj) return;

    canvas.width = this.rawImageObj.width || 800;
    canvas.height = this.rawImageObj.height || 500;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(this.rawImageObj, 0, 0, canvas.width, canvas.height);

    // Draw crop box overlay if crop mode is active
    if (this.isCropMode() && this.cropBox) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear selection box
      ctx.clearRect(this.cropBox.x, this.cropBox.y, this.cropBox.w, this.cropBox.h);
      ctx.drawImage(
        this.rawImageObj,
        this.cropBox.x,
        this.cropBox.y,
        this.cropBox.w,
        this.cropBox.h,
        this.cropBox.x,
        this.cropBox.y,
        this.cropBox.w,
        this.cropBox.h
      );

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.cropBox.x, this.cropBox.y, this.cropBox.w, this.cropBox.h);
    }
  }

  toggleCropMode() {
    const nextMode = !this.isCropMode();
    this.isCropMode.set(nextMode);
    if (!nextMode) {
      this.cropBox = null;
    }
    this.drawCanvas();
  }

  onCanvasMouseDown(event: MouseEvent) {
    if (!this.isCropMode()) return;
    const canvas = this.cropCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    this.startX = (event.clientX - rect.left) * scaleX;
    this.startY = (event.clientY - rect.top) * scaleY;
    this.isDrawingCrop = true;
    this.cropBox = { x: this.startX, y: this.startY, w: 0, h: 0 };
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.isCropMode() || !this.isDrawingCrop) return;
    const canvas = this.cropCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const currentX = (event.clientX - rect.left) * scaleX;
    const currentY = (event.clientY - rect.top) * scaleY;

    const x = Math.min(this.startX, currentX);
    const y = Math.min(this.startY, currentY);
    const w = Math.abs(currentX - this.startX);
    const h = Math.abs(currentY - this.startY);

    this.cropBox = { x, y, w, h };
    this.drawCanvas();
  }

  onCanvasMouseUp() {
    if (this.isDrawingCrop) {
      this.isDrawingCrop = false;
    }
  }

  applyCropSelection() {
    if (!this.cropBox || this.cropBox.w < 20 || this.cropBox.h < 20 || !this.rawImageObj) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.cropBox.w;
    tempCanvas.height = this.cropBox.h;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      this.rawImageObj,
      this.cropBox.x,
      this.cropBox.y,
      this.cropBox.w,
      this.cropBox.h,
      0,
      0,
      this.cropBox.w,
      this.cropBox.h
    );

    const croppedDataUrl = tempCanvas.toDataURL('image/jpeg');

    const meta = this.stateService.imageMeta();
    if (meta) {
      this.stateService.setImage(
        {
          ...meta,
          width: Math.round(this.cropBox.w),
          height: Math.round(this.cropBox.h),
        },
        croppedDataUrl,
        croppedDataUrl
      );
    }

    this.hasAppliedCrop.set(true);
    this.isCropMode.set(false);
    this.cropBox = null;
    this.loadImageToCanvas();
  }

  resetToOriginalUncropped() {
    if (this.rawUncroppedDataUrl) {
      const meta = this.stateService.imageMeta();
      if (meta) {
        this.stateService.setImage(meta, this.rawUncroppedDataUrl, this.rawUncroppedDataUrl);
      }
    }
    this.hasAppliedCrop.set(false);
    this.isCropMode.set(false);
    this.cropBox = null;
    this.loadImageToCanvas();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  async handleFile(file: File) {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please upload a valid JPEG or PNG image.');
      return;
    }

    this.isProcessing.set(true);
    try {
      const res = await this.apiService.processImage(file);
      const originalPreviewUrl = URL.createObjectURL(file);
      this.rawUncroppedDataUrl = originalPreviewUrl;
      this.hasAppliedCrop.set(false);
      this.stateService.setImage(res.imageMeta, res.processedImagePreviewUrl, originalPreviewUrl);
      setTimeout(() => this.loadImageToCanvas(), 100);
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  replaceImage(inputElement: HTMLInputElement) {
    inputElement.click();
  }

  removeImage() {
    this.stateService.clearImage();
    this.rotation.set(0);
    this.hasAppliedCrop.set(false);
    this.isCropMode.set(false);
    this.rawUncroppedDataUrl = '';
  }

  rotateLeft() {
    this.rotation.update((r) => (r - 90 + 360) % 360);
  }

  rotateRight() {
    this.rotation.update((r) => (r + 90) % 360);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async processTimetable() {
    this.isProcessing.set(true);
    try {
      const res = await this.apiService.detectGrid(this.stateService.processedImagePreviewUrl() || '');
      this.stateService.setGrid(res.grid);
      this.stateService.setDaysAndPeriods(res.days, res.periods);
      this.stateService.setTimeslots(res.timeslots);

      this.stateService.setStep(2);
    } catch (err) {
      console.error('Error detecting grid:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async runExpressAutoOCR() {
    this.isProcessing.set(true);
    try {
      const gridRes = await this.apiService.detectGrid(this.stateService.processedImagePreviewUrl() || '');
      this.stateService.setGrid(gridRes.grid);
      this.stateService.setDaysAndPeriods(gridRes.days, gridRes.periods);
      this.stateService.setTimeslots(gridRes.timeslots);

      const subjRes = await this.apiService.extractSubjects(gridRes.grid, gridRes.days, gridRes.periods);
      this.stateService.setSubjects(subjRes.subjects);
      this.stateService.setTimetableEntries(subjRes.timetableEntries);

      if (this.staffConfig() !== 'omitted') {
        const staffRes = await this.apiService.extractStaff(subjRes.subjects);
        this.stateService.setStaff(staffRes.staff);
        this.stateService.setAssignments(staffRes.assignments);
      }

      this.stateService.runValidation();
      this.stateService.setStep(10);
    } catch (err) {
      console.error('Error running express auto-OCR:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
