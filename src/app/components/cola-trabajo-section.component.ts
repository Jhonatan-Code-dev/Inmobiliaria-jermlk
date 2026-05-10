import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { TicketsService } from '../services/tickets.service';
import { Ticket, TicketsFilters, TicketEstado } from '../core/tickets/tickets.models';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';

type FeedbackTone = 'success' | 'error';
interface Feedback { tone: FeedbackTone; message: string; }

@Component({
  selector: 'app-cola-trabajo-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cola-trabajo-section.component.html'
})
export class ColaTrabajoSectionComponent implements OnInit {
  private readonly ticketsService = inject(TicketsService);

  readonly tickets = signal<Ticket[] | null>(null);
  readonly isLoading = signal(false);
  readonly feedback = signal<Feedback | null>(null);

  ngOnInit(): void {
    this.loadCola();
  }

  loadCola(): void {
    this.isLoading.set(true);
    this.ticketsService.getColaTrabajo({}).subscribe({
      next: (data) => {
        this.tickets.set(data.datos);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar cola de trabajo'));
        this.isLoading.set(false);
      }
    });
  }

  updateStatus(id: number, nuevoEstado: string): void {
    this.ticketsService.cambiarEstado(id, nuevoEstado as TicketEstado).subscribe({
      next: () => {
        this.setFeedback('success', `Ticket actualizado a ${nuevoEstado}`);
        this.loadCola();
      },
      error: (err: any) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al actualizar estado'))
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
