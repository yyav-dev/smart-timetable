import {
  Component,
  inject,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { TimetableApiService } from '../../core/services/timetable-api.service';

@Component({
  selector: 'app-grid-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      <!-- Top Bar: Step Title & Actions -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-850 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-1">
            <i class="pi pi-table"></i> Steps 3-4: Grid Detection & Interactive Editor
          </span>
          <h2 class="text-xl sm:text-2xl font-bold text-white font-outfit">
            Visual Grid Editor
          </h2>
          <p class="text-slate-400 text-xs sm:text-sm">
            Drag grid lines, add/delete rows & columns, and select cells to verify coordinates.
          </p>
        </div>

        <!-- Grid Manipulation Toolbar -->
        <div class="flex flex-wrap items-center gap-2">
          <button 
            (click)="addHorizontalLine()" 
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <i class="pi pi-plus-circle text-brand-400"></i> Add Row Line
          </button>
          
          <button 
            (click)="addVerticalLine()" 
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <i class="pi pi-plus-circle text-emerald-400"></i> Add Col Line
          </button>

          <button 
            (click)="redetectGrid()" 
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <i class="pi pi-refresh"></i> Re-detect Grid
          </button>

          <div class="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

          <button 
            (click)="stateService.prevStep()" 
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <i class="pi pi-arrow-left"></i> Back
          </button>

          <button 
            (click)="proceedToTimeslots()" 
            class="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/20 flex items-center gap-1.5 transition-colors"
          >
            <span>Confirm Grid & Timeslots</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Main Canvas & Cell Details Split -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left 8 cols: Interactive Grid Canvas -->
        <div class="lg:col-span-8 bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center">
          
          <!-- Canvas container -->
          <div class="relative w-full max-h-[580px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2">
            <canvas 
              #gridCanvas 
              (mousedown)="onCanvasMouseDown($event)"
              (mousemove)="onCanvasMouseMove($event)"
              (mouseup)="onCanvasMouseUp()"
              (mouseleave)="onCanvasMouseUp()"
              class="max-w-full h-auto object-contain cursor-crosshair rounded shadow-md"
            ></canvas>
          </div>

          <div class="w-full flex items-center justify-between mt-3 px-2 text-xs text-slate-400">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-brand-500 inline-block"></span> Horizontal Lines (Rows)
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-emerald-500 inline-block"></span> Vertical Lines (Cols)
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 border border-amber-400 bg-amber-400/20 inline-block"></span> Selected Cell
              </span>
            </div>
            <span>Drag lines to adjust grid bounds</span>
          </div>

        </div>

        <!-- Right 4 cols: Grid Details & Inspector -->
        <div class="lg:col-span-4 space-y-4">
          
          <!-- Summary card -->
          <div class="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <i class="pi pi-info-circle text-brand-400"></i> Grid Statistics
            </h3>

            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div class="text-2xl font-extrabold text-brand-400">{{ rowsCount() }}</div>
                <div class="text-xs text-slate-400 font-medium mt-0.5">Rows (Days)</div>
              </div>
              <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div class="text-2xl font-extrabold text-emerald-400">{{ colsCount() }}</div>
                <div class="text-xs text-slate-400 font-medium mt-0.5">Columns (Periods)</div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div class="flex justify-between text-slate-300">
                <span>Header Row Index:</span>
                <span class="font-bold text-brand-300">Row 0</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>Day Name Column Index:</span>
                <span class="font-bold text-emerald-300">Column 0</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>Total Timetable Cells:</span>
                <span class="font-bold text-white">{{ (rowsCount() - 1) * (colsCount() - 1) }}</span>
              </div>
            </div>
          </div>

          <!-- Cell Inspector card -->
          <div class="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <i class="pi pi-search text-emerald-400"></i> Selected Cell Details
            </h3>

            <div *ngIf="selectedCell()" class="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-400">Row Number:</span>
                <span class="font-semibold text-white">Row {{ selectedCell()?.row }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Column Number:</span>
                <span class="font-semibold text-white">Column {{ selectedCell()?.col }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Position (X, Y):</span>
                <span class="font-mono text-brand-300">({{ selectedCell()?.x }}, {{ selectedCell()?.y }})</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Cell Size (W × H):</span>
                <span class="font-mono text-emerald-300">{{ selectedCell()?.width }} × {{ selectedCell()?.height }} px</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-slate-800">
                <span class="text-slate-400">OCR Extraction Status:</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">Ready</span>
              </div>
            </div>

            <div *ngIf="!selectedCell()" class="text-center py-6 text-slate-500 text-xs">
              Click on any cell inside the canvas to inspect its bounding coordinates.
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class GridEditorComponent implements AfterViewInit {
  readonly stateService = inject(TimetableStateService);
  readonly apiService = inject(TimetableApiService);

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly rowsCount = signal<number>(6);
  readonly colsCount = signal<number>(9);
  readonly selectedCell = signal<any | null>(null);

  private horizontalLines: number[] = [0, 80, 160, 240, 320, 400, 480];
  private verticalLines: number[] = [0, 90, 180, 270, 360, 450, 540, 630, 720, 810];
  private imageObj: HTMLImageElement | null = null;
  private draggingLineIndex: { type: 'horizontal' | 'vertical'; index: number } | null = null;

  constructor() {
    effect(() => {
      const g = this.stateService.grid();
      if (g) {
        this.rowsCount.set(g.rows);
        this.colsCount.set(g.cols);
      }
    });
  }

  ngAfterViewInit() {
    this.loadImageAndRender();
  }

  loadImageAndRender() {
    const url = this.stateService.processedImagePreviewUrl() || this.stateService.originalImagePreviewUrl();
    if (!url) return;

    this.imageObj = new Image();
    this.imageObj.onload = () => {
      this.initLines();
      this.drawCanvas();
    };
    this.imageObj.src = url;
  }

  initLines() {
    if (!this.imageObj) return;
    const w = this.imageObj.width || 800;
    const h = this.imageObj.height || 500;

    const g = this.stateService.grid();
    if (g && g.cells && g.cells.length > 0) {
      const hLinesSet = new Set<number>();
      const vLinesSet = new Set<number>();

      g.cells.forEach((c) => {
        hLinesSet.add(c.y);
        hLinesSet.add(c.y + c.height);
        vLinesSet.add(c.x);
        vLinesSet.add(c.x + c.width);
      });

      this.horizontalLines = Array.from(hLinesSet).sort((a, b) => a - b);
      this.verticalLines = Array.from(vLinesSet).sort((a, b) => a - b);
    } else {
      const rows = 6;
      const cols = 9;
      this.horizontalLines = Array.from({ length: rows + 1 }, (_, i) => Math.round((i * h) / rows));
      this.verticalLines = Array.from({ length: cols + 1 }, (_, i) => Math.round((i * w) / cols));
    }

    this.rowsCount.set(this.horizontalLines.length - 1);
    this.colsCount.set(this.verticalLines.length - 1);
  }

  drawCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.imageObj) return;

    canvas.width = this.imageObj.width || 800;
    canvas.height = this.imageObj.height || 500;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background image
    ctx.drawImage(this.imageObj, 0, 0, canvas.width, canvas.height);

    // Draw horizontal lines (Rows) - Brand Blue
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    this.horizontalLines.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });

    // Draw vertical lines (Cols) - Emerald Green
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    this.verticalLines.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    });

    // Highlight selected cell
    const sel = this.selectedCell();
    if (sel) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.fillRect(sel.x, sel.y, sel.width, sel.height);
      ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);
    }
  }

  onCanvasMouseDown(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    // Check if clicked near horizontal line
    for (let i = 0; i < this.horizontalLines.length; i++) {
      if (Math.abs(mouseY - this.horizontalLines[i]) < 8) {
        this.draggingLineIndex = { type: 'horizontal', index: i };
        return;
      }
    }

    // Check if clicked near vertical line
    for (let i = 0; i < this.verticalLines.length; i++) {
      if (Math.abs(mouseX - this.verticalLines[i]) < 8) {
        this.draggingLineIndex = { type: 'vertical', index: i };
        return;
      }
    }

    // Otherwise select cell
    for (let r = 0; r < this.horizontalLines.length - 1; r++) {
      for (let c = 0; c < this.verticalLines.length - 1; c++) {
        const x1 = this.verticalLines[c];
        const x2 = this.verticalLines[c + 1];
        const y1 = this.horizontalLines[r];
        const y2 = this.horizontalLines[r + 1];

        if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {
          this.selectedCell.set({
            row: r,
            col: c,
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1,
          });
          this.drawCanvas();
          return;
        }
      }
    }
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (!this.draggingLineIndex) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    if (this.draggingLineIndex.type === 'horizontal') {
      this.horizontalLines[this.draggingLineIndex.index] = Math.round(mouseY);
    } else {
      this.verticalLines[this.draggingLineIndex.index] = Math.round(mouseX);
    }

    this.drawCanvas();
  }

  onCanvasMouseUp() {
    if (this.draggingLineIndex) {
      this.draggingLineIndex = null;
      this.stateService.updateGridLines(this.horizontalLines, this.verticalLines);
    }
  }

  addHorizontalLine() {
    if (this.horizontalLines.length < 2) return;
    const lastY = this.horizontalLines[this.horizontalLines.length - 1];
    const prevY = this.horizontalLines[this.horizontalLines.length - 2];
    const newY = lastY + (lastY - prevY);

    this.horizontalLines.push(newY);
    this.rowsCount.set(this.horizontalLines.length - 1);
    this.drawCanvas();
    this.stateService.updateGridLines(this.horizontalLines, this.verticalLines);
  }

  addVerticalLine() {
    if (this.verticalLines.length < 2) return;
    const lastX = this.verticalLines[this.verticalLines.length - 1];
    const prevX = this.verticalLines[this.verticalLines.length - 2];
    const newX = lastX + (lastX - prevX);

    this.verticalLines.push(newX);
    this.colsCount.set(this.verticalLines.length - 1);
    this.drawCanvas();
    this.stateService.updateGridLines(this.horizontalLines, this.verticalLines);
  }

  async redetectGrid() {
    try {
      const res = await this.apiService.detectGrid(this.stateService.processedImagePreviewUrl() || '');
      this.stateService.setGrid(res.grid);
      this.initLines();
      this.drawCanvas();
    } catch (err) {
      console.error('Error re-detecting grid:', err);
    }
  }

  proceedToTimeslots() {
    this.stateService.setStep(4);
  }
}
