import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { CitasService } from '../services/citas.service';
import { 
  Cita, 
  CitaPayload, 
  CitasFilters, 
  CitaEstado, 
  CitasConfig 
} from '../core/citas/citas.models';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import { AuthService } from '../services/auth.service';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-citas-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  templateUrl: './citas-section.component.html'
})
export class CitasSectionComponent implements OnInit {
  private readonly citasService = inject(CitasService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly citas = signal<Cita[] | null>([]);
  readonly config = signal<CitasConfig | null>(null);
  readonly unidades = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Cita | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);
  
  // UI States
  readonly currentView = signal<'calendar' | 'list'>('calendar');
  readonly currentMonth = signal<number>(new Date().getMonth());
  readonly currentYear = signal<number>(new Date().getFullYear());
  readonly daysInGrid = signal<any[]>([]);
  readonly selectedCitaDetails = signal<Cita | null>(null);

  readonly monthsNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  readonly filterForm = this.fb.group({
    buscar: [''],
    estado: [''],
    propiedad_id: [null as number | null]
  });

  readonly citaForm = this.fb.nonNullable.group({
    inmueble_id: [null as number | null],
    unidad_id: [null as number | null],
    cliente_id: [null as number | null],
    nombre_prospecto: ['', [Validators.required, Validators.maxLength(150)]],
    telefono_prospecto: ['', [Validators.required, Validators.maxLength(50)]],
    correo_prospecto: ['', [Validators.email, Validators.maxLength(150)]],
    fecha_visita_date: ['', [Validators.required]],
    fecha_visita_time: ['', [Validators.required]],
    estado: ['programada' as CitaEstado],
    comentarios: ['', [Validators.maxLength(1000)]]
  });

