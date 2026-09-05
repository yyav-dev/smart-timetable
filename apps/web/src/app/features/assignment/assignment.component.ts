import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimetableStateService } from '../../core/services/timetable-state.service';
import { Subject, Staff } from '@smart-timetable/shared-types';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
            <i class="pi pi-user-plus"></i> Step 8: Subject → Multi-Staff Assignment
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold text-white font-outfit">
            Assign One or Multiple Teachers per Subject
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            Assign single or co-teachers (two or more staff) to any subject. Staff details are optional if omitted in raw data.
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
            (click)="proceedToValidation()" 
            class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all"
          >
            <span>Next: Timetable Validation</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Assignment Matrix Card -->
      <div class="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="py-3.5 px-4">Subject Name</th>
                <th class="py-3.5 px-4">Code</th>
                <th class="py-3.5 px-4">Assigned Teachers (Single or Co-Teachers)</th>
                <th class="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let sub of stateService.subjects()" class="hover:bg-slate-800/40 transition-colors">
                
                <!-- Subject Name -->
                <td class="py-3.5 px-4 font-bold text-white">
                  {{ sub.name }}
                </td>

                <!-- Code -->
                <td class="py-3.5 px-4">
                  <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs">
                    {{ sub.code || 'GEN' }}
                  </span>
                </td>

                <!-- Multi-Staff Selection -->
                <td class="py-3.5 px-4 space-y-2">
                  
                  <!-- Selected Staff Tags -->
                  <div class="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                    <span 
                      *ngFor="let stId of getAssignedStaffIds(sub.id)"
                      class="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <i class="pi pi-user text-[11px]"></i>
                      <span>{{ getStaffName(stId) }}</span>
                      <button (click)="removeStaffFromSubject(sub.id, stId)" class="text-brand-400 hover:text-rose-400 ml-1">
                        <i class="pi pi-times text-[10px]"></i>
                      </button>
                    </span>

                    <span *ngIf="getAssignedStaffIds(sub.id).length === 0" class="text-xs text-slate-500 italic">
                      No staff assigned (Optional)
                    </span>
                  </div>

                  <!-- Select Staff Dropdown to Add -->
                  <div class="flex items-center gap-2">
                    <select 
                      #staffSelect
                      (change)="addStaffToSubject(sub.id, staffSelect.value); staffSelect.value=''"
                      class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">+ Add Teacher / Co-Teacher...</option>
                      <option 
                        *ngFor="let st of stateService.staff()" 
                        [value]="st.id"
                        [disabled]="getAssignedStaffIds(sub.id).includes(st.id)"
                      >
                        {{ st.name }} ({{ st.staffId || st.id }})
                      </option>
                    </select>
                  </div>

                </td>

                <!-- Status Badge -->
                <td class="py-3.5 px-4 text-center">
                  <span 
                    *ngIf="getAssignedStaffIds(sub.id).length > 1"
                    class="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <i class="pi pi-users"></i> {{ getAssignedStaffIds(sub.id).length }} Co-Teachers
                  </span>
                  <span 
                    *ngIf="getAssignedStaffIds(sub.id).length === 1"
                    class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <i class="pi pi-check-circle"></i> Single Staff
                  </span>
                  <span 
                    *ngIf="getAssignedStaffIds(sub.id).length === 0"
                    class="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <i class="pi pi-minus-circle"></i> Optional
                  </span>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `,
})
export class AssignmentComponent {
  readonly stateService = inject(TimetableStateService);

  getAssignedStaffIds(subjectId: string): string[] {
    const assignment = this.stateService.assignments().find((a) => a.subjectId === subjectId);
    if (!assignment) return [];
    if (assignment.staffIds && assignment.staffIds.length > 0) {
      return assignment.staffIds;
    }
    return assignment.staffId ? [assignment.staffId] : [];
  }

  getStaffName(staffId: string): string {
    const st = this.stateService.staff().find((s) => s.id === staffId);
    return st?.name || staffId;
  }

  addStaffToSubject(subjectId: string, staffId: string) {
    if (!staffId) return;
    const current = this.getAssignedStaffIds(subjectId);
    if (!current.includes(staffId)) {
      const updated = [...current, staffId];
      this.saveSubjectAssignment(subjectId, updated);
    }
  }

  removeStaffFromSubject(subjectId: string, staffId: string) {
    const current = this.getAssignedStaffIds(subjectId);
    const updated = current.filter((id) => id !== staffId);
    this.saveSubjectAssignment(subjectId, updated);
  }

  private saveSubjectAssignment(subjectId: string, staffIds: string[]) {
    this.stateService.assignStaffToSubject(subjectId, staffIds);

    const subjectObj = this.stateService.subjects().find((sb) => sb.id === subjectId);
    if (!subjectObj) return;

    // Combine staff names for cell display (e.g., "J. Crenad / R. Bama Devi")
    const staffNames = staffIds
      .map((id) => this.getStaffName(id))
      .filter(Boolean)
      .join(' / ');

    const primaryStaffId = staffIds[0] || '';

    const entries = this.stateService.timetableEntries().map((e) => {
      if (e.subject === subjectObj.name) {
        return {
          ...e,
          staff: staffNames || undefined,
          staffId: primaryStaffId || undefined,
          staffIds,
        };
      }
      return e;
    });

    this.stateService.setTimetableEntries(entries);
  }

  proceedToValidation() {
    this.stateService.runValidation();
    this.stateService.setStep(9);
  }
}
