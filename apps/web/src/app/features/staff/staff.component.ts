import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { TimetableApiService } from '../../core/services/timetable-api.service';
import { Staff } from '@smart-timetable/shared-types';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <i class="pi pi-users"></i> Step 7: Staff Master (Excel Import, OCR & Edit)
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Teacher / Staff Master Information
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Import staff master from Excel (.xlsx/.csv), extract from separate image OCR, or manage staff records manually.
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
            (click)="proceedToAssignment()" 
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all"
          >
            <span>Next: Subject → Staff Assignment</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Info Banner: Optional Staff Details -->
      <div class="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-300">
        <i class="pi pi-info-circle text-amber-400 text-base shrink-0 mt-0.5"></i>
        <div>
          <strong class="font-bold text-amber-200">No Staff Details in Main Timetable Image?</strong>
          <p class="mt-0.5 text-slate-300">
            You can upload staff details directly via <strong>Excel (.xlsx/.csv)</strong> below, run OCR on a separate staff image, add/edit staff manually, or skip staff assignment for Excel export.
          </p>
        </div>
      </div>

      <!-- Dual Import Cards Grid (Excel Import & OCR Image Import) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Option A: Upload Staff Details via EXCEL / CSV Spreadsheet -->
        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="pi pi-file-excel text-emerald-400"></i> Import Staff via Excel (.xlsx / .csv)
            </h3>
            <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold border border-emerald-500/20">Instant Import</span>
          </div>

          <p class="text-xs text-slate-400">
            Upload an Excel file containing columns: <code class="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">Staff ID</code>, <code class="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">Staff Name</code>, <code class="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">Department</code>.
          </p>

          <div 
            (click)="excelFileInput.click()"
            class="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all flex flex-col items-center justify-center space-y-2 group"
          >
            <input 
              #excelFileInput 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              class="hidden" 
              (change)="onStaffExcelSelected($event)" 
            />

            <i class="pi pi-file-excel text-3xl text-emerald-400 group-hover:scale-110 transition-transform"></i>
            <div class="text-xs font-semibold text-white">
              Click to select Staff Master Excel / CSV File
            </div>
            <p class="text-[11px] text-slate-400">Supports XLSX, XLS, and CSV spreadsheets</p>
          </div>
        </div>

        <!-- Option B: Upload Staff Raw Image OCR -->
        <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="pi pi-camera text-brand-400"></i> OCR Separate Staff Image (JPG/PNG)
            </h3>
            <span class="text-[10px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded font-semibold border border-brand-500/20">OCR Scanner</span>
          </div>

          <p class="text-xs text-slate-400">
            Upload a separate photo/document image containing the printed teacher legend.
          </p>

          <div class="space-y-3">
            <div 
              (click)="staffFileInput.click()"
              class="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all flex items-center justify-center gap-3"
            >
              <input 
                #staffFileInput 
                type="file" 
                accept="image/jpeg,image/jpg,image/png" 
                class="hidden" 
                (change)="onStaffFileSelected($event)" 
              />

              <i class="pi pi-image text-2xl text-brand-400"></i>
              <div class="text-left">
                <div class="text-xs font-semibold text-white">
                  {{ staffFileName() ? staffFileName() : 'Select Staff Raw Image' }}
                </div>
                <div class="text-[10px] text-slate-400">JPG, JPEG, PNG format</div>
              </div>
            </div>

            <button 
              (click)="runStaffImageOCR()"
              [disabled]="!selectedStaffFile() || isExtractingStaffOCR()"
              class="w-full py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <i *ngIf="!isExtractingStaffOCR()" class="pi pi-sparkles"></i>
              <i *ngIf="isExtractingStaffOCR()" class="pi pi-spin pi-spinner"></i>
              <span>{{ isExtractingStaffOCR() ? 'Running Staff OCR...' : 'Run OCR on Staff Image' }}</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Add New Staff Bar & Table -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i class="pi pi-users text-emerald-400"></i> Staff Master Table ({{ stateService.staff().length }} Records)
          </h3>
          <span class="text-xs text-slate-400">Excel / OCR / Manual Entries</span>
        </div>

        <!-- Manual Add Form -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div class="md:col-span-3 space-y-1">
            <label class="text-xs font-semibold text-slate-400">Staff ID</label>
            <input type="text" [(ngModel)]="newStaffId" placeholder="e.g. STF011" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>

          <div class="md:col-span-4 space-y-1">
            <label class="text-xs font-semibold text-slate-400">Staff Name</label>
            <input type="text" [(ngModel)]="newStaffName" placeholder="e.g. Dr. A. Ramanathan" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>

          <div class="md:col-span-3 space-y-1">
            <label class="text-xs font-semibold text-slate-400">Department</label>
            <input type="text" [(ngModel)]="newStaffDept" placeholder="e.g. Computer Science" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white" />
          </div>

          <div class="md:col-span-2">
            <button 
              (click)="addStaffMember()" 
              class="w-full py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <i class="pi pi-user-plus"></i> Add Staff
            </button>
          </div>
        </div>

        <!-- Staff List Table -->
        <div class="overflow-x-auto border-t border-slate-800 pt-4">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3 px-4">Staff ID</th>
                <th class="py-3 px-4">Full Staff Name</th>
                <th class="py-3 px-4">Department / Subject</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let member of stateService.staff()" class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 font-mono font-bold text-brand-400 text-xs">
                  {{ member.staffId || member.id }}
                </td>
                <td class="py-3 px-4 font-semibold text-white">
                  {{ member.name }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-400">
                  <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                    {{ member.department || 'General' }}
                  </span>
                </td>
                
                <!-- Action Buttons: EDIT & DELETE -->
                <td class="py-3 px-4 text-right flex items-center justify-end gap-2">
                  <button 
                    (click)="openEditStaffModal(member)" 
                    class="p-1.5 text-brand-400 hover:text-brand-300 transition-colors font-medium text-xs flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20"
                    title="Edit Staff Member"
                  >
                    <i class="pi pi-pencil"></i> Edit
                  </button>

                  <button 
                    (click)="stateService.deleteStaff(member.id)" 
                    class="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Staff Member"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Edit Staff Floating Modal -->
      <div 
        *ngIf="editingStaff()" 
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i class="pi pi-pencil text-brand-400"></i> Edit Staff Record
            </h3>
            <button (click)="editingStaff.set(null)" class="text-slate-400 hover:text-white">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Staff ID / Code:</label>
              <input 
                type="text" 
                [(ngModel)]="editStaffId" 
                placeholder="e.g. STF001" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Full Staff Name:</label>
              <input 
                type="text" 
                [(ngModel)]="editStaffName" 
                placeholder="e.g. J. Crenad" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div class="space-y-1">
              <label class="font-semibold text-slate-300">Department / Subject Specialty:</label>
              <input 
                type="text" 
                [(ngModel)]="editStaffDept" 
                placeholder="e.g. Mathematics" 
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-medium outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button 
              (click)="saveStaffEdit()" 
              class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Save Changes
            </button>
            <button 
              (click)="editingStaff.set(null)" 
              class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class StaffComponent {
  readonly stateService = inject(TimetableStateService);
  readonly apiService = inject(TimetableApiService);

  readonly selectedStaffFile = signal<File | null>(null);
  readonly staffFileName = signal<string>('');
  readonly staffImagePreviewUrl = signal<string>('');
  readonly isExtractingStaffOCR = signal<boolean>(false);
  readonly editingStaff = signal<Staff | null>(null);

  newStaffId = '';
  newStaffName = '';
  newStaffDept = '';

  editStaffId = '';
  editStaffName = '';
  editStaffDept = '';

  onStaffExcelSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const newStaffList: Staff[] = [];
        json.forEach((row, idx) => {
          const keys = Object.keys(row);
          if (keys.length === 0) return;

          const idKey = keys.find((k) => /id|code/i.test(k)) || keys[0];
          const nameKey = keys.find((k) => /name|teacher|staff/i.test(k)) || keys[1] || keys[0];
          const deptKey = keys.find((k) => /dept|department|subject/i.test(k)) || keys[2];

          const name = String(row[nameKey] || '').trim();
          if (name) {
            newStaffList.push({
              id: 'STF_XLS_' + idx + '_' + Date.now(),
              staffId: String(row[idKey] || `STF${(idx + 1).toString().padStart(3, '0')}`).trim(),
              name: name,
              department: String(row[deptKey] || 'General').trim(),
            });
          }
        });

        if (newStaffList.length > 0) {
          const existing = this.stateService.staff();
          const merged = [...existing];
          newStaffList.forEach((st) => {
            if (!merged.some((m) => m.name.toLowerCase() === st.name.toLowerCase())) {
              merged.push(st);
            }
          });
          this.stateService.setStaff(merged);
          alert(`Successfully imported ${newStaffList.length} staff records from Excel!`);
        } else {
          alert('No valid staff records found in the uploaded file.');
        }
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv spreadsheet.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  onStaffFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedStaffFile.set(file);
      this.staffFileName.set(file.name);
      this.staffImagePreviewUrl.set(URL.createObjectURL(file));
    }
  }

  async runStaffImageOCR() {
    const file = this.selectedStaffFile();
    if (!file) return;

    this.isExtractingStaffOCR.set(true);
    try {
      const extractedStaff = await this.apiService.extractStaffFromImage(file);
      const existing = this.stateService.staff();
      
      const merged = [...existing];
      extractedStaff.forEach((st) => {
        if (!merged.some((m) => m.name.toLowerCase() === st.name.toLowerCase())) {
          merged.push(st);
        }
      });

      this.stateService.setStaff(merged);
    } catch (err) {
      console.error('Error extracting staff from image:', err);
    } finally {
      this.isExtractingStaffOCR.set(false);
    }
  }

  addStaffMember() {
    if (!this.newStaffName.trim()) return;

    const id = 'STF_' + Date.now();
    this.stateService.addStaff({
      id,
      staffId: this.newStaffId || `STF00${this.stateService.staff().length + 1}`,
      name: this.newStaffName,
      department: this.newStaffDept,
    });

    this.newStaffId = '';
    this.newStaffName = '';
    this.newStaffDept = '';
  }

  openEditStaffModal(member: Staff) {
    this.editingStaff.set(member);
    this.editStaffId = member.staffId || member.id;
    this.editStaffName = member.name;
    this.editStaffDept = member.department || '';
  }

  saveStaffEdit() {
    const target = this.editingStaff();
    if (!target) return;

    this.stateService.updateStaff(target.id, {
      staffId: this.editStaffId,
      name: this.editStaffName,
      department: this.editStaffDept,
    });

    this.editingStaff.set(null);
  }

  proceedToAssignment() {
    this.stateService.setStep(8);
  }
}
