import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs';
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
  readonly activeTab = signal<'reporte' | 'configuracion'>('reporte');

  // --- Reporte de Asistencia ---
  readonly registros = signal<AsistenciaRegistro[]>([]);
  readonly isLoading = signal(false);
  readonly isExportingExcel = signal(false);
  readonly isExportingPdf = signal(false);
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
    fecha: [''],
    desde: [''],
    hasta: ['']
  });

  // --- Configuración Global ---
  readonly isSavingConfig = signal(false);
  readonly isLoadingConfig = signal(false);
  readonly configForm = this.formBuilder.nonNullable.group({
    hora_entrada: ['08:00', [Validators.required]],
    hora_salida: ['17:00', [Validators.required]],
    tolerancia_minutos: [15, [Validators.required, Validators.min(0)]],
    dias_laborables: ['1,2,3,4,5', [Validators.required]]
  });

  readonly diasSemana = [
    { id: '1', label: 'L' },
    { id: '2', label: 'M' },
    { id: '3', label: 'X' },
    { id: '4', label: 'J' },
    { id: '5', label: 'V' },
    { id: '6', label: 'S' },
    { id: '7', label: 'D' }
  ];

  ngOnInit(): void {
    this.loadReporte(1);
    this.loadConfig();

    // Búsqueda y filtrado en tiempo real
    this.filterForm.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
      )
      .subscribe(() => this.loadReporte(1));
  }

  setTab(tab: 'reporte' | 'configuracion'): void {
    this.activeTab.set(tab);
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
      fecha: formVal.fecha || undefined,
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

  exportar(formato: 'excel' | 'pdf'): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    if (formato === 'excel') this.isExportingExcel.set(true);
    if (formato === 'pdf') this.isExportingPdf.set(true);

    const formVal = this.filterForm.value;
    const filtros: AsistenciaFiltros = {
      empresa_id: empresaId,
      buscar: formVal.buscar || undefined,
      fecha: formVal.fecha || undefined,
      desde: formVal.desde || undefined,
      hasta: formVal.hasta || undefined
    };

    this.asistenciaService.exportarReporte(filtros, formato)
      .pipe(
        finalize(() => {
          if (formato === 'excel') this.isExportingExcel.set(false);
          if (formato === 'pdf') this.isExportingPdf.set(false);
        })
      )
      .subscribe({
        next: (blob) => {
          const urlBlob = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = urlBlob;
          const extension = formato === 'excel' ? 'xlsx' : 'pdf';
          link.setAttribute('download', `reporte_asistencia.${extension}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(urlBlob);
          this.setFeedback('success', `Reporte exportado a ${formato.toUpperCase()}`);
        },
        error: (err) => {
          const msg = extractHttpErrorMessage(err, `Error al exportar a ${formato.toUpperCase()}`);
          this.setFeedback('error', msg);
        }
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

  // --- Gestión de Configuración ---

  loadConfig(): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.isLoadingConfig.set(true);
    this.asistenciaService.getAsistenciaConfiguracion(empresaId)
      .pipe(finalize(() => this.isLoadingConfig.set(false)))
      .subscribe({
        next: (config) => {
          this.configForm.patchValue(config);
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar configuración'))
      });
  }

  saveConfig(): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.isSavingConfig.set(true);
    this.asistenciaService.updateAsistenciaConfiguracion(empresaId, this.configForm.getRawValue())
      .pipe(finalize(() => this.isSavingConfig.set(false)))
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Configuración actualizada correctamente');
        },
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al guardar configuración'))
      });
  }

  toggleDay(dayId: string): void {
    const currentDays = this.configForm.getRawValue().dias_laborables.split(',').filter(d => d !== '');
    const index = currentDays.indexOf(dayId);
    
    if (index > -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(dayId);
    }
    
    this.configForm.patchValue({
      dias_laborables: currentDays.sort().join(',')
    });
  }

  isDaySelected(dayId: string): boolean {
    return this.configForm.getRawValue().dias_laborables.split(',').includes(dayId);
  }

  // Utils
  formatDuration(hoursDecimal: number | null): string {
    if (hoursDecimal === null) return '--:--';
    
    const totalSeconds = Math.round(hoursDecimal * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0 || h > 0) result += `${m}m `;
    result += `${s}s`;
    
    return result.trim();
  }

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
    // Eliminamos timeZone: 'UTC' para que use la hora local del navegador
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
  }
}
