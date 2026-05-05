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
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">Gestión de Cobros</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Registro y control de recaudación por arrendamientos.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <div class="relative group">
             <input type="text" [formControl]="searchControl" placeholder="Buscar recibo, cliente..." class="w-full sm:w-64 h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-bg outline-none text-xs font-bold text-slate-900 dark:text-white transition-all focus:bg-white dark:focus:bg-dark-bg focus:ring-2 focus:ring-primary-500"/>
             <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
               <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>
          </div>
          <button (click)="loadPendientes()" class="h-12 px-6 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-black uppercase text-[10px] tracking-widest hover:bg-primary-600 hover:text-white transition-all whitespace-nowrap active:scale-95 shadow-sm border border-primary-100 dark:border-primary-900/50">Recaudar Pendientes</button>
        </div>
      </div>

      <!-- Pendientes Area -->
      @if (pendientes().length) {
        <div class="bg-primary-50/50 dark:bg-dark-bg/50 p-8 rounded-[2.5rem] border border-primary-100 dark:border-dark-border animate-zoom transition-colors shadow-sm relative overflow-hidden">
           <div class="absolute top-0 right-0 p-8 opacity-5">
             <svg class="h-24 w-24 text-primary-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
           </div>
           <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] transition-colors">Cobros Pendientes del Mes</h3>
                <p class="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-1">Selecciona una tarjeta para registrar el pago</p>
              </div>
              <button (click)="pendientes.set([])" class="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg></button>
           </div>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              @for (p of pendientes(); track p.alquiler_id) {
                <div class="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-dark-border cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-all shadow-sm group hover:shadow-xl hover:shadow-primary-500/10 active:scale-95" (click)="openComposer(p)">
                   <div class="flex items-start justify-between mb-4">
                     <div class="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white transition-colors shadow-sm">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                     </div>
                     <span class="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md">Por pagar</span>
                   </div>
                   <p class="text-sm font-black text-slate-900 dark:text-white transition-colors group-hover:text-primary-600 truncate">{{ p.cliente }}</p>
                   <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] mt-0.5">Vence: {{ p.fecha_vencimiento }}</p>
                   <div class="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                     <p class="text-xl font-black text-slate-950 dark:text-white transition-colors">S/. {{ p.monto }}</p>
                     <div class="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
                     </div>
                   </div>
                </div>
              }
           </div>
        </div>
      }

      <!-- Main List -->
      <div class="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] shadow-sm overflow-hidden transition-colors">
        @if (isLoading()) {
          <div class="p-24 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin transition-colors"></div>
            <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sincronizando registros...</p>
          </div>
        } @else if (pagos().length) {
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left">
              <thead class="bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-200 dark:border-dark-border transition-colors">
                <tr class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] transition-colors">
                  <th class="px-8 py-5">Recibo #</th>
                  <th class="px-8 py-5">Cliente Beneficiario</th>
                  <th class="px-8 py-5">Monto Recaudado</th>
                  <th class="px-8 py-5">Fecha Operación</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-dark-border transition-colors">
                @for (item of pagos(); track item.id) {
                  <tr class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <td class="px-8 py-6">
                      <span class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{{ item.numero_recibo }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <p class="text-sm font-black text-slate-800 dark:text-slate-200 transition-colors group-hover:text-primary-600 transition-colors">{{ item.cliente || 'No identificado' }}</p>
                      @if (item.unidad) {
                         <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 transition-colors">Unidad: {{ item.unidad }}</p>
                      }
                    </td>
                    <td class="px-8 py-6">
                      <div class="flex flex-col">
                        <span class="text-base font-black text-emerald-600 dark:text-emerald-400 transition-colors">S/. {{ item.monto_pagado }}</span>
                        <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest">{{ item.metodo_pago }}</span>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <div class="text-[10px] font-black text-slate-500 dark:text-slate-400 transition-colors bg-slate-50 dark:bg-slate-800/50 w-fit px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                        {{ item.fecha_pago }}
                      </div>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="p-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors bg-slate-50/30 dark:bg-slate-950/30">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Página {{ pagination().pagina_actual }} de {{ pagination().paginas }}</p>
            <div class="flex gap-3">
               <button (click)="loadPagos(pagination().pagina_actual - 1)" [disabled]="pagination().pagina_actual <= 1" class="h-10 px-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 active:scale-95 shadow-sm transition-all">Anterior</button>
               <button (click)="loadPagos(pagination().pagina_actual + 1)" [disabled]="pagination().pagina_actual >= pagination().paginas" class="h-10 px-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 active:scale-95 shadow-sm transition-all">Siguiente</button>
            </div>
          </div>
        } @else {
          <div class="p-24 text-center">
            <div class="h-24 w-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors shadow-inner">
               <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">Sin Cobros Registrados</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors max-w-xs mx-auto">No se han encontrado recaudaciones recientes en este periodo.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white dark:bg-dark-surface rounded-[3rem] shadow-2xl animate-zoom overflow-hidden transition-colors border border-slate-100 dark:border-dark-border">
            <div class="px-10 py-8 bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-100 dark:border-dark-border transition-colors flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{{ editingId() ? 'Editar Recibo' : 'Emitir Recibo de Pago' }}</h3>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Completa los detalles de la transacción</p>
              </div>
              <button (click)="closeComposer()" class="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-90">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form [formGroup]="pagoForm" (ngSubmit)="submitPago()" class="p-10 space-y-6">
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">ID Alquiler <span class="text-primary-600">*</span></label>
                  <input type="number" formControlName="alquiler_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-950 dark:text-white transition-all focus:ring-2 focus:ring-primary-500 text-center"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Monto (S/.) <span class="text-emerald-600">*</span></label>
                  <input type="number" formControlName="monto_pagado" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-black text-emerald-600 dark:text-emerald-400 transition-all focus:ring-2 focus:ring-emerald-500 text-center text-lg"/>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Fecha Recibo <span class="text-primary-600">*</span></label>
                  <input type="date" formControlName="fecha_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500 text-sm"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Mes Aplicado <span class="text-primary-600">*</span></label>
                  <input type="number" formControlName="mes_correspondiente" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500 text-center"/>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Vía de Recaudación <span class="text-primary-600">*</span></label>
                <select formControlName="metodo_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-slate-300 transition-all focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="efectivo">Efectivo Físico</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Pago con Tarjeta</option>
                  <option value="otro">Otros Canales</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Observaciones</label>
                <textarea formControlName="nota" placeholder="Detalles adicionales sobre el cobro..." class="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500 text-sm h-24 resize-none custom-scrollbar"></textarea>
              </div>
              <div class="flex gap-4 pt-8 border-t border-slate-100 dark:border-slate-800 transition-colors mt-4">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Cerrar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-primary-600 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50">
                  {{ isSaving() ? 'Procesando...' : 'Confirmar Recibo' }}
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
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-slate-800">
            <div class="h-20 w-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400 shadow-sm transition-colors">
                 <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">¿Anular Recibo?</h3>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3 mb-10 transition-colors leading-relaxed">Esta acción es irreversible y el registro de recaudación quedará invalidado permanentemente.</p>
            <div class="flex gap-3">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Regresar</button>
              <button (click)="confirmDelete()" class="flex-1 h-12 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95">Anular</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xl shadow-primary-500/10' : 'bg-rose-50 border-rose-200 text-rose-800 shadow-xl shadow-rose-500/10'">
            <div class="h-2 w-2 rounded-full animate-pulse" [ngClass]="f.tone === 'success' ? 'bg-primary-600 dark:bg-primary-400' : 'bg-rose-500'"></div>
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
