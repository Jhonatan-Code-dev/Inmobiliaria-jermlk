import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TicketsService } from '../services/tickets.service';
import { Ticket, TicketPayload } from '../core/tickets/tickets.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-tickets-section',
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
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">Tickets de Mantenimiento</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Gestiona incidencias y reparaciones reportadas en las unidades.</p>
        </div>
        <button (click)="openComposer()" class="bg-primary-600 dark:bg-primary-500 text-white rounded-xl px-6 py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-all flex items-center gap-2 group shadow-xl shadow-primary-500/20 active:scale-95">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Abrir Ticket
        </button>
      </div>

      <!-- Main List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @if (isLoading()) {
          <div class="col-span-full p-24 flex flex-col items-center justify-center space-y-4">
             <div class="h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
             <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sincronizando reportes...</p>
          </div>
        } @else if (tickets().length) {
          @for (t of tickets(); track t.id) {
            <div class="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-8 rounded-[2.5rem] space-y-5 hover:border-primary-500 dark:hover:border-primary-400 transition-all shadow-sm hover:shadow-xl hover:shadow-primary-500/5 group relative overflow-hidden">
               <div class="absolute top-0 left-0 w-2 h-full transition-colors" [ngClass]="{
                 'bg-rose-500': t.prioridad === 'alta',
                 'bg-amber-500': t.prioridad === 'media',
                 'bg-emerald-500': t.prioridad === 'baja'
               }"></div>
               <div class="flex items-center justify-between">
                  <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm" [ngClass]="getPriorityClass(t.prioridad)">{{ t.prioridad }}</span>
                  <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Ticket #{{ t.id }}</span>
               </div>
               <div>
                  <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ t.asunto }}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed transition-colors">{{ t.descripcion }}</p>
               </div>
               <div class="pt-5 border-t border-slate-100 dark:border-dark-border flex items-center justify-between transition-colors">
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full" [ngClass]="t.estado === 'abierto' ? 'bg-primary-500 animate-pulse' : 'bg-slate-400'"></div>
                    <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{{ t.estado }}</span>
                  </div>
                  <div class="flex gap-2 transition-all">
                    <button (click)="startEdit(t)" class="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm active:scale-95"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    <button (click)="openDelete(t)" class="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm active:scale-95"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
               </div>
            </div>
          }
        } @else {
          <div class="col-span-full p-24 text-center">
            <div class="h-24 w-24 bg-slate-50 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors shadow-inner">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">Mantenimiento al día</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors max-w-xs mx-auto">No hay tickets reportados actualmente en el sistema.</p>
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
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">{{ editingId() ? 'Actualizar Ticket' : 'Abrir Nuevo Ticket' }}</h3>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Reporta un incidente o solicitud técnica</p>
              </div>
              <button (click)="closeComposer()" class="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-90">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form [formGroup]="ticketForm" (ngSubmit)="submitTicket()" class="p-10 space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Unidad afectada ID</label>
                <input type="number" formControlName="unidad_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm focus:ring-2 focus:ring-primary-500"/>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Asunto del reporte</label>
                <input type="text" formControlName="asunto" placeholder="Ej: Fuga de agua en baño..." class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm focus:ring-2 focus:ring-primary-500"/>
              </div>
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Nivel de Prioridad</label>
                  <select formControlName="prioridad" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-slate-300 transition-all text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="baja">Prioridad Baja</option>
                    <option value="media">Prioridad Media</option>
                    <option value="alta">Prioridad Alta</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Estado actual</label>
                  <select formControlName="estado" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-slate-300 transition-all text-sm focus:ring-2 focus:ring-primary-500">
                    <option value="abierto">Abierto / Pendiente</option>
                    <option value="en_proceso">En Resolución</option>
                    <option value="cerrado">Cerrado / Resuelto</option>
                  </select>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Descripción detallada</label>
                <textarea formControlName="descripcion" placeholder="Describe el problema con el mayor detalle posible..." class="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-slate-900 dark:text-white transition-all text-sm h-32 resize-none custom-scrollbar focus:ring-2 focus:ring-primary-500"></textarea>
              </div>
              <div class="flex gap-3 pt-8 border-t border-slate-100 dark:border-slate-800 mt-8 transition-colors">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-primary-600 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50">
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
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-slate-800">
            <div class="h-20 w-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400 transition-colors shadow-sm">
                 <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">¿Eliminar Ticket?</h3>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3 mb-10 transition-colors">Esta acción no se puede deshacer y el reporte de incidencia se perderá permanentemente.</p>
            <div class="flex gap-3">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Cancelar</button>
              <button (click)="confirmDelete()" class="flex-1 h-12 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95">Confirmar</button>
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
    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
    </style>
  `
})
export class TicketsSectionComponent implements OnInit {
  private readonly ticketsService = inject(TicketsService);
  private readonly fb = inject(FormBuilder);

  readonly tickets = signal<Ticket[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Ticket | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  readonly ticketForm = this.fb.nonNullable.group({
    unidad_id: [0, [Validators.required]],
    asunto: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    prioridad: ['media', [Validators.required]],
    estado: ['abierto']
  });

  ngOnInit(): void { this.loadTickets(); }

  loadTickets(): void {
    this.isLoading.set(true);
    this.ticketsService.list({})
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => this.tickets.set(res.datos));
  }

  openComposer(): void {
    this.editingId.set(null);
    this.ticketForm.reset({ prioridad: 'media', estado: 'abierto' });
    this.isComposerOpen.set(true);
  }

  startEdit(item: Ticket): void {
    this.editingId.set(item.id);
    this.ticketForm.patchValue({
      unidad_id: item.unidad_id,
      asunto: item.asunto,
      descripcion: item.descripcion,
      prioridad: item.prioridad,
      estado: item.estado
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitTicket(): void {
    if (this.ticketForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.ticketForm.getRawValue() as any;
    const req = this.editingId() ? this.ticketsService.update(this.editingId()!, payload) : this.ticketsService.create(payload as TicketPayload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); this.closeComposer(); }))
       .subscribe(() => { this.setFeedback('success', 'Ticket sincronizado.'); this.loadTickets(); });
  }

  openDelete(item: Ticket): void { this.pendingDelete.set(item); }
  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;
    this.ticketsService.delete(target.id).subscribe(() => {
      this.setFeedback('success', 'Ticket eliminado.');
      this.pendingDelete.set(null);
      this.loadTickets();
    });
  }

  getPriorityClass(p: string): string {
    if (p === 'alta') return 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
    if (p === 'media') return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
