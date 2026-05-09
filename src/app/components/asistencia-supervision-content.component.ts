import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import { AuthService } from '../services/auth.service';
import { AsistenciaService } from '../services/asistencia.service';
import {
  AsistenciaRegistro,
  AsistenciaFiltros,
  HorarioPayload,
  EvaluarPermisoPayload
} from '../core/asistencia/asistencia.models';

type FeedbackTone = 'success' | 'error';
type SupervisionTab = 'registros' | 'horarios' | 'permisos';

@Component({
  selector: 'app-asistencia-supervision-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './asistencia-supervision-content.component.html',
  styles: [`
    :host { display: block; }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class AsistenciaSupervisionContentComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly asistenciaService = inject(AsistenciaService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;
  readonly activeTab = signal<SupervisionTab>('registros');
  readonly feedback = signal<{ tone: FeedbackTone, message: string } | null>(null);

  // --- Registros ---
  readonly registros = signal<AsistenciaRegistro[]>([]);
  readonly isLoadingRegistros = signal(false);
  readonly pagination = signal<{ pagina_actual: number }>({
    pagina_actual: 1
  });
  
  // Filtros
  readonly filterForm = this.formBuilder.group({
    usuario_id: [''],
    estado: [''],
    desde: [''],
    hasta: ['']
  });

  // --- Horarios ---
  readonly currentHorario = signal<any>(null);
  readonly isLoadingHorario = signal(false);
  readonly horarioForm = this.formBuilder.nonNullable.group({
    usuario_id: [0, [Validators.required, Validators.min(1)]],
    hora_entrada: ['08:00', [Validators.required]],
    hora_salida: ['18:00', [Validators.required]],
    tolerancia_minutos: [10, [Validators.required, Validators.min(0)]],
    dias_laborables: ['1,2,3,4,5', [Validators.required]]
  });

  // --- Permisos ---
  readonly permisosPendientes = signal<any[]>([]);
  readonly isLoadingPermisos = signal(false);
  readonly isEvaluatingPermiso = signal(false);
  readonly selectedPermiso = signal<any>(null);
  readonly evaluacionForm = this.formBuilder.nonNullable.group({
    estado: ['aprobado', [Validators.required]],
    respuesta: ['', [Validators.required, Validators.maxLength(200)]]
  });

  ngOnInit(): void {
    this.loadRegistros(1);
  }

  setTab(tab: SupervisionTab): void {
    this.activeTab.set(tab);
    if (tab === 'registros' && this.registros().length === 0) {
      this.loadRegistros(1);
    }
    if (tab === 'permisos') {
      this.loadPermisosPendientes();
    }
  }

  private setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 4000);
  }

  // --- Lógica de Registros ---
  loadRegistros(page: number): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.isLoadingRegistros.set(true);
    const formVal = this.filterForm.value;
    
    const filtros: AsistenciaFiltros = {
      empresa_id: empresaId,
      pag: page,
      limite: 15,
      usuario_id: formVal.usuario_id ? Number(formVal.usuario_id) : undefined,
      estado: formVal.estado || undefined,
      desde: formVal.desde || undefined,
      hasta: formVal.hasta || undefined
    };

    this.asistenciaService.getRegistrosGlobales(filtros)
      .pipe(
        finalize(() => this.isLoadingRegistros.set(false))
      )
      .subscribe({
        next: (res) => {
          this.registros.set(res);
          this.pagination.set({ pagina_actual: page });
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar registros'))
      });
  }

  deleteRegistro(id: number): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId || !confirm('¿Estás seguro de eliminar este registro de asistencia?')) return;

    this.asistenciaService.deleteRegistro(empresaId, id)
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Registro eliminado correctamente');
          this.loadRegistros(this.pagination().pagina_actual);
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo eliminar el registro'))
      });
  }

  // --- Lógica de Horarios ---
  consultarHorario(): void {
    const empresaId = this.empresa()?.id;
    const usuarioId = this.horarioForm.get('usuario_id')?.value;
    if (!empresaId || !usuarioId) return;

    this.isLoadingHorario.set(true);
    this.asistenciaService.getHorarioDetalle(empresaId, usuarioId)
      .pipe(
        finalize(() => this.isLoadingHorario.set(false))
      )
      .subscribe({
        next: (horario) => {
          this.currentHorario.set(horario);
          if (horario) {
            this.horarioForm.patchValue({
              hora_entrada: horario.hora_entrada,
              hora_salida: horario.hora_salida,
              tolerancia_minutos: horario.tolerancia_minutos,
              dias_laborables: horario.dias_laborables
            });
          }
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al consultar horario'))
      });
  }

  guardarHorario(): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId || this.horarioForm.invalid) return;

    this.isLoadingHorario.set(true);
    const payload: HorarioPayload = this.horarioForm.getRawValue();

    this.asistenciaService.asignarHorario(empresaId, payload)
      .pipe(
        finalize(() => this.isLoadingHorario.set(false))
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Horario asignado correctamente');
          this.consultarHorario();
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al guardar horario'))
      });
  }

  // --- Lógica de Permisos ---
  loadPermisosPendientes(): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.isLoadingPermisos.set(true);
    this.asistenciaService.getPermisos(empresaId, 'pendiente')
      .pipe(
        finalize(() => this.isLoadingPermisos.set(false))
      )
      .subscribe({
        next: (data) => this.permisosPendientes.set(data),
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar permisos'))
      });
  }

  prepararEvaluacion(permiso: any): void {
    this.selectedPermiso.set(permiso);
    this.evaluacionForm.reset({ estado: 'aprobado', respuesta: '' });
  }

  submitEvaluacion(): void {
    const empresaId = this.empresa()?.id;
    const permiso = this.selectedPermiso();
    if (!empresaId || !permiso || this.evaluacionForm.invalid) return;

    this.isEvaluatingPermiso.set(true);
    const payload: EvaluarPermisoPayload = this.evaluacionForm.getRawValue() as EvaluarPermisoPayload;

    this.asistenciaService.evaluarPermiso(empresaId, permiso.id, payload)
      .pipe(
        finalize(() => this.isEvaluatingPermiso.set(false))
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Solicitud procesada');
          this.selectedPermiso.set(null);
          this.loadPermisosPendientes();
          if (this.activeTab() === 'registros') {
            this.loadRegistros(this.pagination().pagina_actual);
          }
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al procesar solicitud'))
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
