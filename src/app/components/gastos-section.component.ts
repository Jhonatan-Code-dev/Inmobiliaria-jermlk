import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import {
  Gasto,
  GastoPayload,
  GastosFilters,
  GastosPaginacion,
  MetodoPago
} from '../core/gastos/gastos.models';
import { AuthService } from '../services/auth.service';
import { GastosService } from '../services/gastos.service';

type FeedbackTone = 'success' | 'error';

type FeedbackState = {
  readonly tone: FeedbackTone;
  readonly message: string;
};

type FilterMode = 'none' | 'anio' | 'rango' | 'fecha';

const FILTER_MODE_OPTIONS = [
  { value: 'none' as FilterMode, label: 'Sin filtro de tiempo' },
  { value: 'anio' as FilterMode, label: 'Por año / mes' },
  { value: 'rango' as FilterMode, label: 'Por rango de fechas' },
  { value: 'fecha' as FilterMode, label: 'Por fecha exacta' }
] as const;

const DEFAULT_PAGINATION: GastosPaginacion = {
  total: 0,
  paginas: 0,
  pagina: 1,
  por_pagina: 10
};

const MONTH_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
] as const;

@Component({
  selector: 'app-gastos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gastos-section.component.html',
  styleUrl: './gastos-section.component.css'
})
export class GastosSectionComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gastosService = inject(GastosService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;
  readonly monthOptions = MONTH_OPTIONS;
  readonly filterModeOptions = FILTER_MODE_OPTIONS;
  readonly filterMode = signal<FilterMode>('none');
  readonly metodosPago = signal<MetodoPago[]>([]);

  readonly shellPanelClass = 'rounded-xl border border-slate-200 bg-white shadow-sm';
  readonly secondaryPanelClass = 'rounded-lg border border-slate-200 bg-white shadow-sm';

  readonly filtersForm = this.formBuilder.nonNullable.group({
    anio: '',
    mes: '',
    desde: '',
    hasta: '',
    fecha: ''
  });

  readonly gastoForm = this.formBuilder.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(255)]],
    fecha: [this.todayDate(), [Validators.required]],
    monto_display: ['', [Validators.required, Validators.min(0.01)]],
    tipo_pago_id: ['', [Validators.required]]
  });

  readonly gastos = signal<Gasto[]>([]);
  readonly pagination = signal<GastosPaginacion>(DEFAULT_PAGINATION);
  readonly feedback = signal<FeedbackState | null>(null);
  readonly isLoadingList = signal(false);
  readonly isSaving = signal(false);
  readonly deletingId = signal<number | null>(null);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDeleteExpense = signal<Gasto | null>(null);

  readonly hasFiltersActive = computed(() => {
    return this.filterMode() !== 'none';
  });

  readonly pageTotalAmount = computed(() =>
    this.gastos().reduce((accumulator, gasto) => accumulator + gasto.monto, 0)
  );

  readonly pageTotalLabel = computed(() =>
    this.formatCurrency(this.pageTotalAmount(), this.defaultCurrency())
  );

  readonly pageRecordCount = computed(() => this.gastos().length);
  readonly totalRecords = computed(() => this.pagination().total);

  readonly paymentMethodNameById = computed(() => {
    const mapping = new Map<number, string>();

    for (const metodo of this.metodosPago()) {
      mapping.set(metodo.id, metodo.nombre);
    }

    return mapping;
  });

  readonly formTitle = computed(() =>
    this.editingId() ? 'Editar gasto existente' : 'Registrar nuevo gasto'
  );

  readonly formSubmitLabel = computed(() =>
    this.isSaving()
      ? this.editingId()
        ? 'Guardando cambios...'
        : 'Registrando gasto...'
      : this.editingId()
        ? 'Guardar cambios'
        : 'Registrar gasto'
  );

  readonly isDeleteDialogOpen = computed(() => this.pendingDeleteExpense() !== null);

  readonly deleteDialogDescription = computed(() => {
    const expense = this.pendingDeleteExpense();

    if (!expense) {
      return '';
    }

    const formattedAmount = this.formatCurrency(expense.monto, this.defaultCurrency());
    const formattedDate = this.formatShortDate(expense.fecha);
    return `"${expense.descripcion}" por ${formattedAmount} (${formattedDate})`;
  });

  ngOnInit(): void {
    this.loadGastos(1);
    this.loadMetodosPago();
  }

  loadMetodosPago(): void {
    this.gastosService
      .getMetodosPago()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (metodos) => this.metodosPago.set(metodos),
        error: (error: unknown) => {
          this.setFeedback(
            'error',
            extractHttpErrorMessage(error, 'No se pudieron cargar los tipos de pago.')
          );
        }
      });
  }

  openComposerForNewExpense(): void {
    this.resetComposerForm(true);
    this.feedback.set(null);
  }

  closeComposer(): void {
    this.resetComposerForm(false);
  }

  applyFilters(): void {
    this.loadGastos(1);
  }

  clearFilters(): void {
    this.filterMode.set('none');
    this.filtersForm.reset({
      anio: '',
      mes: '',
      desde: '',
      hasta: '',
      fecha: ''
    });
    this.loadGastos(1);
  }

  setFilterMode(mode: FilterMode): void {
    this.filterMode.set(mode);

    // Clear fields that don't belong to the new mode
    if (mode !== 'anio') {
      this.filtersForm.patchValue({ anio: '', mes: '' });
    }

    if (mode !== 'rango') {
      this.filtersForm.patchValue({ desde: '', hasta: '' });
    }

    if (mode !== 'fecha') {
      this.filtersForm.patchValue({ fecha: '' });
    }
  }

  loadGastos(page = this.pagination().pagina): void {
    const filters = this.buildFilters(page);

    if (!filters) {
      this.gastos.set([]);
      this.pagination.set(DEFAULT_PAGINATION);
      this.setFeedback(
        'error',
        'No se pudo listar gastos porque no existe empresa_id en la sesion.'
      );
      return;
    }

    this.isLoadingList.set(true);

    this.gastosService
      .list(filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingList.set(false))
      )
      .subscribe({
        next: (response) => {
          this.gastos.set(response.datos);
          this.pagination.set(response.paginacion);
        },
        error: (error: unknown) => {
          this.setFeedback(
            'error',
            extractHttpErrorMessage(error, 'No se pudieron cargar los gastos.')
          );
        }
      });
  }

  goToPage(page: number): void {
    const totalPages = this.pagination().paginas;
    if (page < 1 || page > totalPages || page === this.pagination().pagina) {
      return;
    }

    this.loadGastos(page);
  }

  startEdit(gasto: Gasto): void {
    this.editingId.set(gasto.id);
    this.isComposerOpen.set(true);
    this.feedback.set(null);
    this.gastoForm.reset({
      descripcion: gasto.descripcion,
      fecha: this.normalizeInputDate(gasto.fecha),
      monto_display: gasto.monto.toFixed(2),
      tipo_pago_id: String(gasto.tipo_pago_id)
    });
  }

  cancelEdit(): void {
    this.resetComposerForm(false);
  }

  submitGasto(): void {
    if (this.gastoForm.invalid) {
      this.gastoForm.markAllAsTouched();
      this.setFeedback('error', 'Completa los campos obligatorios antes de guardar el gasto.');
      return;
    }

    const payload = this.buildPayload();

    if (!payload) {
      this.setFeedback('error', 'El monto o el tipo de pago no son validos.');
      return;
    }

    const editingId = this.editingId();
    const request = editingId
      ? this.gastosService.update(editingId, payload)
      : this.gastosService.create(payload);

    this.isSaving.set(true);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.setFeedback(
            'success',
            editingId ? 'El gasto fue actualizado correctamente.' : 'El gasto fue registrado correctamente.'
          );
          this.resetComposerForm(false);
          this.loadGastos(editingId ? this.pagination().pagina : 1);
        },
        error: (error: unknown) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'No se pudo guardar el gasto.'));
        }
      });
  }

  openDeleteDialog(gasto: Gasto): void {
    this.pendingDeleteExpense.set(gasto);
  }

  closeDeleteDialog(): void {
    if (this.deletingId()) {
      return;
    }

    this.pendingDeleteExpense.set(null);
  }

  confirmDeleteGasto(): void {
    const expense = this.pendingDeleteExpense();

    if (!expense) {
      return;
    }

    const empresaId = this.empresa()?.id;

    if (!empresaId) {
      this.setFeedback(
        'error',
        'No se pudo eliminar el gasto porque no existe empresa_id en la sesion.'
      );
      this.pendingDeleteExpense.set(null);
      return;
    }

    this.deletingId.set(expense.id);

    this.gastosService
      .delete(expense.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deletingId.set(null);
          this.pendingDeleteExpense.set(null);
        })
      )
      .subscribe({
        next: () => {
          const currentPage = this.pagination().pagina;
          const nextPage =
            this.gastos().length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

          this.setFeedback('success', 'El gasto fue eliminado correctamente.');
          this.loadGastos(nextPage);
        },
        error: (error: unknown) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'No se pudo eliminar el gasto.'));
        }
      });
  }

  feedbackClasses(tone: FeedbackTone): string {
    return tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';
  }

  resolvePaymentMethodName(gasto: Gasto): string {
    const methodName = this.paymentMethodNameById().get(gasto.tipo_pago_id);
    return methodName ? methodName : `ID ${gasto.tipo_pago_id}`;
  }

  formatCurrency(value: number, currency: string): string {
    try {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  formatShortDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium'
    }).format(date);
  }

  private buildFilters(page: number): GastosFilters | null {
    const empresaId = this.empresa()?.id;

    if (!empresaId) {
      return null;
    }

    const rawFilters = this.filtersForm.getRawValue();

    // Normalize: Angular's NumberValueAccessor may produce numbers at runtime
    // for <input type="number">, so we must safely convert all values to strings.
    const safe = {
      anio: String(rawFilters.anio ?? ''),
      mes: String(rawFilters.mes ?? ''),
      desde: String(rawFilters.desde ?? ''),
      hasta: String(rawFilters.hasta ?? ''),
      fecha: String(rawFilters.fecha ?? '')
    };

    // Precedence 1: Fecha exacta — ignores all other time filters
    const exactDate = this.normalizeNullableText(safe.fecha);

    if (exactDate) {
      return {
        empresa_id: empresaId,
        pag: page,
        fecha: exactDate
      };
    }

    // Precedence 2: Rango de fechas (desde & hasta) — ignores anio and mes
    const desde = this.normalizeNullableText(safe.desde);
    const hasta = this.normalizeNullableText(safe.hasta);

    if (desde && hasta) {
      return {
        empresa_id: empresaId,
        pag: page,
        desde,
        hasta
      };
    }

    // Precedence 3: Año y Mes — filtra por mes específico del año
    const anio = this.parseNullableNumber(safe.anio);
    const mes = this.parseMonth(safe.mes);

    if (anio && mes) {
      return {
        empresa_id: empresaId,
        pag: page,
        anio,
        mes
      };
    }

    // Precedence 4: Solo Año — filtra por año completo
    if (anio) {
      return {
        empresa_id: empresaId,
        pag: page,
        anio
      };
    }

    // Sin filtros de tiempo — devuelve todos los gastos paginados
    return {
      empresa_id: empresaId,
      pag: page
    };
  }

  private buildPayload(): GastoPayload | null {
    const rawValue = this.gastoForm.getRawValue();
    const amount = Number.parseFloat(rawValue.monto_display);
    const tipoPagoId = Number(rawValue.tipo_pago_id);
    const empresaId = this.empresa()?.id;
    const descripcion = rawValue.descripcion.trim();

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(tipoPagoId) ||
      tipoPagoId <= 0 ||
      !empresaId ||
      !descripcion
    ) {
      return null;
    }

    return {
      monto: Number(amount.toFixed(2)),
      fecha: rawValue.fecha,
      tipo_pago_id: tipoPagoId,
      descripcion,
      empresa_id: empresaId
    };
  }

  private resetComposerForm(keepOpen: boolean): void {
    this.editingId.set(null);
    this.isComposerOpen.set(keepOpen);
    this.gastoForm.reset({
      descripcion: '',
      fecha: this.todayDate(),
      monto_display: '',
      tipo_pago_id: ''
    });
  }

  private parseNullableNumber(value: string): number | null {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return null;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isInteger(parsedValue) ? parsedValue : null;
  }

  private parseMonth(value: string): number | null {
    const month = this.parseNullableNumber(value);

    if (!month) {
      return null;
    }

    return month >= 1 && month <= 12 ? month : null;
  }

  private normalizeNullableText(value: string): string | null {
    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : null;
  }

  private normalizeInputDate(value: string): string {
    if (!value) {
      return this.todayDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return this.todayDate();
    }

    return this.formatDateForInput(date);
  }

  private setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
  }

  private defaultCurrency(): string {
    return this.empresa()?.moneda ?? 'PEN';
  }

  private todayDate(): string {
    return this.formatDateForInput(new Date());
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
