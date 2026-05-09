import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import { AuthService } from '../services/auth.service';
import { AsistenciaService } from '../services/asistencia.service';
import {
  AsistenciaRegistro,
  AsistenciaFiltros
} from '../core/asistencia/asistencia.models';

type FeedbackTone = 'success' | 'error';

@Component({
  selector: 'app-asistencia-supervision-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asistencia-supervision-content.component.html',
  styles: [`
    :host { display: block; }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AsistenciaSupervisionContentComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;
  readonly feedback = signal<{ tone: FeedbackTone, message: string } | null>(null);

  // --- Reporte de Asistencia ---
  readonly registros = signal<AsistenciaRegistro[]>([]);
  readonly isLoading = signal(false);
  readonly pagination = signal({
    total: 0,
    pagina: 1,
    limite: 15
  });

  // Modal Eliminar
  readonly isDeleteModalOpen = signal(false);
  readonly registroToDeleteId = signal<number | null>(null);
  readonly isDeleting = signal(false);
  
  readonly totalPaginas = computed(() => Math.ceil(this.pagination().total / this.pagination().limite));

  // Filtros
  readonly filterForm = this.formBuilder.group({
    buscar: [''],
    estado: [''],
    desde: [''],
    hasta: ['']
  });

  ngOnInit(): void {
    this.loadReporte(1);
  }

  private setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 4000);
  }

  loadReporte(page: number): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.isLoading.set(true);
    const formVal = this.filterForm.value;
    
    const filtros: AsistenciaFiltros = {
      empresa_id: empresaId,
      pag: page,
      limite: this.pagination().limite,
      buscar: formVal.buscar || undefined,
      estado: formVal.estado || undefined,
      desde: formVal.desde || undefined,
      hasta: formVal.hasta || undefined
    };

    this.asistenciaService.getAsistenciaReporte(filtros)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.registros.set(res.data);
          this.pagination.set({
            total: res.total,
            pagina: res.pagina,
            limite: res.limite
          });
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar reporte'))
      });
  }

  openDeleteModal(id: number): void {
    this.registroToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.registroToDeleteId.set(null);
  }

  confirmarEliminacion(): void {
    const id = this.registroToDeleteId();
    const empresaId = this.empresa()?.id;
    if (!id || !empresaId) return;

    this.isDeleting.set(true);
    this.asistenciaService.deleteRegistro(empresaId, id)
      .pipe(finalize(() => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
      }))
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Registro eliminado correctamente');
          this.loadReporte(this.pagination().pagina);
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo eliminar el registro'))
      });
  }

  // Utils
  formatTime(isoString: string | null): string {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
  }

  formatDate(isoString: string | null): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
  }
}
