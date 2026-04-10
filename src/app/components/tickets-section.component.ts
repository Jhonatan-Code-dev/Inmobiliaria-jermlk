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
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 border-l-8 border-orange-500 pl-4">Tickets de Mantenimiento</h2>
          <p class="text-slate-500 font-medium mt-1 ml-4">Gestiona incidencias y reparaciones reportadas en las unidades.</p>
        </div>
        <button (click)="openComposer()" class="btn-primary flex items-center gap-2 group">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Abrir Ticket
        </button>
      </div>

      <!-- Main List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @if (isLoading()) {
          <div class="col-span-full p-20 flex flex-col items-center justify-center space-y-4">
             <div class="h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (tickets().length) {
          @for (t of tickets(); track t.id) {
            <div class="premium-card p-6 space-y-4 hover:border-orange-200 transition-all group">
               <div class="flex items-center justify-between">
                  <span class="badge" [ngClass]="getPriorityClass(t.prioridad)">{{ t.prioridad }}</span>
                  <span class="text-[10px] font-black text-slate-400 uppercase">#{{ t.id }}</span>
               </div>
               <div>
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">{{ t.asunto }}</h3>
                  <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ t.descripcion }}</p>
               </div>
               <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">{{ t.estado }}</span>
                  <div class="flex gap-2">
                    <button (click)="startEdit(t)" class="text-slate-400 hover:text-slate-900 transition-colors"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    <button (click)="openDelete(t)" class="text-rose-400 hover:text-rose-600 transition-colors"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
               </div>
            </div>
          }
        } @else {
          <div class="col-span-full p-20 text-center">
            <p class="text-slate-500 font-bold uppercase tracking-widest">No hay tickets abiertos.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden">
            <div class="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingId() ? 'Actualizar Ticket' : 'Abrir Nuevo Ticket' }}</h3>
            </div>
            <form [formGroup]="ticketForm" (ngSubmit)="submitTicket()" class="p-10 space-y-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidad ID</label>
                <input type="number" formControlName="unidad_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Asunto</label>
                <input type="text" formControlName="asunto" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridad</label>
                  <select formControlName="prioridad" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                  <select formControlName="estado" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold">
                    <option value="abierto">Abierto</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción detallada</label>
                <textarea formControlName="descripcion" class="w-full p-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold h-32"></textarea>
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
            <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">¿Eliminar Ticket?</h3>
            <div class="flex gap-2 mt-8">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Cerrar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest">Eliminar</button>
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
       .subscribe(() => { this.setFeedback('success', 'Ticket actualizado.'); this.loadTickets(); });
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
    if (p === 'alta') return 'bg-rose-100 text-rose-700';
    if (p === 'media') return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
