import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CargosService } from '../services/cargos.service';
import { Cargo, CargoPayload } from '../core/cargos/cargos.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-cargos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; --primary: #0f172a; --accent: #10b981; }
    .premium-card { background: white; border: 1px solid #f1f5f9; border-radius: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .btn-primary { background: var(--primary); color: white; border-radius: 0.75rem; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.2s; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 border-l-8 border-rose-500 pl-4">Gestión de Cargos</h2>
          <p class="text-slate-500 font-medium mt-1 ml-4">Administra deudas, penalizaciones y cargos adicionales.</p>
        </div>
        <button (click)="openComposer()" class="btn-primary flex items-center gap-2 group">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Nuevo Cargo
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <form [formGroup]="searchForm" (ngSubmit)="loadCargos()" class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px] relative">
            <input type="text" formControlName="buscar" placeholder="Buscar por concepto..." class="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all outline-none text-sm font-medium"/>
            <svg class="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button type="submit" class="h-12 px-8 rounded-xl bg-rose-500 text-white font-black uppercase text-xs tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95">Filtrar</button>
        </form>
      </div>

      <!-- Main List -->
      <div class="premium-card overflow-hidden">
        @if (isLoading()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando deudas...</p>
          </div>
        } @else if (cargos().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th class="px-8 py-5">Concepto</th>
                  <th class="px-8 py-5">Monto</th>
                  <th class="px-8 py-5">Estado</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (item of cargos(); track item.id) {
                  <tr class="group hover:bg-slate-50/80 transition-all">
                    <td class="px-8 py-6">
                      <span class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ item.concepto }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-sm font-black text-slate-900">$ {{ item.monto }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="badge" [ngClass]="getStatusClass(item.estado)">
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="p-20 text-center">
            <p class="text-slate-500 font-bold uppercase tracking-widest">No se encontraron cargos.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden">
            <div class="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingId() ? 'Editar Cargo' : 'Nuevo Cargo' }}</h3>
            </div>
            <form [formGroup]="cargoForm" (ngSubmit)="submitCargo()" class="p-10 space-y-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Contrato ID</label>
                <input type="number" formControlName="contrato_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Concepto</label>
                <input type="text" formControlName="concepto" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto</label>
                  <input type="number" formControlName="monto" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Vencimiento</label>
                  <input type="date" formControlName="fecha_vencimiento" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
              </div>
              <div class="flex gap-3 pt-6">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl">
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
            <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">¿Eliminar cargo?</h3>
            <div class="flex gap-2 mt-8">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Cancelar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Eliminar</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'">
            <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
          </div>
        </div>
      }
    </section>
  `
})
export class CargosSectionComponent implements OnInit {
  private readonly cargosService = inject(CargosService);
  private readonly fb = inject(FormBuilder);

  readonly cargos = signal<Cargo[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Cargo | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  readonly searchForm = this.fb.nonNullable.group({ buscar: '' });
  readonly cargoForm = this.fb.nonNullable.group({
    contrato_id: [0, [Validators.required]],
    monto: [0, [Validators.required]],
    concepto: ['', [Validators.required]],
    fecha_vencimiento: ['', [Validators.required]]
  });

  ngOnInit(): void { this.loadCargos(); }

  loadCargos(): void {
    this.isLoading.set(true);
    this.cargosService.list(this.searchForm.getRawValue())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => this.cargos.set(res.datos));
  }

  openComposer(): void {
    this.editingId.set(null);
    this.cargoForm.reset();
    this.isComposerOpen.set(true);
  }

  startEdit(item: Cargo): void {
    this.editingId.set(item.id);
    this.cargoForm.patchValue({
      contrato_id: item.contrato_id || 0,
      monto: item.monto,
      concepto: item.concepto,
      fecha_vencimiento: item.fecha_vencimiento?.split('T')[0] || ''
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitCargo(): void {
    if (this.cargoForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.cargoForm.getRawValue() as any;
    const req = this.editingId() ? this.cargosService.update(this.editingId()!, payload) : this.cargosService.create(payload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); this.closeComposer(); }))
       .subscribe(() => { this.setFeedback('success', 'Cargo sincronizado.'); this.loadCargos(); });
  }

  openDelete(item: Cargo): void { this.pendingDelete.set(item); }
  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;
    this.cargosService.delete(target.id).subscribe(() => {
      this.setFeedback('success', 'Cargo eliminado.');
      this.pendingDelete.set(null);
      this.loadCargos();
    });
  }

  getStatusClass(s: string): string {
    if (s === 'pagado') return 'bg-emerald-100 text-emerald-700';
    if (s === 'pendiente') return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
