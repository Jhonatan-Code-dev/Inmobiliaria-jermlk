import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import { AuthService } from '../services/auth.service';
import { AsistenciaService } from '../services/asistencia.service';
import { AsistenciaRegistro } from '../core/asistencia/asistencia.models';

type FeedbackTone = 'success' | 'error';

type FeedbackState = {
  readonly tone: FeedbackTone;
  readonly message: string;
};

@Component({
  selector: 'app-asistencia-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .clock-text { font-variant-numeric: tabular-nums; }
  `],
  templateUrl: './asistencia-section.component.html'
})
export class AsistenciaSectionComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;
  readonly user = this.authService.user;
  
  readonly feedback = signal<FeedbackState | null>(null);

  // Reloj
  readonly currentTime = signal<Date>(new Date());
  private clockInterval?: any;

  // Estado: Mi Asistencia
  readonly miHistorial = signal<AsistenciaRegistro[] | null>([]);
  readonly isMarking = signal(false);
  readonly isLoadingHistorial = signal(false);

  readonly todayRecord = computed(() => {
    const history = this.miHistorial() || [];
    if (history.length === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    return history.find(r => r.fecha.startsWith(today)) || null;
  });

  readonly attendanceStatus = computed(() => {
    const record = this.todayRecord();
    if (!record) return 'none';
    if (record.hora_entrada && !record.hora_salida) return 'in';
    if (record.hora_entrada && record.hora_salida) return 'out';
    return 'none';
  });

  // Modal Confirmación
  readonly isConfirmModalOpen = signal(false);
  readonly confirmType = signal<'entrada' | 'salida' | null>(null);

  // Modal Permiso
  readonly isPermisoModalOpen = signal(false);
  readonly isSubmittingPermiso = signal(false);
  readonly permisoForm = this.formBuilder.nonNullable.group({
    fecha: ['', [Validators.required]],
    motivo: ['', [Validators.required, Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    this.startClock();
    this.loadMiHistorial();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private startClock(): void {
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => {
      if (this.feedback()?.message === message) {
        this.feedback.set(null);
      }
    }, 5000);
  }

  // --- Operaciones Empleado ---

  openConfirmModal(type: 'entrada' | 'salida'): void {
    this.confirmType.set(type);
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
    this.confirmType.set(null);
  }

  confirmarMarcacion(): void {
    if (this.isMarking()) return;
    
    this.isMarking.set(true);
    this.closeConfirmModal();

    this.asistenciaService.marcarAsistencia()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isMarking.set(false))
      )
      .subscribe({
        next: (registro) => {
          let msg = '';
          if (registro.hora_salida) {
            const horas = registro.horas_trabajadas?.toFixed(2) || '0.00';
            msg = `Salida registrada. Trabajaste ${horas} horas hoy.`;
          } else {
            const estadoStr = registro.estado === 'tarde' ? ' (Tardanza)' : ' (A tiempo)';
            msg = `Entrada registrada correctamente${estadoStr}.`;
          }
          this.setFeedback('success', msg);
          this.loadMiHistorial();
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'No se pudo registrar asistencia.'));
        }
      });
  }

  loadMiHistorial(): void {
    this.isLoadingHistorial.set(true);
    this.asistenciaService.getMiHistorial()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingHistorial.set(false))
      )
      .subscribe({
        next: (historial) => this.miHistorial.set(historial),
        error: (error) => this.setFeedback('error', extractHttpErrorMessage(error, 'Error al cargar historial.'))
      });
  }

  openPermisoModal(): void {
    this.permisoForm.reset({ fecha: new Date().toISOString().split('T')[0] });
    this.isPermisoModalOpen.set(true);
  }

  closePermisoModal(): void {
    this.isPermisoModalOpen.set(false);
  }

  submitPermiso(): void {
    if (this.permisoForm.invalid) {
      this.permisoForm.markAllAsTouched();
      return;
    }

    this.isSubmittingPermiso.set(true);
    this.asistenciaService.solicitarPermiso(this.permisoForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmittingPermiso.set(false))
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Solicitud de permiso enviada.');
          this.closePermisoModal();
        },
        error: (error) => this.setFeedback('error', extractHttpErrorMessage(error, 'Error al enviar solicitud.'))
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
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }
}
