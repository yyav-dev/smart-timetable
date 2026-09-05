import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { TimetableApiService } from '../../core/services/timetable-api.service';
import { TimetableEntry, Subject } from '@smart-timetable/shared-types';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <!-- Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-850 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-1">
            <i class="pi pi-book"></i> Step 6: Subject OCR Cell Mapping & Normalization
          </span>
          <h2 class="text-xl sm:text-2xl font-bold text-white font-outfit">
            Live Grid Canvas Mapping & Cell Crop Inspector
          </h2>
          <p class="text-slate-400 text-xs sm:text-sm">
            Cell mapped subjects and OCR confidence ratings are rendered directly on the live image canvas cells below.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button 
            (click)="showSubjectMaster.set(!showSubjectMaster())" 
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <i class="pi pi-bookmark"></i> Subject Master Drawer
          </button>

          <button 
            (click)="stateService.prevStep()" 
            class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-all"
          >
            <i class="pi pi-arrow-left"></i> Back
          </button>

          <button 
            (click)="proceedToStaff()" 
            [disabled]="isExtractingStaff()"
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <i *ngIf="!isExtractingStaff()" class="pi pi-arrow-right"></i>
            <i *ngIf="isExtractingStaff()" class="pi pi-spin pi-spinner"></i>
            <span>{{ isExtractingStaff() ? 'Extracting Staff...' : 'Next: Staff Extraction' }}</span>
          </button>
        </div>
      </div>

      <!-- Confidence Legend & Selected Cell Banner -->
      <div class="bg-slate-850 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex items-center gap-4">
          <span class="font-semibold text-slate-400 uppercase tracking-wider">Confidence Ratings:</span>
          <span class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> High (≥ 90%)
          </span>
          <span class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span> Medium (70-89%)
          </span>
          <span class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span> Low (&lt; 70%)
          </span>
        </div>

        <div *ngIf="selectedCellInfo()" class="text-brand-400 font-semibold flex items-center gap-2 bg-brand-500/10 px-3 py-1 rounded border border-brand-500/20">
          <i class="pi pi-eye"></i> Selected: {{ selectedCellInfo()?.day }}, Period {{ selectedCellInfo()?.period }}
        </div>
      </div>

      <!-- Split Layout: Left Source Image & Crop Inspector / Right Subject Matrix -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left 5 cols: Live Timetable Canvas & Crop Inspector -->
        <div class="lg:col-span-5 space-y-4">
          
          <!-- Image canvas with mapped subject details inside cells -->
          <div class="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="pi pi-image text-brand-400"></i> Live Mapped Canvas Grid
              </h3>
              <span class="text-[11px] text-slate-400">Cell Subjects Rendered</span>
            </div>

            <div class="relative w-full max-h-[380px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
              <canvas 
                #sourceCanvas 
                class="max-w-full h-auto object-contain rounded shadow-md"
              ></canvas>
            </div>
          </div>

          <!-- Cell Crop Preview & Mapped Subject Details Card -->
          <div class="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i class="pi pi-search text-emerald-400"></i> Selected Cell Inspector
              </h3>
              <span *ngIf="selectedCellInfo()" class="text-[11px] text-brand-300 font-mono">
                ({{ selectedCellInfo()?.day }}, P{{ selectedCellInfo()?.period }})
              </span>
            </div>

            <!-- Crop Image View -->
            <div class="relative max-h-[120px] h-[100px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
              <canvas #cropCanvas class="max-h-full max-w-full object-contain rounded"></canvas>
            </div>
            
            <!-- Mapped Details Display inside Cell Inspector -->
            <div *ngIf="getSelectedEntry() as activeEntry" class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Mapped Subject:</span>
                <span class="font-bold text-white text-sm">{{ activeEntry.subject || 'Free Period' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Raw OCR Output:</span>
                <span class="font-mono text-brand-300 font-bold">"{{ activeEntry.rawOCRText || 'N/A' }}"</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">OCR Confidence:</span>
                <span [ngClass]="getConfidenceBadgeClass(activeEntry.confidence)" class="px-2 py-0.5 rounded font-semibold text-[10px]">
                  {{ Math.round(activeEntry.confidence * 100) }}% Rating
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- Right 7 cols: Subject Matrix Table -->
        <div class="lg:col-span-7 bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-x-auto">
          <table class="w-full text-center border-collapse min-w-[500px]">
            <thead>
              <tr class="bg-slate-900 text-xs font-semibold text-slate-400 uppercase">
                <th class="p-3 border border-slate-800 text-left w-28">Day \\ Period</th>
                <th *ngFor="let p of stateService.periods()" class="p-2 border border-slate-800 min-w-[100px]">
                  P{{ p }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of stateService.days()" class="hover:bg-slate-800/30 transition-colors">
                
                <!-- Day Header -->
                <td class="p-2 border border-slate-800 text-left font-bold text-white bg-slate-900/60 text-xs">
                  {{ day }}
                </td>

                <!-- Period Cells -->
                <td 
                  *ngFor="let p of stateService.periods()" 
                  (click)="selectCell(day, p)"
                  [ngClass]="{ 'ring-2 ring-brand-400 shadow-lg shadow-brand-500/20': isCellSelected(day, p) }"
                  class="p-1.5 border border-slate-800 cursor-pointer hover:border-brand-500 transition-all text-xs relative group"
                >
                  <ng-container *ngWith="getCellEntry(day, p) as entry">
                    <div 
                      [ngClass]="getConfidenceBgClass(entry?.confidence ?? 1, entry?.isFreePeriod)"
                      class="p-2 rounded-lg border flex flex-col justify-between h-full min-h-[58px] transition-all group-hover:scale-[1.02]"
                    >
                      <!-- Subject Name -->
                      <div class="font-bold text-slate-100 truncate" [title]="entry?.subject">
                        {{ entry?.isFreePeriod ? 'Free Period' : (entry?.subject || 'Empty') }}
                      </div>

                      <!-- Raw OCR & Confidence Badge -->
                      <div class="flex items-center justify-between mt-1 pt-1 border-t border-black/10 text-[9px]">
                        <span class="text-slate-400 font-mono italic truncate max-w-[55px]" [title]="entry?.rawOCRText">
                          "{{ entry?.rawOCRText || 'N/A' }}"
                        </span>
                        <span 
                          [ngClass]="getConfidenceBadgeClass(entry?.confidence ?? 1)"
                          class="px-1.5 py-0.2 rounded font-semibold text-[8px]"
                        >
                          {{ Math.round((entry?.confidence ?? 1) * 100) }}%
                        </span>
                      </div>
                    </div>
                  </ng-container>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Edit Selected Cell Floating Modal -->
      <div 
        *ngIf="editingCell()" 
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i class="pi pi-pencil text-brand-400"></i> Edit Cell Subject
            </h3>
            <button (click)="editingCell.set(null)" class="text-slate-400 hover:text-white">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="bg-slate-850 p-3 rounded-xl border border-slate-800 flex justify-between">
              <span class="text-slate-400">Cell Location:</span>
              <span class="font-bold text-white">{{ editingCell()?.day }}, Period {{ editingCell()?.period }}</span>
            </div>

            <div class="bg-slate-850 p-3 rounded-xl border border-slate-800 flex justify-between">
              <span class="text-slate-400">Raw OCR Text:</span>
              <span class="font-mono text-brand-300 font-bold">"{{ editingCell()?.rawOCRText || 'N/A' }}"</span>
            </div>

            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Assign Subject from Master:</label>
              <select 
                [(ngModel)]="editSelectedSubject" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Custom Free Text --</option>
                <option *ngFor="let s of stateService.subjects()" [value]="s.name">
                  {{ s.name }} ({{ s.code || 'GEN' }})
                </option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Or Enter Custom Subject Name:</label>
              <input 
                type="text" 
                [(ngModel)]="editCustomSubject" 
                placeholder="Custom subject name..." 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button 
              (click)="saveCellEdit()" 
              class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Save Subject
            </button>
            <button 
              (click)="editingCell.set(null)" 
              class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Subject Master Side Drawer -->
      <div 
        *ngIf="showSubjectMaster()" 
        class="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto space-y-6"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="pi pi-bookmark text-amber-400"></i> Temporary Subject Master
            </h3>
            <button (click)="showSubjectMaster.set(false)" class="text-slate-400 hover:text-white">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Add new subject form -->
          <div class="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 class="text-xs font-bold text-slate-300 uppercase">Add New Subject</h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" [(ngModel)]="newSubjectCode" placeholder="Code (e.g. MATH)" class="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
              <input type="text" [(ngModel)]="newSubjectName" placeholder="Name (e.g. Mathematics)" class="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
            </div>
            <button 
              (click)="addNewSubject()" 
              class="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Add Subject
            </button>
          </div>

          <!-- Subject List -->
          <div class="space-y-2">
            <div *ngFor="let sub of stateService.subjects()" class="flex items-center justify-between p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs">
              <div>
                <span class="font-bold text-white">{{ sub.name }}</span>
                <span class="ml-2 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{{ sub.code }}</span>
              </div>
              <button (click)="stateService.deleteSubject(sub.id)" class="text-slate-500 hover:text-rose-400">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <button (click)="showSubjectMaster.set(false)" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold">
          Close Subject Master Drawer
        </button>
      </div>

    </div>
  `,
})
export class SubjectsComponent implements AfterViewInit {
  readonly stateService = inject(TimetableStateService);
  readonly apiService = inject(TimetableApiService);
  readonly Math = Math;

  @ViewChild('sourceCanvas') sourceCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropCanvas') cropCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly showSubjectMaster = signal(false);
  readonly isExtractingStaff = signal(false);
  readonly selectedCellInfo = signal<{ day: string; period: number; row: number; col: number } | null>(null);
  readonly editingCell = signal<TimetableEntry | null>(null);

  editSelectedSubject = '';
  editCustomSubject = '';
  newSubjectCode = '';
  newSubjectName = '';

  private imageObj: HTMLImageElement | null = null;

  constructor() {
    effect(() => {
      const days = this.stateService.days();
      const periods = this.stateService.periods();
      if (days.length > 0 && periods.length > 0 && !this.selectedCellInfo()) {
        this.selectCell(days[0], periods[0]);
      }
    });
  }

  ngAfterViewInit() {
    this.loadSourceImage();
  }

  loadSourceImage() {
    const url = this.stateService.processedImagePreviewUrl() || this.stateService.originalImagePreviewUrl();
    if (!url) return;

    this.imageObj = new Image();
    this.imageObj.onload = () => {
      this.drawSourceCanvas();
      if (this.selectedCellInfo()) {
        this.updateCropCanvas();
      }
    };
    this.imageObj.src = url;
  }

  selectCell(day: string, period: number) {
    const days = this.stateService.days();
    const periods = this.stateService.periods();

    const r = days.indexOf(day) + 1;
    const c = periods.indexOf(period) + 1;

    this.selectedCellInfo.set({ day, period, row: r, col: c });
    this.drawSourceCanvas();
    this.updateCropCanvas();

    const entry = this.getCellEntry(day, period);
    if (entry) {
      this.editingCell.set(entry);
      this.editSelectedSubject = entry.subject;
      this.editCustomSubject = entry.subject;
    }
  }

  isCellSelected(day: string, period: number): boolean {
    const sel = this.selectedCellInfo();
    return sel?.day === day && sel?.period === period;
  }

  getSelectedEntry(): TimetableEntry | undefined {
    const sel = this.selectedCellInfo();
    if (!sel) return undefined;
    return this.getCellEntry(sel.day, sel.period);
  }

  drawSourceCanvas() {
    const canvas = this.sourceCanvasRef?.nativeElement;
    if (!canvas || !this.imageObj) return;

    canvas.width = this.imageObj.width || 800;
    canvas.height = this.imageObj.height || 500;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw base image
    ctx.drawImage(this.imageObj, 0, 0, canvas.width, canvas.height);

    const sel = this.selectedCellInfo();
    const g = this.stateService.grid();
    const days = this.stateService.days();
    const periods = this.stateService.periods();

    if (!g || !g.cells) return;

    // 2. Render mapped subject details directly onto each cell rectangle on the canvas
    g.cells.forEach((cell) => {
      // Map row/col to day/period
      const dayIdx = cell.row - 1;
      const periodIdx = cell.col - 1;

      if (dayIdx >= 0 && dayIdx < days.length && periodIdx >= 0 && periodIdx < periods.length) {
        const day = days[dayIdx];
        const period = periods[periodIdx];
        const entry = this.getCellEntry(day, period);

        if (entry) {
          const conf = entry.confidence;
          // Set fill color based on confidence score
          if (entry.isFreePeriod) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          } else if (conf >= 0.9) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; // Emerald
          } else if (conf >= 0.7) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'; // Amber
          } else {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.25)'; // Rose
          }

          ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
          ctx.strokeStyle = conf >= 0.9 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);

          // Render text label inside cell on canvas
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Inter, sans-serif';
          const text = entry.subject || 'Free';
          ctx.fillText(text.slice(0, 10), cell.x + 4, cell.y + 16);
        }
      }
    });

    // 3. Highlight currently selected cell with glowing border
    if (sel) {
      const cellBounds = g.cells.find((cell) => cell.row === sel.row && cell.col === sel.col);
      if (cellBounds) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.fillRect(cellBounds.x, cellBounds.y, cellBounds.width, cellBounds.height);
        ctx.strokeRect(cellBounds.x, cellBounds.y, cellBounds.width, cellBounds.height);
      }
    }
  }

  updateCropCanvas() {
    const cropCanvas = this.cropCanvasRef?.nativeElement;
    if (!cropCanvas || !this.imageObj) return;

    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    const sel = this.selectedCellInfo();
    const g = this.stateService.grid();

    if (sel && g && g.cells) {
      const cellBounds = g.cells.find((cell) => cell.row === sel.row && cell.col === sel.col);
      if (cellBounds) {
        cropCanvas.width = cellBounds.width || 120;
        cropCanvas.height = cellBounds.height || 60;

        ctx.drawImage(
          this.imageObj,
          cellBounds.x,
          cellBounds.y,
          cellBounds.width,
          cellBounds.height,
          0,
          0,
          cellBounds.width,
          cellBounds.height
        );
        return;
      }
    }

    cropCanvas.width = 160;
    cropCanvas.height = 80;
    ctx.drawImage(this.imageObj, 0, 0, 160, 80, 0, 0, 160, 80);
  }

  getCellEntry(day: string, period: number): TimetableEntry | undefined {
    return this.stateService.timetableEntries().find((e) => e.day === day && e.period === period);
  }

  getConfidenceBgClass(score: number, isFree?: boolean): string {
    if (isFree) return 'bg-slate-900/60 border-slate-800 text-slate-400';
    if (score >= 0.9) return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
    if (score >= 0.7) return 'bg-amber-950/40 border-amber-500/30 text-amber-300';
    return 'bg-rose-950/40 border-rose-500/30 text-rose-300';
  }

  getConfidenceBadgeClass(score: number): string {
    if (score >= 0.9) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    if (score >= 0.7) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
  }

  saveCellEdit() {
    const selCell = this.editingCell();
    if (!selCell) return;

    const chosenSubject = this.editSelectedSubject || this.editCustomSubject || selCell.subject;

    this.stateService.updateCellEntry(selCell.day, selCell.period, {
      subject: chosenSubject,
      verified: true,
    });

    this.editingCell.set(null);
    this.drawSourceCanvas();
  }

  addNewSubject() {
    if (!this.newSubjectName.trim()) return;
    this.stateService.addSubject({
      id: 'SUB_' + Date.now(),
      code: this.newSubjectCode || 'SUB',
      name: this.newSubjectName,
    });
    this.newSubjectCode = '';
    this.newSubjectName = '';
  }

  async proceedToStaff() {
    this.isExtractingStaff.set(true);
    try {
      const res = await this.apiService.extractStaff(this.stateService.subjects());
      this.stateService.setStaff(res.staff);
      this.stateService.setAssignments(res.assignments);
      this.stateService.setStep(7);
    } catch (err) {
      console.error('Error extracting staff:', err);
    } finally {
      this.isExtractingStaff.set(false);
    }
  }
}
