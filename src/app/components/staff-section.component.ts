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
    :host { display: block; --primary: #0f172a; --accent: #10b981; }
    .premium-card { background: white; border: 1px solid #f1f5f9; border-radius: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05); }
    .btn-primary { background: var(--primary); color: white; border-radius: 0.75rem; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.2s; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 border-l-8 border-indigo-500 pl-4">Gestión de Staff</h2>
          <p class="text-slate-500 font-medium mt-1 ml-4">Administra los accesos y roles de tu equipo de trabajo.</p>
        </div>
        <button (click)="openComposer()" class="btn-primary flex items-center gap-2 group">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Nuevo Miembro
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <form [formGroup]="searchForm" (ngSubmit)="loadStaff(1)" class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px] relative">
            <input type="text" formControlName="buscar" placeholder="Buscar por usuario o rol..." class="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium"/>
            <svg class="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button type="submit" class="h-12 px-8 rounded-xl bg-indigo-500 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95">Filtrar</button>
        </form>
      </div>

      <!-- Main List -->
      <div class="premium-card overflow-hidden">
        @if (isLoading()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando equipo...</p>
          </div>
        } @else if (staff().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th class="px-8 py-5">Usuario</th>
                  <th class="px-8 py-5">Rol</th>
                  <th class="px-8 py-5">Estado</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (item of staff(); track item.id) {
                  <tr class="group hover:bg-slate-50/80 transition-all">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                          {{ item.usuario.substring(0, 2).toUpperCase() }}
                        </div>
                        <div class="flex flex-col">
                          <span class="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            {{ item.usuario }}
                            @if (item.principal) {
                              <span class="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200">Owner</span>
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-xs font-bold text-slate-600 uppercase">{{ item.rol_nombre }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="badge" [ngClass]="item.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        @if (!item.principal) {
                          <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
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
          <div class="bg-slate-50/50 p-6 flex items-center justify-between border-t border-slate-100">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total: {{ pagination().total }} miembros
            </span>
            <div class="flex gap-2">
              <button [disabled]="pagination().pagina_actual === 1" (click)="loadStaff(pagination().pagina_actual - 1)" class="h-9 px-4 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Anterior</button>
              <button [disabled]="pagination().pagina_actual === pagination().paginas" (click)="loadStaff(pagination().pagina_actual + 1)" class="h-9 px-4 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        } @else {
          <div class="p-20 text-center">
            <p class="text-slate-500 font-bold uppercase tracking-widest">No se encontraron miembros.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden">
            <div class="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingId() ? 'Editar Miembro' : 'Nuevo Miembro' }}</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completa los datos del personal</p>
            </div>
            <form [formGroup]="staffForm" (ngSubmit)="submitStaff()" class="p-10 space-y-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario</label>
                <input type="text" formControlName="usuario" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" placeholder="Ex: juan.perez"/>
              </div>
              @if (!editingId()) {
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña</label>
                  <input type="password" formControlName="contrasena" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" placeholder="••••••••"/>
                </div>
              }
              <div class="grid gap-4" [ngClass]="editingId() ? 'grid-cols-2' : 'grid-cols-1'">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</label>
                  <select formControlName="rol_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm">
                    <option [value]="null" disabled>Seleccionar Rol</option>
                    @for (rol of roles(); track rol.ID) {
                      <option [value]="rol.ID">{{ rol.Nombre | titlecase }}</option>
                    }
                  </select>
                </div>
                @if (editingId()) {
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                    <select formControlName="estado" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                }
              </div>
              <div class="flex gap-3 pt-6">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" [disabled]="isSaving() || staffForm.invalid" class="flex-1 h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 disabled:bg-slate-300 disabled:shadow-none transition-all">
                  {{ isSaving() ? 'Guardando...' : 'Confirmar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (pendingDelete()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="pendingDelete.set(null)"></div>
          <div class="relative w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl animate-zoom text-center">
            <div class="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
              <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">¿Eliminar miembro?</h3>
            <p class="text-xs font-medium text-slate-500 mt-2 mb-8 uppercase tracking-tight">Esta acción eliminará el acceso de <b>{{ pendingDelete()?.usuario }}</b> y no se puede deshacer.</p>
            <div class="flex gap-2">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'">
            <div class="h-2 w-2 rounded-full" [ngClass]="f.tone === 'success' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
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
            this.setFeedback('success', 'Staff creado con éxito.');
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
