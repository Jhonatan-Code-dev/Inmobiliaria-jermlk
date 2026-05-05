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
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-slate-900 dark:border-white pl-4 transition-colors">Tickets de Mantenimiento</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Gestiona incidencias y reparaciones reportadas en las unidades.</p>
        </div>
        <button (click)="openComposer()" class="bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl px-5 py-3 font-bold text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center gap-2 group shadow-lg active:scale-95">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Abrir Ticket
        </button>
      </div>

      <!-- Main List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @if (isLoading()) {
          <div class="col-span-full p-20 flex flex-col items-center justify-center space-y-4">
             <div class="h-12 w-12 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin transition-colors"></div>
             <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">Buscando reportes...</p>
          </div>
        } @else if (tickets().length) {
          @for (t of tickets(); track t.id) {
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[1.5rem] space-y-4 hover:border-slate-900 dark:hover:border-white transition-all shadow-sm group">
               <div class="flex items-center justify-between">
                  <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors" [ngClass]="getPriorityClass(t.prioridad)">{{ t.prioridad }}</span>
                  <span class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase transition-colors">#{{ t.id }}</span>
               </div>
               <div>
                  <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{{ t.asunto }}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 transition-colors">{{ t.descripcion }}</p>
               </div>
               <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
                  <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase transition-colors">{{ t.estado }}</span>
                  <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="startEdit(t)" class="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    <button (click)="openDelete(t)" class="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
               </div>
            </div>
          }
        } @else {
          <div class="col-span-full p-20 text-center">
            <div class="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">Mantenimiento al día</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors">No hay tickets reportados actualmente.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden transition-colors">
            <div class="px-10 py-8 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
              <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">{{ editingId() ? 'Actualizar Ticket' : 'Abrir Nuevo Ticket' }}</h3>
            </div>
            <form [formGroup]="ticketForm" (ngSubmit)="submitTicket()" class="p-10 space-y-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Unidad ID <span class="text-slate-900 dark:text-white">*</span></label>
                <input type="number" formControlName="unidad_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-colors text-sm"/>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Asunto <span class="text-slate-900 dark:text-white">*</span></label>
                <input type="text" formControlName="asunto" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-white transition-colors text-sm"/>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Prioridad <span class="text-slate-900 dark:text-white">*</span></label>
                  <select formControlName="prioridad" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-slate-300 transition-colors text-sm">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Estado <span class="text-slate-900 dark:text-white">*</span></label>
                  <select formControlName="estado" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-900 dark:text-slate-300 transition-colors text-sm">
                    <option value="abierto">Abierto</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Descripción detallada <span class="text-slate-900 dark:text-white">*</span></label>
                <textarea formControlName="descripcion" class="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-slate-900 dark:text-white transition-colors text-sm h-32 resize-none custom-scrollbar"></textarea>
              </div>
              <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 transition-colors">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50">
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
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl animate-zoom text-center transition-colors">
            <div class="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 dark:text-white transition-colors">
                 <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">¿Eliminar Ticket?</h3>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 mb-8 transition-colors">Esta acción no se puede deshacer y el reporte se perderá.</p>
            <div class="flex gap-2">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cerrar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">Eliminar</button>
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
    if (p === 'alta') return 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white';
    if (p === 'media') return 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