  ngOnInit(): void {
    this.loadConfig();
    this.loadCitas();

    // Filtros reactivos
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.loadCitas();
    });

    // Cargar unidades dinámicamente según el inmueble seleccionado
    this.citaForm.get('inmueble_id')?.valueChanges.subscribe(id => {
      const empresaId = this.authService.empresaId();
      if (id && empresaId) {
        this.loadUnidades(id, empresaId);
      } else {
        this.unidades.set([]);
        this.citaForm.patchValue({ unidad_id: null });
      }
    });
  }

  loadUnidades(inmuebleId: number, empresaId: number): void {
    this.citasService.getUnidadesByInmueble(inmuebleId, empresaId).subscribe({
      next: (data) => this.unidades.set(data),
      error: () => this.unidades.set([])
    });
  }

  loadConfig(): void {
    this.citasService.getConfigFormulario().subscribe({
      next: (res) => this.config.set(res),
      error: () => this.setFeedback('error', 'No se pudieron cargar los catálogos del formulario')
    });
  }

  loadCitas(): void {
    this.isLoading.set(true);
    const year = this.currentYear();
    const month = this.currentMonth();
    
    // Primer y último día del mes activo para el filtro
    const desde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    const hasta = `${year}-${String(month + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

    const filters: CitasFilters = {
      buscar: this.filterForm.value.buscar || undefined,
      estado: (this.filterForm.value.estado as CitaEstado) || undefined,
      propiedad_id: this.filterForm.value.propiedad_id || undefined,
      desde,
      hasta
    };

    this.citasService.list(filters)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.generateCalendar();
      }))
      .subscribe({
        next: (res) => this.citas.set(res.datos),
        error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar visitas'))
      });
  }

  generateCalendar(): void {
    const year = this.currentYear();
    const month = this.currentMonth();
    
    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Lunes
    // Ajustar para que el Lunes sea el día 0
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const grid = [];

    // Días del mes anterior
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevTotalDays - i);
      grid.push({
        date: d,
        dayNum: d.getDate(),
        isCurrentMonth: false,
        isToday: this.isSameDate(d, new Date()),
        citas: [] as Cita[]
      });
    }

    // Días del mes actual
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      grid.push({
        date: d,
        dayNum: i,
        isCurrentMonth: true,
        isToday: this.isSameDate(d, new Date()),
        citas: [] as Cita[]
      });
    }

    // Rellenar días del mes siguiente para completar la cuadrícula de 7 columnas
    const remaining = grid.length % 7;
    if (remaining > 0) {
      const nextDaysNeeded = 7 - remaining;
      for (let i = 1; i <= nextDaysNeeded; i++) {
        const d = new Date(year, month + 1, i);
        grid.push({
          date: d,
          dayNum: i,
          isCurrentMonth: false,
          isToday: this.isSameDate(d, new Date()),
          citas: [] as Cita[]
        });
      }
    }

    // Vincular visitas a sus celdas correspondientes
    const list = this.citas() || [];
    grid.forEach(cell => {
      cell.citas = list.filter(c => this.isSameDate(new Date(c.fecha_visita), cell.date));
    });

    this.daysInGrid.set(grid);
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.selectedCitaDetails.set(null);
    this.loadCitas();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedCitaDetails.set(null);
    this.loadCitas();
  }

  goToToday(): void {
    this.currentMonth.set(new Date().getMonth());
    this.currentYear.set(new Date().getFullYear());
    this.selectedCitaDetails.set(null);
    this.loadCitas();
  }

  setView(view: 'calendar' | 'list'): void {
    this.currentView.set(view);
  }

  openComposer(): void {
    this.editingId.set(null);
    this.selectedCitaDetails.set(null);
    
    // Auto-completar fecha de hoy
    const todayStr = new Date().toISOString().split('T')[0];
    this.citaForm.reset({
      estado: 'programada',
      fecha_visita_date: todayStr,
      fecha_visita_time: '09:00'
    });
    this.isComposerOpen.set(true);
  }

  startEdit(item: Cita): void {
    this.editingId.set(item.id);
    
    // Parsear fecha y hora
    const dObj = new Date(item.fecha_visita);
    const dStr = dObj.toISOString().split('T')[0];
    const hStr = dObj.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    this.citaForm.patchValue({
      inmueble_id: item.propiedad_id || null,
      unidad_id: item.unidad_id || null,
      cliente_id: item.cliente_id || null,
      nombre_prospecto: item.nombre_prospecto,
      telefono_prospecto: item.telefono_prospecto,
      correo_prospecto: item.correo_prospecto || '',
      fecha_visita_date: dStr,
      fecha_visita_time: hStr,
      estado: item.estado,
      comentarios: item.comentarios || ''
    });

    this.isComposerOpen.set(true);
  }

  closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  submitCita(): void {
    if (this.citaForm.invalid) {
      this.citaForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const raw = this.citaForm.getRawValue();

    // Reconstruir fecha_visita ISO combinando fecha y hora local
    const fechaHora = new Date(`${raw.fecha_visita_date}T${raw.fecha_visita_time}`);

    const payload: CitaPayload = {
      propiedad_id: raw.inmueble_id ? Number(raw.inmueble_id) : null,
      unidad_id: raw.unidad_id ? Number(raw.unidad_id) : null,
      cliente_id: raw.cliente_id ? Number(raw.cliente_id) : null,
      nombre_prospecto: raw.nombre_prospecto,
      telefono_prospecto: raw.telefono_prospecto,
      correo_prospecto: raw.correo_prospecto || null,
      fecha_visita: fechaHora.toISOString(),
      estado: raw.estado as CitaEstado,
      comentarios: raw.comentarios || null
    };

    const isEdit = !!this.editingId();
    const req = isEdit 
      ? this.citasService.update(this.editingId()!, payload)
      : this.citasService.create(payload);

    req.pipe(finalize(() => this.isSaving.set(false)))
       .subscribe({
         next: (res) => {
           this.setFeedback('success', isEdit ? 'Visita actualizada.' : 'Visita agendada.');
           this.closeComposer();
           this.loadCitas();
           
           // Si estábamos viendo los detalles de esta cita, los actualizamos
           if (isEdit && this.selectedCitaDetails()?.id === res.id) {
             this.selectedCitaDetails.set(res);
           }
         },
         error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al guardar la visita'))
       });
  }

  openDelete(item: Cita): void {
    this.pendingDelete.set(item);
  }

  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.citasService.delete(target.id).subscribe({
      next: () => {
        this.setFeedback('success', 'Visita eliminada.');
        this.pendingDelete.set(null);
        if (this.selectedCitaDetails()?.id === target.id) {
          this.selectedCitaDetails.set(null);
        }
        this.loadCitas();
      },
      error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al eliminar visita'))
    });
  }

  updateStatus(id: number, newStatus: CitaEstado): void {
    this.citasService.cambiarEstado(id, newStatus).subscribe({
      next: (res: any) => {
        this.setFeedback('success', 'Estado actualizado.');
        this.loadCitas();
        if (this.selectedCitaDetails()?.id === id) {
          // Actualizamos localmente el estado del detalle
          const updated = { ...this.selectedCitaDetails()!, estado: newStatus };
          this.selectedCitaDetails.set(updated as Cita);
        }
      },
      error: (err) => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al actualizar estado'))
    });
  }

  showDetails(cita: Cita, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedCitaDetails.set(cita);
  }

  closeDetails(): void {
    this.selectedCitaDetails.set(null);
  }

  getStatusBadgeClass(estado: string): string {
    switch (estado) {
      case 'programada':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50';
      case 'realizada':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
      case 'cancelada':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
      case 'no_asistio':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }

  countCitasByEstado(estado: string): number {
    if (!this.citas()) return 0;
    return this.citas()!.filter(c => c.estado === estado).length;
  }

  getDateNumber(isoString: string): number {
    return new Date(isoString).getDate();
  }

  getMonthName(isoString: string): string {
    const idx = new Date(isoString).getMonth();
    return this.monthsNames[idx] || '';
  }

  getTimeStr(isoString: string): string {
    return new Date(isoString).toTimeString().substring(0, 5);
  }

  getFormattedDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
