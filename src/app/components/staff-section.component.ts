import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { StaffService } from '../services/staff.service';
import { StaffMember, StaffPayload, StaffFilters, StaffRole } from '../core/staff/staff.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-staff-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">Gestión de Staff</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Administra los accesos y roles de tu equipo de trabajo.</p>
        </div>
        <button (click)="openComposer()" class="bg-primary-600 dark:bg-primary-500 text-white rounded-xl px-6 py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-all flex items-center gap-2 group shadow-xl shadow-primary-500/20 active:scale-95">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Nuevo Miembro
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm transition-colors">
        <form [formGroup]="searchForm" (ngSubmit)="loadStaff(1)" class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px] relative">
            <input type="text" formControlName="buscar" placeholder="Buscar por usuario o rol..." class="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-bg focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm font-bold text-slate-900 dark:text-white"/>
            <svg class="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button type="submit" class="h-12 px-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md active:scale-95">Filtrar Lista</button>
        </form>
      </div>

      <!-- Main List -->
      <div class="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] shadow-sm overflow-hidden transition-colors">
        @if (isLoading()) {
          <div class="p-24 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sincronizando equipo...</p>
          </div>
        } @else if (staff().length) {
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left">
              <thead class="bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-200 dark:border-dark-border transition-colors">
                <tr class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] transition-colors">
                  <th class="px-8 py-5">Usuario</th>
                  <th class="px-8 py-5">Rol</th>
                  <th class="px-8 py-5">Estado</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-dark-border transition-colors">
                @for (item of staff(); track item.id) {
                  <tr class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black transition-all shadow-sm group-hover:scale-110">
                          {{ item.usuario.substring(0, 2).toUpperCase() }}
                        </div>
                        <div class="flex flex-col">
                          <span class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 transition-colors">
                            {{ item.usuario }}
                            @if (item.principal) {
                              <span class="text-[8px] bg-primary-600 dark:bg-primary-500 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">Owner</span>
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{{ item.rol_nombre }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm" [ngClass]="item.estado === 'activo' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'">
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2 transition-all">
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600 dark:hover:border-primary-400 transition-all shadow-sm active:scale-95">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        @if (!item.principal) {
                          <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-slate-50/50 dark:bg-slate-950/50 p-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 transition-colors">
            <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
              Total: {{ pagination().total }} miembros registrados
            </span>
            <div class="flex gap-3">
              <button [disabled]="pagination().pagina_actual === 1" (click)="loadStaff(pagination().pagina_actual - 1)" class="h-10 px-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95 shadow-sm">Anterior</button>
              <button [disabled]="pagination().pagina_actual === pagination().paginas" (click)="loadStaff(pagination().pagina_actual + 1)" class="h-10 px-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95 shadow-sm">Siguiente</button>
            </div>
          </div>
        } @else {
          <div class="p-24 text-center">
            <div class="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors shadow-inner">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">Sin Resultados</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors max-w-xs mx-auto">No se encontraron miembros del equipo con los criterios seleccionados.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white dark:bg-dark-surface rounded-[3rem] shadow-2xl animate-zoom overflow-hidden transition-colors border border-slate-100 dark:border-dark-border">
            <div class="px-10 py-8 bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-100 dark:border-dark-border transition-colors flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">{{ editingId() ? 'Editar Miembro' : 'Nuevo Miembro' }}</h3>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Asigna credenciales y permisos de acceso</p>
              </div>
              <button (click)="closeComposer()" class="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-90">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form [formGroup]="staffForm" (ngSubmit)="submitStaff()" class="p-10 space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Nombre de Usuario <span class="text-primary-600">*</span></label>
                <input type="text" formControlName="usuario" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all text-sm" placeholder="Ej: juan.perez"/>
              </div>
              @if (!editingId()) {
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Contraseña de Acceso <span class="text-primary-600">*</span></label>
                  <input type="password" formControlName="contrasena" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all text-sm" placeholder="Mínimo 6 caracteres"/>
                </div>
              }
              <div class="grid gap-6" [ngClass]="editingId() ? 'grid-cols-2' : 'grid-cols-1'">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Rol en el Sistema <span class="text-primary-600">*</span></label>
                  <select formControlName="rol_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 transition-all text-sm">
                    <option [value]="null" disabled>Seleccionar Rol</option>
                    @for (rol of roles(); track rol.ID) {
                      <option [value]="rol.ID">{{ rol.Nombre | uppercase }}</option>
                    }
                  </select>
                </div>
                @if (editingId()) {
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Estado de la cuenta</label>
                    <select formControlName="estado" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 transition-all text-sm">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                }
              </div>
              <div class="flex gap-3 pt-8 border-t border-slate-100 dark:border-dark-border mt-8 transition-colors">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-all active:scale-95">Cancelar</button>
                <button type="submit" [disabled]="isSaving() || staffForm.invalid" class="flex-1 h-12 rounded-xl bg-primary-600 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50">
                  {{ isSaving() ? 'Guardando...' : 'Confirmar Registro' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (pendingDelete()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" (click)="pendingDelete.set(null)"></div>
          <div class="relative w-full max-w-sm bg-white dark:bg-dark-surface p-10 rounded-[2.5rem] shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-dark-border">
            <div class="h-20 w-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400 transition-colors shadow-sm">
              <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">¿Eliminar miembro?</h3>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3 mb-10 transition-colors">Esta acción eliminará el acceso de <b class="text-slate-900 dark:text-white">{{ pendingDelete()?.usuario }}</b> y no se puede deshacer permanentemente.</p>
            <div class="flex gap-3">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-all active:scale-95">Cancelar</button>
              <button (click)="confirmDelete()" class="flex-1 h-12 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95">Eliminar</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white' : 'bg-rose-50 border-rose-200 text-rose-800'">
            <div class="h-2 w-2 rounded-full animate-pulse" [ngClass]="f.tone === 'success' ? 'bg-primary-600 dark:bg-primary-400' : 'bg-rose-500'"></div>
            <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
          </div>
        </div>
      }
    </section>
  `
})
export class StaffSectionComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly fb = inject(FormBuilder);

  readonly staff = signal<StaffMember[]>([]);
  readonly roles = signal<StaffRole[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<StaffMember | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  // Pagination
  readonly pagination = signal({ total: 0, paginas: 1, pagina_actual: 1, por_pagina: 10 });

  readonly searchForm = this.fb.nonNullable.group({ buscar: '' });
  readonly staffForm = this.fb.nonNullable.group({
    usuario: ['', [Validators.required]],
    contrasena: ['', [Validators.minLength(6)]],
    rol_id: [null as number | null, [Validators.required]],
    estado: ['activo' as 'activo' | 'inactivo']
  });

  ngOnInit(): void { 
    this.loadRoles();
    this.loadStaff(); 
  }

  loadRoles(): void {
    this.staffService.getRoles().subscribe(roles => this.roles.set(roles));
  }

  loadStaff(pagina: number = 1): void {
    this.isLoading.set(true);
    const filters: StaffFilters = {
      ...this.searchForm.getRawValue(),
      pag: pagina
    };

    this.staffService.list(filters)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => {
        this.staff.set(res.datos);
        this.pagination.set(res.paginacion);
      });
  }

  openComposer(): void {
    this.editingId.set(null);
    this.staffForm.reset({ estado: 'activo' });
    this.staffForm.get('usuario')?.enable();
    this.isComposerOpen.set(true);
  }

  startEdit(item: StaffMember): void {
    this.editingId.set(item.id);
    this.staffForm.patchValue({
      usuario: item.usuario,
      rol_id: item.rol_id,
      estado: item.estado
    });
    this.staffForm.get('usuario')?.disable();
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitStaff(): void {
    if (this.staffForm.invalid) return;
    this.isSaving.set(true);
    
    const val = this.staffForm.getRawValue();
    
    if (this.editingId()) {
      const payload: Partial<StaffPayload> = {
        rol_id: Number(val.rol_id),
        estado: val.estado as any
      };
      this.staffService.update(this.editingId()!, payload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: () => {
            this.setFeedback('success', 'Staff actualizado.');
            this.closeComposer();
            this.loadStaff(this.pagination().pagina_actual);
          },
          error: (err) => this.setFeedback('error', err.error?.message || 'Error al actualizar')
        });
    } else {
      const payload: StaffPayload = {
        usuario: val.usuario,
        contrasena: val.contrasena,
        rol_id: Number(val.rol_id)
      };
      this.staffService.create(payload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: () => {
            this.setFeedback('success', 'Staff sincronizado.');
            this.closeComposer();
            this.loadStaff(1);
          },
          error: (err) => this.setFeedback('error', err.error?.message || 'Error al crear')
        });
    }
  }

  openDelete(item: StaffMember): void { 
    if (item.principal) {
      this.setFeedback('error', 'No se puede eliminar al usuario principal.');
      return;
    }
    this.pendingDelete.set(item); 
  }

  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;
    this.staffService.delete(target.id).subscribe({
      next: () => {
        this.setFeedback('success', 'Miembro eliminado.');
        this.pendingDelete.set(null);
        this.loadStaff(this.pagination().pagina_actual);
      },
      error: (err) => this.setFeedback('error', err.error?.message || 'Error al eliminar')
    });
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
