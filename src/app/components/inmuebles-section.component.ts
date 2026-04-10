import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import {
  Inmueble,
  InmueblePayload,
  InmueblesFilters,
  InmueblesPaginacion,
  Unidad,
  UnidadPayload
} from '../core/inmuebles/inmuebles.models';
import { AuthService } from '../services/auth.service';
import { InmueblesService } from '../services/inmuebles.service';

type FeedbackTone = 'success' | 'error';

type FeedbackState = {
  readonly tone: FeedbackTone;
  readonly message: string;
};

const DEFAULT_PAGINATION: InmueblesPaginacion = {
  total: 0,
  paginas: 0,
  pagina: 1,
  por_pagina: 10
};

@Component({
  selector: 'app-inmuebles-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inmuebles-section.component.html',
  styleUrls: ['./inmuebles-section.component.css']
})
export class InmueblesSectionComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inmueblesService = inject(InmueblesService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;

  readonly shellPanelClass = 'rounded-xl border border-slate-200 bg-white shadow-sm';
  readonly secondaryPanelClass = 'rounded-lg border border-slate-200 bg-white shadow-sm';

  // Forms
  readonly searchForm = this.formBuilder.nonNullable.group({
    buscar: '',
    estado: '',
    tipo: ''
  });

  readonly inmuebleForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['edificio', [Validators.required]],
    descripcion: [''],
    direccion: ['', [Validators.required]],
    ciudad: ['', [Validators.required]],
    region: [''],
    pais: ['PE', [Validators.required]],
    codigo_postal: [''],
    total_pisos: [1, [Validators.required, Validators.min(1)]],
    total_unidades: [0, [Validators.required, Validators.min(0)]],
    estado: ['activa', [Validators.required]]
  });

  readonly unidadForm = this.formBuilder.nonNullable.group({
    codigo: ['', [Validators.required]],
    nombre: ['', [Validators.required]],
    tipo: ['departamento', [Validators.required]],
    numero_piso: [1, [Validators.required]],
    dormitorios: [1, [Validators.required, Validators.min(0)]],
    banos: [1, [Validators.required, Validators.min(0)]],
    area_m2: [0, [Validators.required, Validators.min(1)]],
    capacidad: [1, [Validators.required, Validators.min(1)]],
    moneda: ['PEN', [Validators.required]],
    precio_base: [0, [Validators.required, Validators.min(0)]],
    deposito_requerido: [0, [Validators.required, Validators.min(0)]],
    incluye_agua: [false],
    incluye_luz: [false],
    incluye_internet: [false],
    notas: [''],
    estado: ['disponible', [Validators.required]]
  });

  // State Signals
  readonly inmuebles = signal<Inmueble[]>([]);
  readonly pagination = signal<InmueblesPaginacion>(DEFAULT_PAGINATION);
  readonly feedback = signal<FeedbackState | null>(null);
  
  readonly isLoadingList = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly isSaving = signal(false);
  
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  
  readonly selectedInmueble = signal<Inmueble | null>(null);
  readonly isDetailOpen = signal(false);
  
  readonly isUnidadComposerOpen = signal(false);
  readonly editingUnidadId = signal<number | null>(null);
  readonly deletingUnidadId = signal<number | null>(null);

  readonly pendingDeleteInmueble = signal<Inmueble | null>(null);
  readonly pendingDeleteUnidad = signal<Unidad | null>(null);

  // Computed Values
  readonly hasFiltersActive = computed(() => {
    const vals = this.searchForm.getRawValue();
    return vals.buscar.trim().length > 0 || vals.estado !== '' || vals.tipo !== '';
  });

  readonly totalRecords = computed(() => this.pagination().total);

  readonly formTitle = computed(() =>
    this.editingId() ? 'Editar inmueble existente' : 'Registrar nuevo inmueble'
  );

  readonly unidadFormTitle = computed(() =>
    this.editingUnidadId() ? 'Editar unidad' : 'Registrar nueva unidad'
  );

  ngOnInit(): void {
    this.loadInmuebles(1);
  }

  // --- Inmuebles Logic ---

  loadInmuebles(page = this.pagination().pagina): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    const { buscar, estado, tipo } = this.searchForm.getRawValue();
    const filters: InmueblesFilters = {
      empresa_id: empresaId,
      pag: page,
      buscar: buscar.trim() || undefined,
      estado: estado || undefined,
      tipo: tipo || undefined
    };

    this.isLoadingList.set(true);

    this.inmueblesService
      .list(filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingList.set(false))
      )
      .subscribe({
        next: (response) => {
          this.inmuebles.set(response.datos);
          this.pagination.set(response.paginacion);
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al cargar inmuebles.'));
        }
      });
  }

  applySearch(): void {
    this.loadInmuebles(1);
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.loadInmuebles(1);
  }

  goToPage(page: number): void {
    const totalPages = this.pagination().paginas;
    if (page < 1 || page > totalPages || page === this.pagination().pagina) return;
    this.loadInmuebles(page);
  }

  openComposer(): void {
    this.editingId.set(null);
    this.inmuebleForm.reset({
      tipo: 'edificio',
      pais: 'PE',
      total_pisos: 1,
      total_unidades: 0,
      estado: 'activa'
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  startEdit(inmueble: Inmueble): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.editingId.set(inmueble.id);
    this.isComposerOpen.set(true);
    this.isLoadingDetail.set(true);

    this.inmueblesService
      .getById(inmueble.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingDetail.set(false))
      )
      .subscribe({
        next: (data) => {
          this.inmuebleForm.reset({
            nombre: data.nombre,
            tipo: data.tipo,
            descripcion: data.descripcion,
            direccion: data.direccion,
            ciudad: data.ciudad,
            region: data.region,
            pais: data.pais,
            codigo_postal: data.codigo_postal,
            total_pisos: data.total_pisos,
            total_unidades: data.total_unidades,
            estado: data.estado
          });
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al cargar inmueble.'));
          this.closeComposer();
        }
      });
  }

  submitInmueble(): void {
    if (this.inmuebleForm.invalid) {
      this.inmuebleForm.markAllAsTouched();
      return;
    }

    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    const payload: InmueblePayload = {
      ...this.inmuebleForm.getRawValue(),
      empresa_id: empresaId
    };

    const editingId = this.editingId();
    const request = editingId
      ? this.inmueblesService.update(editingId, payload)
      : this.inmueblesService.create(payload);

    this.isSaving.set(true);

    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', editingId ? 'Inmueble actualizado.' : 'Inmueble registrado.');
          this.closeComposer();
          this.loadInmuebles(editingId ? this.pagination().pagina : 1);
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al guardar inmueble.'));
        }
      });
  }

  openDeleteInmueble(inmueble: Inmueble): void {
    this.pendingDeleteInmueble.set(inmueble);
  }

  confirmDeleteInmueble(): void {
    const target = this.pendingDeleteInmueble();
    const empresaId = this.empresa()?.id;
    if (!target || !empresaId) return;

    this.isSaving.set(true);
    this.inmueblesService
      .delete(target.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSaving.set(false);
          this.pendingDeleteInmueble.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Inmueble eliminado.');
          this.loadInmuebles(1);
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al eliminar inmueble.'));
        }
      });
  }

  // --- Detail & Units Logic ---

  viewDetail(inmueble: Inmueble): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.isLoadingDetail.set(true);
    this.isDetailOpen.set(true);

    this.inmueblesService
      .getById(inmueble.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingDetail.set(false))
      )
      .subscribe({
        next: (data) => {
          this.selectedInmueble.set(data);
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al cargar detalles.'));
          this.closeDetail();
        }
      });
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedInmueble.set(null);
  }

  openUnidadComposer(unidad?: Unidad): void {
    if (unidad) {
      this.editingUnidadId.set(unidad.id);
      this.unidadForm.reset({
        codigo: unidad.codigo,
        nombre: unidad.nombre,
        tipo: unidad.tipo,
        numero_piso: unidad.numero_piso,
        dormitorios: unidad.dormitorios,
        banos: unidad.banos,
        area_m2: unidad.area_m2,
        capacidad: unidad.capacidad,
        moneda: unidad.moneda,
        precio_base: unidad.precio_base,
        deposito_requerido: unidad.deposito_requerido,
        incluye_agua: unidad.incluye_agua,
        incluye_luz: unidad.incluye_luz,
        incluye_internet: unidad.incluye_internet,
        notas: unidad.notas,
        estado: unidad.estado
      });
    } else {
      this.editingUnidadId.set(null);
      this.unidadForm.reset({
        tipo: 'departamento',
        numero_piso: 1,
        dormitorios: 1,
        banos: 1,
        area_m2: 45,
        capacidad: 2,
        moneda: 'PEN',
        precio_base: 0,
        deposito_requerido: 0,
        incluye_agua: false,
        incluye_luz: false,
        incluye_internet: false,
        estado: 'disponible'
      });
    }
    this.isUnidadComposerOpen.set(true);
  }

  closeUnidadComposer(): void {
    this.isUnidadComposerOpen.set(false);
  }

  submitUnidad(): void {
    if (this.unidadForm.invalid) {
      this.unidadForm.markAllAsTouched();
      return;
    }

    const inmueble = this.selectedInmueble();
    if (!inmueble) return;

    const payload: UnidadPayload = this.unidadForm.getRawValue();
    const editingId = this.editingUnidadId();
    
    const request = editingId
      ? this.inmueblesService.updateUnidad(inmueble.id, editingId, payload)
      : this.inmueblesService.createUnidad(inmueble.id, payload);

    this.isSaving.set(true);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', editingId ? 'Unidad actualizada.' : 'Unidad registrada.');
          this.closeUnidadComposer();
          this.refreshSelectedInmueble();
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al guardar unidad.'));
        }
      });
  }

  openDeleteUnidad(unidad: Unidad): void {
    this.pendingDeleteUnidad.set(unidad);
  }

  confirmDeleteUnidad(): void {
    const target = this.pendingDeleteUnidad();
    const inmueble = this.selectedInmueble();
    const empresaId = this.empresa()?.id;
    if (!target || !inmueble || !empresaId) return;

    this.isSaving.set(true);
    this.inmueblesService
      .deleteUnidad(inmueble.id, target.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isSaving.set(false);
          this.pendingDeleteUnidad.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Unidad eliminada.');
          this.refreshSelectedInmueble();
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al eliminar unidad.'));
        }
      });
  }

  private refreshSelectedInmueble(): void {
    const current = this.selectedInmueble();
    if (current) this.viewDetail(current);
  }

  private setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 5000);
  }

  feedbackClasses(tone: FeedbackTone): string {
    return tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'activa': return 'bg-emerald-100 text-emerald-700';
      case 'mantenimiento': return 'bg-amber-100 text-amber-700';
      case 'inactiva': return 'bg-slate-100 text-slate-700';
      case 'disponible': return 'bg-emerald-100 text-emerald-700';
      case 'reservado': return 'bg-blue-100 text-blue-700';
      case 'ocupado': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}
