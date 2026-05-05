import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, debounceTime } from 'rxjs';
import { PagosService } from '../services/pagos.service';
import { AuthService } from '../services/auth.service';
import { Pago, PagoPayload, PagoPendiente } from '../core/pagos/pagos.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-pagos-section',
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
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-slate-900 dark:border-white pl-4 transition-colors">Cobros</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Registro y control de cobros realizados a inquilinos.</p>
        </div>
        <div class="flex gap-2">
          <div class="relative">
             <input type="text" [formControl]="searchControl" placeholder="Buscar recibo, cliente..." class="w-full sm:w-64 h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"/>
             <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
               <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>
          </div>
          <button (click)="loadPendientes()" class="h-12 px-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-black uppercase text-xs tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shadow-sm">Ver Pendientes</button>
        </div>
      </div>

      <!-- Pendientes Area -->
      @if (pendientes().length) {
        <div class="bg-slate-50 dark:bg-slate-800 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 animate-zoom transition-colors shadow-sm">
           <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors">Pendientes del Mes</h3>
              <button (click)="pendientes.set([])" class="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @for (p of pendientes(); track p.alquiler_id) {
                <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-900 dark:hover:border-white transition-all shadow-sm group" (click)="openComposer(p)">
                   <div class="flex items-start justify-between">
                     <div>
                       <p class="text-xs font-black text-slate-900 dark:text-white transition-colors">{{ p.cliente }}</p>
                       <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed transition-colors">Vence: {{ p.fecha_vencimiento }}</p>
                     </div>
                     <div class="h-6 w-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
                     </div>
                   </div>
                   <p class="text-lg font-black text-slate-900 dark:text-white mt-1 transition-colors">S/. {{ p.monto }}</p>
                </div>
              }
           </div>
        </div>
      }

      <!-- Main List -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-sm overflow-hidden transition-colors">
        @if (isLoading()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin transition-colors"></div>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">Recuperando recibos...</p>
          </div>
        } @else if (pagos().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
                <tr class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">
                  <th class="px-8 py-5">Recibo</th>
                  <th class="px-8 py-5">Cliente</th>
                  <th class="px-8 py-5">Monto</th>
                  <th class="px-8 py-5">Fecha</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                @for (item of pagos(); track item.id) {
                  <tr class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <td class="px-8 py-6">
                      <span class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors">{{ item.numero_recibo }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors">{{ item.cliente || 'Desconocido' }}</p>
                      @if (item.unidad) {
                         <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5 transition-colors">Unidad: {{ item.unidad }}</p>
                      }
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-sm font-black text-slate-900 dark:text-white transition-colors">S/. {{ item.monto_pagado }}</span>
                    </td>
                    <td class="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors">
                      {{ item.fecha_pago }}
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-colors">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Página {{ pagination().pagina_actual }} de {{ pagination().paginas }}</p>
            <div class="flex gap-2">
               <button (click)="loadPagos(pagination().pagina_actual - 1)" [disabled]="pagination().pagina_actual <= 1" class="h-8 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">Anterior</button>
               <button (click)="loadPagos(pagination().pagina_actual + 1)" [disabled]="pagination().pagina_actual >= pagination().paginas" class="h-8 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">Siguiente</button>
            </div>
          </div>
        } @else {
          <div class="p-20 text-center">
            <div class="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin Cobros</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium">No se encontraron pagos registrados en el sistema.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden transition-colors">
            <div class="px-10 py-8 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
              <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{{ editingId() ? 'Editar Registro' : 'Registrar Pago' }}</h3>
            </div>
            <form [formGroup]="pagoForm" (ngSubmit)="submitPago()" class="p-10 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Alquiler ID <span class="text-slate-900 dark:text-white">*</span></label>
                  <input type="number" formControlName="alquiler_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-colors text-center"/>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Monto Pagado <span class="text-slate-900 dark:text-white">*</span></label>
                  <input type="number" formControlName="monto_pagado" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-colors text-center"/>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha Pago <span class="text-slate-900 dark:text-white">*</span></label>
                  <input type="date" formControlName="fecha_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-colors text-sm"/>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Mes (1-12) <span class="text-slate-900 dark:text-white">*</span></label>
                  <input type="number" formControlName="mes_correspondiente" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-colors text-center"/>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Método Operativo <span class="text-slate-900 dark:text-white">*</span></label>
                <select formControlName="metodo_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-slate-300 transition-colors text-sm">
                  <option value="efectivo">Efectivo Físico</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta (POS)</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nota u Objeto</label>
                <textarea formControlName="nota" class="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-slate-900 dark:text-white transition-colors text-sm h-24 resize-none custom-scrollbar"></textarea>
              </div>
              <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50">
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
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl animate-zoom text-center transition-colors">
            <div class="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 dark:text-white transition-colors">
                 <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">¿Anular Pago?</h3>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 mb-8">Esta acción no se puede deshacer y el recibo quedará invalidado.</p>
            <div class="flex gap-2">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cerrar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">Anular</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white' : 'bg-rose-50 border-rose-200 text-rose-800'">
            <div class="h-2 w-2 rounded-full animate-pulse" [ngClass]="f.tone === 'success' ? 'bg-slate-900 dark:bg-white' : 'bg-rose-500'"></div>
            <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
          </div>
        </div>
      }
    </section>
    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
    </style>
  `
})
export class PagosSectionComponent implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly empresa = this.authService.empresa;

  readonly pagos = signal<Pago[]>([]);
  readonly pendientes = signal<PagoPendiente[]>([]);
  readonly pagination = signal({ total: 0, paginas: 1, pagina_actual: 1, por_pagina: 10 });
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

  readonly searchControl = this.fb.control('');

  ngOnInit(): void { 
    this.loadPagos(1); 
    
    this.searchControl.valueChanges
      .pipe(debounceTime(400))
      .subscribe(() => this.loadPagos(1));
  }

  loadPagos(page: number = 1): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;
    this.isLoading.set(true);
    
    const buscar = this.searchControl.value || '';
    
    this.pagosService.list({ empresa_id: empresaId, pag: page, buscar })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => {
        this.pagos.set(res.datos);
        this.pagination.set(res.paginacion);
      });
  }

  loadPendientes(): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;
    this.pagosService.getPendientesMes(empresaId).subscribe(res => {
      this.pendientes.set(res);
      if (res.length === 0) {
        this.setFeedback('success', 'Excelente, no hay pagos pendientes registrados.');
      }
    });
  }

  openComposer(p?: PagoPendiente): void {
    this.editingId.set(null);
    this.pagoForm.reset({
      alquiler_id: p ? p.alquiler_id : 0,
      monto_pagado: p ? p.monto : 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'efectivo',
      mes_correspondiente: new Date().getMonth() + 1,
      nota: ''
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
       .subscribe(() => { 
         this.setFeedback('success', 'Pago sincronizado.'); 
         this.loadPagos(); 
         if (this.pendientes().length > 0) {
           this.loadPendientes();
         }
       });
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
