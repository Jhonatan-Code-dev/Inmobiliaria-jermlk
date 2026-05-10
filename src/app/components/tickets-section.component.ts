import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { TicketsService } from '../services/tickets.service';
import { 
  Ticket, 
  TicketPayload, 
  TicketsFilters, 
  TicketEstado, 
  TicketsResumen,
  TicketsConfig 
} from '../core/tickets/tickets.models';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import { AuthService } from '../services/auth.service';

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
  templateUrl: './tickets-section.component.html'
})
export class TicketsSectionComponent implements OnInit {
  private readonly ticketsService = inject(TicketsService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly tickets = signal<Ticket[] | null>([]);
  readonly resumen = signal<TicketsResumen | null>(null);
  readonly config = signal<TicketsConfig | null>(null);
  readonly unidades = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Ticket | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  readonly filterForm = this.fb.group({
    buscar: [''],
    estado: [''],
    propiedad_id: [null as number | null]
  });

  readonly ticketForm = this.fb.nonNullable.group({
    inmueble_id: [null as number | null],
    unidad_id: [0, [Validators.required]],
    cliente_id: [null as number | null],
    asunto: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    prioridad: ['media' as any, [Validators.required]],
    estado: ['abierto' as TicketEstado]
  });

  readonly totalPaginas = signal(1); // Placeholder for now if pagination is used later

  ngOnInit(): void {
    this.loadTickets();
    this.loadResumen();

    // Filtro reactivo con debounce
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.loadTickets();
      this.loadResumen();
    });

    // Escuchar cambios en inmueble_id para cargar unidades
    this.ticketForm.get('inmueble_id')?.valueChanges.subscribe(id => {
      const empresaId = this.authService.empresaId();
      if (id && empresaId) {
        this.loadUnidades(id, empresaId);
      } else {
        this.unidades.set([]);
      }
    });
  }

  loadUnidades(inmuebleId: number, empresaId: number): void {
    this.ticketsService.getUnidadesByInmueble(inmuebleId, empresaId).subscribe({
      next: (data) => this.unidades.set(data),
      error: () => this.unidades.set([])
    });
  }

  loadConfig(): void {
    this.ticketsService.getConfigFormulario().subscribe({
      next: (res) => this.config.set(res),
      error: (err) => this.setFeedback('error', 'No se pudieron cargar los catálogos')
    });
  }

  loadTickets(): void {
    this.isLoading.set(true);
    const filters: TicketsFilters = {
      buscar: this.filterForm.value.buscar || undefined,
      estado: (this.filterForm.value.estado as TicketEstado) || undefined,
      propiedad_id: this.filterForm.value.propiedad_id || undefined
    };

    this.ticketsService.list(filters)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.tickets.set(res.datos),
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar historial'))
      });
  }

  loadResumen(): void {
    const propId = this.filterForm.value.propiedad_id || undefined;
    this.ticketsService.getResumen(propId).subscribe({
      next: (res) => this.resumen.set(res),
      error: () => this.resumen.set(null)
    });
  }

  updateStatus(id: number, newStatus: TicketEstado): void {
    this.ticketsService.cambiarEstado(id, newStatus).subscribe({
      next: () => {
        this.setFeedback('success', 'Estado actualizado.');
        this.loadTickets();
        this.loadResumen();
      },
      error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo cambiar el estado'))
    });
  }

  openComposer(): void {
    this.editingId.set(null);
    this.ticketForm.reset({ prioridad: 'media', estado: 'abierto' });
    this.loadConfig();
    this.isComposerOpen.set(true);
  }

  startEdit(item: Ticket): void {
    this.editingId.set(item.id);
    this.loadConfig();
    this.ticketForm.patchValue({
      unidad_id: item.unidad_id,
      cliente_id: item.cliente_id,
      asunto: item.asunto,
      descripcion: item.descripcion,
      prioridad: item.prioridad,
      estado: item.estado
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    
    const raw = this.ticketForm.getRawValue();
    const isEdit = !!this.editingId();

    // Preparar el payload limpio y con tipos correctos
    const payload: any = {
      unidad_id: Number(raw.unidad_id),
      cliente_id: raw.cliente_id ? Number(raw.cliente_id) : null,
      asunto: raw.asunto,
      descripcion: raw.descripcion,
      prioridad: raw.prioridad
    };

    // Solo enviamos el estado si es una edición
    if (isEdit) {
      payload.estado = raw.estado;
    }

    const req = isEdit
      ? this.ticketsService.update(this.editingId()!, payload) 
      : this.ticketsService.create(payload as TicketPayload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); }))
       .subscribe({
         next: () => {
           this.setFeedback('success', 'Ticket sincronizado.');
           this.closeComposer();
           this.loadTickets();
           this.loadResumen();
         },
         error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al guardar ticket'))
       });
  }

  openDelete(item: Ticket): void { this.pendingDelete.set(item); }
  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;
    this.ticketsService.delete(target.id).subscribe({
      next: () => {
        this.setFeedback('success', 'Ticket eliminado.');
        this.pendingDelete.set(null);
        this.loadTickets();
        this.loadResumen();
      },
      error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al eliminar ticket'))
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
