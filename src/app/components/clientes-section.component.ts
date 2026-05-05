import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';
import {
  Cliente,
  ClientePayload,
  ClientesFilters,
  ClientesPaginacion,
  TipoIdentificacion
} from '../core/clientes/clientes.models';
import { AuthService } from '../services/auth.service';
import { ClientesService } from '../services/clientes.service';

type FeedbackTone = 'success' | 'error';

type FeedbackState = {
  readonly tone: FeedbackTone;
  readonly message: string;
};

const DEFAULT_PAGINATION: ClientesPaginacion = {
  total: 0,
  paginas: 0,
  pagina: 1,
  por_pagina: 10
};

@Component({
  selector: 'app-clientes-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clientes-section.component.html',
  styleUrl: './clientes-section.component.css'
})
export class ClientesSectionComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clientesService = inject(ClientesService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;

  readonly shellPanelClass = 'rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors';
  readonly secondaryPanelClass = 'rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors';

  readonly searchForm = this.formBuilder.nonNullable.group({
    buscar: ''
  });

  readonly clienteForm = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.maxLength(100)]],
    tipo_identificacion_id: [null as number | null, [Validators.required]],
    documento_numero: ['', [Validators.required, Validators.maxLength(20)]],
    correo: ['', [Validators.email]],
    fecha_nacimiento: ['', [Validators.required]],
    nacionalidad: ['Peruana', [Validators.required]],
    direccion: ['', [Validators.maxLength(255)]],
    contacto_emergencia: ['', [Validators.maxLength(100)]],
    telefono_emergencia: ['', [Validators.maxLength(20)]],
    notas: [''],
    estado: ['activo', [Validators.required]]
  });

  readonly clientes = signal<Cliente[]>([]);
  readonly tiposIdentificacion = signal<TipoIdentificacion[]>([]);
  readonly pagination = signal<ClientesPaginacion>(DEFAULT_PAGINATION);
  readonly feedback = signal<FeedbackState | null>(null);
  readonly isLoadingList = signal(false);
  readonly isLoadingDetail = signal(false);
  readonly isSaving = signal(false);
  readonly deletingId = signal<number | null>(null);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDeleteClient = signal<Cliente | null>(null);

  readonly hasFiltersActive = computed(() => {
    return this.searchForm.getRawValue().buscar.trim().length > 0;
  });

  readonly totalRecords = computed(() => this.pagination().total);

  readonly formTitle = computed(() =>
    this.editingId() ? 'Editar cliente existente' : 'Registrar nuevo cliente'
  );

  readonly formSubmitLabel = computed(() =>
    this.isSaving()
      ? this.editingId()
        ? 'Guardando cambios...'
        : 'Registrando cliente...'
      : this.editingId()
        ? 'Guardar cambios'
        : 'Registrar cliente'
  );

  readonly isDeleteDialogOpen = computed(() => this.pendingDeleteClient() !== null);

  readonly deleteDialogDescription = computed(() => {
    const client = this.pendingDeleteClient();
    if (!client) return '';
    return `"${client.nombres} ${client.apellidos || ''}" (${client.documento_numero})`;
  });

  ngOnInit(): void {
    this.loadClientes(1);
    this.loadTiposIdentificacion();
  }

  loadTiposIdentificacion(): void {
    this.clientesService
      .getTiposIdentificacion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tipos) => this.tiposIdentificacion.set(tipos),
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al cargar tipos de ID.'));
        }
      });
  }

  applySearch(): void {
    this.loadClientes(1);
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.loadClientes(1);
  }

  loadClientes(page = this.pagination().pagina): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) {
      this.setFeedback('error', 'No hay empresa configurada.');
      return;
    }

    const { buscar } = this.searchForm.getRawValue();
    const filters: ClientesFilters = {
      empresa_id: empresaId,
      pag: page,
      buscar: buscar.trim() || undefined
    };

    this.isLoadingList.set(true);

    this.clientesService
      .list(filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingList.set(false))
      )
      .subscribe({
        next: (response) => {
          this.clientes.set(response.datos);
          this.pagination.set(response.paginacion);
        },
        error: (error: unknown) => {
          this.setFeedback(
            'error',
            extractHttpErrorMessage(error, 'No se pudieron cargar los clientes.')
          );
        }
      });
  }

  goToPage(page: number): void {
    const totalPages = this.pagination().paginas;
    if (page < 1 || page > totalPages || page === this.pagination().pagina) {
      return;
    }
    this.loadClientes(page);
  }

  openComposerForNewClient(): void {
    this.resetComposerForm(true);
    this.feedback.set(null);
  }

  closeComposer(): void {
    this.resetComposerForm(false);
  }

  startEdit(cliente: Cliente): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.editingId.set(cliente.id);
    this.isComposerOpen.set(true);
    this.isLoadingDetail.set(true);
    this.feedback.set(null);

    this.clientesService
      .getById(cliente.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingDetail.set(false))
      )
      .subscribe({
        next: (data) => {
          this.clienteForm.reset({
            nombres: data.nombres,
            apellidos: data.apellidos,
            tipo_identificacion_id: data.tipo_identificacion_id,
            documento_numero: data.documento_numero,
            correo: data.correo,
            fecha_nacimiento: data.fecha_nacimiento
              ? this.formatDateForInput(new Date(data.fecha_nacimiento))
              : '',
            nacionalidad: data.nacionalidad,
            direccion: data.direccion,
            contacto_emergencia: data.contacto_emergencia,
            telefono_emergencia: data.telefono_emergencia,
            notas: data.notas,
            estado: data.estado
          });
        },
        error: (error) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al cargar detalles.'));
          this.closeComposer();
        }
      });
  }

  submitCliente(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      this.setFeedback('error', 'Completa los campos obligatorios.');
      return;
    }

    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    const rawValue = this.clienteForm.getRawValue();
    const tipoId = rawValue.tipo_identificacion_id;

    if (tipoId === null) {
      this.setFeedback('error', 'El tipo de identificación es obligatorio.');
      return;
    }

    const payload: ClientePayload = {
      ...rawValue,
      tipo_identificacion_id: Number(tipoId),
      empresa_id: Number(empresaId)
    };

    const editingId = this.editingId();
    const request = editingId
      ? this.clientesService.update(editingId, payload)
      : this.clientesService.create(payload);

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
            editingId ? 'Actualizado correctamente.' : 'Registrado correctamente.'
          );
          this.resetComposerForm(false);
          this.loadClientes(editingId ? this.pagination().pagina : 1);
        },
        error: (error: unknown) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al guardar.'));
        }
      });
  }

  openDeleteDialog(cliente: Cliente): void {
    this.pendingDeleteClient.set(cliente);
  }

  closeDeleteDialog(): void {
    if (!this.deletingId()) {
      this.pendingDeleteClient.set(null);
    }
  }

  confirmDeleteClient(): void {
    const client = this.pendingDeleteClient();
    const empresaId = this.empresa()?.id;
    if (!client || !empresaId) return;

    this.deletingId.set(client.id);

    this.clientesService
      .delete(client.id, empresaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deletingId.set(null);
          this.pendingDeleteClient.set(null);
        })
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Eliminado correctamente.');
          this.loadClientes(1);
        },
        error: (error: unknown) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'Error al eliminar.'));
        }
      });
  }

  private resetComposerForm(keepOpen: boolean): void {
    this.editingId.set(null);
    this.isComposerOpen.set(keepOpen);
    this.clienteForm.reset({
      tipo_identificacion_id: 1,
      nacionalidad: 'Peruana',
      estado: 'activo'
    });
  }

  private setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 5000);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  feedbackClasses(tone: FeedbackTone): string {
    return tone === 'success'
      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white'
      : 'border-rose-200 bg-rose-50 text-rose-800';
  }
}
