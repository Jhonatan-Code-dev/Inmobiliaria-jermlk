import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PagosService } from '../services/pagos.service';
import { Pago, PagoPayload, PagoPendiente } from '../core/pagos/pagos.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-pagos-section',
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
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 border-l-8 border-emerald-500 pl-4">Historial de Pagos</h2>
          <p class="text-slate-500 font-medium mt-1 ml-4">Registro y control de cobros realizados a inquilinos.</p>
        </div>
        <div class="flex gap-2">
          <button (click)="loadPendientes()" class="h-12 px-6 rounded-xl border border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">Ver Pendientes</button>
          <button (click)="openComposer()" class="btn-primary flex items-center gap-2 group">
            <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
            Registrar Pago
          </button>
        </div>
      </div>

      <!-- Pendientes Area -->
      @if (pendientes().length) {
        <div class="bg-amber-50 p-6 rounded-[1.5rem] border border-amber-100 animate-zoom">
           <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-black text-amber-900 uppercase tracking-widest">Pendientes del Mes</h3>
              <button (click)="pendientes.set([])" class="text-amber-700 hover:text-amber-900"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @for (p of pendientes(); track p.alquiler_id) {
                <div class="bg-white p-4 rounded-xl border border-amber-200">
                   <p class="text-xs font-black text-slate-900">{{ p.cliente }}</p>
                   <p class="text-[10px] font-bold text-slate-400 uppercase">Vence: {{ p.fecha_vencimiento }}</p>
                   <p class="text-lg font-black text-emerald-600 mt-1">$ {{ p.monto }}</p>
                </div>
              }
           </div>
        </div>
      }

      <!-- Main List -->
      <div class="premium-card overflow-hidden">
        @if (isLoading()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Recuperando recibos...</p>
          </div>
        } @else if (pagos().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th class="px-8 py-5">Recibo</th>
                  <th class="px-8 py-5">Cliente</th>
                  <th class="px-8 py-5">Monto</th>
                  <th class="px-8 py-5">Fecha</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (item of pagos(); track item.id) {
                  <tr class="group hover:bg-slate-50/80 transition-all">
                    <td class="px-8 py-6">
                      <span class="text-xs font-black text-slate-900 uppercase tracking-widest">{{ item.numero_recibo }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-xs font-bold text-slate-600">{{ item.cliente || 'Desconocido' }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-sm font-black text-emerald-600">$ {{ item.monto_pagado }}</span>
                    </td>
                    <td class="px-8 py-6 text-xs text-slate-500">
                      {{ item.fecha_pago }}
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all">
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
            <p class="text-slate-500 font-bold uppercase tracking-widest">No se encontraron pagos.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden">
            <div class="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingId() ? 'Editar Registro' : 'Registrar Pago' }}</h3>
            </div>
            <form [formGroup]="pagoForm" (ngSubmit)="submitPago()" class="p-10 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Alquiler ID</label>
                  <input type="number" formControlName="alquiler_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto Pagado</label>
                  <input type="number" formControlName="monto_pagado" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Pago</label>
                  <input type="date" formControlName="fecha_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Mes Correspondiente (1-12)</label>
                  <input type="number" formControlName="mes_correspondiente" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de Pago</label>
                <select formControlName="metodo_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold">
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Nota</label>
                <textarea formControlName="nota" class="w-full p-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold h-24"></textarea>
              </div>
              <div class="flex gap-3 pt-6">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl">
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
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="pendingDelete.set(null)"></div>
          <div class="relative w-full max-sm bg-white p-8 rounded-[2rem] shadow-2xl animate-zoom text-center">
            <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">¿Anular Pago?</h3>
            <p class="text-xs font-medium text-slate-500 mt-2">Esta acción no se puede deshacer y el recibo quedará invalidado.</p>
            <div class="flex gap-2 mt-8">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Cerrar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest">Confirmar Anulación</button>
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
export class PagosSectionComponent implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly fb = inject(FormBuilder);

  readonly pagos = signal<Pago[]>([]);
  readonly pendientes = signal<PagoPendiente[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Pago | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  readonly pagoForm = this.fb.nonNullable.group({
    alquiler_id: [0, [Validators.required]],
    monto_pagado: [0, [Validators.required]],
    fecha_pago: [new Date().toISOString().split('T')[0], [Validators.required]],
    metodo_pago: ['efectivo', [Validators.required]],
    mes_correspondiente: [new Date().getMonth() + 1, [Validators.required]],
    nota: ['']
  });

  ngOnInit(): void { this.loadPagos(); }

  loadPagos(): void {
    this.isLoading.set(true);
    this.pagosService.list({})
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => this.pagos.set(res.datos));
  }

  loadPendientes(): void {
    this.pagosService.getPendientesMes().subscribe(res => this.pendientes.set(res));
  }

  openComposer(): void {
    this.editingId.set(null);
    this.pagoForm.reset({
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      mes_correspondiente: new Date().getMonth() + 1
    });
    this.isComposerOpen.set(true);
  }

  startEdit(item: Pago): void {
    this.editingId.set(item.id);
    this.pagoForm.patchValue({
      alquiler_id: item.alquiler_id,
      monto_pagado: item.monto_pagado,
      fecha_pago: item.fecha_pago,
      metodo_pago: item.metodo_pago,
      mes_correspondiente: item.mes_correspondiente,
      nota: item.nota || ''
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitPago(): void {
    if (this.pagoForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.pagoForm.getRawValue() as any;
    const req = this.editingId() ? this.pagosService.update(this.editingId()!, payload) : this.pagosService.create(payload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); this.closeComposer(); }))
       .subscribe(() => { this.setFeedback('success', 'Pago sincronizado.'); this.loadPagos(); });
  }

  openDelete(item: Pago): void { this.pendingDelete.set(item); }
  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;
    this.pagosService.delete(target.id).subscribe(() => {
      this.setFeedback('success', 'Pago anulado.');
      this.pendingDelete.set(null);
      this.loadPagos();
    });
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
