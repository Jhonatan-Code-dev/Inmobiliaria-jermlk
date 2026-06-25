import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ReclamacionesService } from '../services/reclamaciones.service';
import { EmpresaPublica, Reclamacion } from '../core/reclamaciones/reclamaciones.models';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';

@Component({
  selector: 'app-libro-reclamaciones-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styles: [`
    :host { display: block; min-height: 100vh; background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent 40%), #fafafa; }
    .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.6); }
  `],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
          Cumplimiento Normativo INDECOPI
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Libro de Reclamaciones</h1>
        <p class="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
          Conforme al Código de Protección y Defensa del Consumidor, ponemos a su disposición nuestro canal para registrar reclamos o quejas.
        </p>
      </div>

      <!-- Success Screen -->
      <div *ngIf="registeredClaim(); else formTemplate" class="glass-card rounded-2xl p-8 shadow-xl border border-emerald-100 text-center animate-zoom">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
          <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900">¡Registro Exitoso!</h2>
        <p class="mt-3 text-sm text-gray-600 max-w-md mx-auto">
          Su reclamación ha sido procesada con éxito. Hemos generado su comprobante oficial en formato PDF.
        </p>

        <!-- Claim Summary Box -->
        <div class="my-6 bg-gray-50 border border-gray-100 rounded-xl p-4 inline-block text-left">
          <div class="text-xs text-gray-400 uppercase font-semibold">Código de Registro</div>
          <div class="text-xl font-bold text-gray-800 tracking-wider">{{ registeredClaim()?.codigo }}</div>
          <div class="mt-2 text-xs text-gray-500">Nombres: {{ registeredClaim()?.nombres }} {{ registeredClaim()?.apellidos }}</div>
          <div class="text-xs text-gray-500">Fecha: {{ registeredClaim()?.creado_en | date:'medium' }}</div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button (click)="downloadPdfCopy()" 
                  [disabled]="isDownloadingPdf()"
                  class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2">
            <span *ngIf="isDownloadingPdf()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Descargar Comprobante (PDF)</span>
          </button>
          <a routerLink="/" class="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all">
            Ir al Inicio
          </a>
        </div>
      </div>

      <!-- Main Form Template -->
      <ng-template #formTemplate>
        <div class="glass-card rounded-2xl p-6 md:p-8 shadow-xl">
          <!-- Feedback Alert -->
          <div *ngIf="feedback()" [ngClass]="feedback()?.tone === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'" class="mb-6 p-4 rounded-xl border flex items-start gap-3">
            <svg class="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="text-sm font-medium">{{ feedback()?.message }}</span>
          </div>

          <form [formGroup]="reclamacionForm" (ngSubmit)="onSubmit()" class="space-y-8">
            <!-- 0. Empresa Selection -->
            <div class="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
              <label class="block text-sm font-semibold text-indigo-900 mb-1.5">Establecimiento / Real Estate</label>
              <select formControlName="empresa_id" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option [value]="0">Seleccione la inmobiliaria...</option>
                <option *ngFor="let emp of empresas()" [value]="emp.id">{{ emp.nombre }}</option>
              </select>
              <div *ngIf="reclamacionForm.get('empresa_id')?.touched && reclamacionForm.get('empresa_id')?.value === 0" class="text-xs text-red-600 mt-1">
                Debe seleccionar una inmobiliaria de la lista.
              </div>
            </div>

            <!-- 1. Datos Personales -->
            <div>
              <h3 class="text-lg font-bold text-gray-800 border-b pb-1.5 mb-4">1. Identificación del Consumidor Reclamante</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombres *</label>
                  <input type="text" formControlName="nombres" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Juan Andrés">
                  <div *ngIf="reclamacionForm.get('nombres')?.touched && reclamacionForm.get('nombres')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('nombres')?.errors?.['required']">El nombre es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('nombres')?.errors?.['minlength']">Mínimo 2 caracteres.</span>
                    <span *ngIf="reclamacionForm.get('nombres')?.errors?.['maxlength']">Máximo 150 caracteres.</span>
                    <span *ngIf="reclamacionForm.get('nombres')?.errors?.['pattern']">Solo se permiten letras y espacios.</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Apellidos *</label>
                  <input type="text" formControlName="apellidos" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Pérez Ramos">
                  <div *ngIf="reclamacionForm.get('apellidos')?.touched && reclamacionForm.get('apellidos')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('apellidos')?.errors?.['required']">El apellido es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('apellidos')?.errors?.['minlength']">Mínimo 2 caracteres.</span>
                    <span *ngIf="reclamacionForm.get('apellidos')?.errors?.['maxlength']">Máximo 150 caracteres.</span>
                    <span *ngIf="reclamacionForm.get('apellidos')?.errors?.['pattern']">Solo se permiten letras y espacios.</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Documento *</label>
                  <select formControlName="tipo_documento" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                    <option value="CE">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Número de Documento *</label>
                  <input type="text" formControlName="numero_documento" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. 70654321">
                  <div *ngIf="reclamacionForm.get('numero_documento')?.touched && reclamacionForm.get('numero_documento')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('numero_documento')?.errors?.['required']">El número de documento es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('numero_documento')?.errors?.['pattern']">
                      Formato inválido ({{ reclamacionForm.get('tipo_documento')?.value === 'DNI' ? 'Debe tener exactamente 8 dígitos' : 'Debe tener entre 5 y 15 caracteres alfanuméricos' }}).
                    </span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teléfono *</label>
                  <input type="text" formControlName="telefono" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. 987654321">
                  <div *ngIf="reclamacionForm.get('telefono')?.touched && reclamacionForm.get('telefono')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('telefono')?.errors?.['required']">El teléfono es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('telefono')?.errors?.['pattern']">Formato inválido (de 7 a 15 dígitos, ej: +51 987654321).</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. juan.perez@email.com">
                  <div *ngIf="reclamacionForm.get('email')?.touched && reclamacionForm.get('email')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('email')?.errors?.['required']">El correo es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('email')?.errors?.['email'] || reclamacionForm.get('email')?.errors?.['pattern']">Debe ser un correo electrónico válido.</span>
                    <span *ngIf="reclamacionForm.get('email')?.errors?.['maxlength']">Máximo 100 caracteres.</span>
                  </div>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dirección de Domicilio *</label>
                  <input type="text" formControlName="direccion" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Av. Larco 123, Miraflores, Lima">
                  <div *ngIf="reclamacionForm.get('direccion')?.touched && reclamacionForm.get('direccion')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('direccion')?.errors?.['required']">La dirección es obligatoria.</span>
                    <span *ngIf="reclamacionForm.get('direccion')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                    <span *ngIf="reclamacionForm.get('direccion')?.errors?.['maxlength']">Máximo 255 caracteres.</span>
                  </div>
                </div>

                <!-- Minor age details -->
                <div class="md:col-span-2 flex items-center gap-2 mt-2">
                  <input type="checkbox" formControlName="menor_edad" id="chkMenor" class="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                  <label for="chkMenor" class="text-sm text-gray-600 select-none font-medium">Soy menor de edad</label>
                </div>

                <div *ngIf="reclamacionForm.get('menor_edad')?.value" class="md:col-span-2 bg-gray-50 p-4 border border-gray-100 rounded-xl">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo del Apoderado / Padre *</label>
                  <input type="text" formControlName="nombre_apoderado" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. María Ramos (Madre)">
                  <div *ngIf="reclamacionForm.get('nombre_apoderado')?.touched && reclamacionForm.get('nombre_apoderado')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('nombre_apoderado')?.errors?.['required']">El nombre del apoderado es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('nombre_apoderado')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                    <span *ngIf="reclamacionForm.get('nombre_apoderado')?.errors?.['pattern']">Solo se permiten letras y espacios.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Datos del Bien -->
            <div>
              <h3 class="text-lg font-bold text-gray-800 border-b pb-1.5 mb-4">2. Identificación del Bien Contratado</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Bien *</label>
                  <div class="flex items-center gap-4 mt-2">
                    <label class="inline-flex items-center gap-2 font-medium text-sm text-gray-700">
                      <input type="radio" value="PRODUCTO" formControlName="tipo_bien" class="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500">
                      Producto (Inmueble, lote, etc.)
                    </label>
                    <label class="inline-flex items-center gap-2 font-medium text-sm text-gray-700">
                      <input type="radio" value="SERVICIO" formControlName="tipo_bien" class="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500">
                      Servicio (Asesoría, corretaje, etc.)
                    </label>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Monto Reclamado (S/.)</label>
                  <input type="number" step="0.01" formControlName="monto_reclamado" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. 1200.00">
                  <div *ngIf="reclamacionForm.get('monto_reclamado')?.touched && reclamacionForm.get('monto_reclamado')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('monto_reclamado')?.errors?.['min']">El monto no puede ser negativo.</span>
                  </div>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción del Bien *</label>
                  <textarea rows="3" formControlName="descripcion_bien" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Departamento 402 en Proyecto Soles de Huanchaco..."></textarea>
                  <div *ngIf="reclamacionForm.get('descripcion_bien')?.touched && reclamacionForm.get('descripcion_bien')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('descripcion_bien')?.errors?.['required']">La descripción del bien es obligatoria.</span>
                    <span *ngIf="reclamacionForm.get('descripcion_bien')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Detalle de Reclamación -->
            <div>
              <h3 class="text-lg font-bold text-gray-800 border-b pb-1.5 mb-4">3. Detalle de Reclamación y Pedido del Consumidor</h3>
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Incidencia *</label>
                  <div class="flex items-start gap-6 mt-2">
                    <label class="inline-flex items-start gap-2">
                      <input type="radio" value="RECLAMO" formControlName="tipo_reclamacion" class="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 mt-0.5">
                      <div>
                        <span class="text-sm font-semibold text-gray-700 block">Reclamo</span>
                        <span class="text-xs text-gray-400">Disconformidad relacionada directamente con el producto o servicio adquirido.</span>
                      </div>
                    </label>
                    <label class="inline-flex items-start gap-2">
                      <input type="radio" value="QUEJA" formControlName="tipo_reclamacion" class="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 mt-0.5">
                      <div>
                        <span class="text-sm font-semibold text-gray-700 block">Queja</span>
                        <span class="text-xs text-gray-400">Descontento o malestar respecto a la atención al cliente, demoras, etc.</span>
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Detalle de la Queja o Reclamo *</label>
                  <textarea rows="4" formControlName="detalle_reclamacion" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Escriba los detalles con la mayor claridad posible..."></textarea>
                  <div *ngIf="reclamacionForm.get('detalle_reclamacion')?.touched && reclamacionForm.get('detalle_reclamacion')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('detalle_reclamacion')?.errors?.['required']">El detalle de la reclamación es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('detalle_reclamacion')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pedido o Acción Concreta Solicitada *</label>
                  <textarea rows="3" formControlName="pedido_consumidor" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Solicito la devolución del depósito o reprogramación de firma..."></textarea>
                  <div *ngIf="reclamacionForm.get('pedido_consumidor')?.touched && reclamacionForm.get('pedido_consumidor')?.invalid" class="text-xs text-red-600 mt-1">
                    <span *ngIf="reclamacionForm.get('pedido_consumidor')?.errors?.['required']">El pedido solicitado es obligatorio.</span>
                    <span *ngIf="reclamacionForm.get('pedido_consumidor')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit buttons -->
            <div class="pt-4 border-t flex flex-col sm:flex-row justify-end items-center gap-3">
              <a routerLink="/" class="w-full sm:w-auto text-center px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-all">
                Cancelar
              </a>
              <button type="submit" 
                      [disabled]="isLoading() || reclamacionForm.invalid || reclamacionForm.get('empresa_id')?.value === 0"
                      class="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <span *ngIf="isLoading()" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Registrar Reclamación</span>
              </button>
            </div>
          </form>
        </div>
      </ng-template>
    </div>
  `
})
export class LibroReclamacionesPageComponent implements OnInit {
  private readonly reclamacionesService = inject(ReclamacionesService);
  private readonly fb = inject(FormBuilder);

  readonly empresas = signal<EmpresaPublica[]>([]);
  readonly isLoading = signal(false);
  readonly isDownloadingPdf = signal(false);
  readonly feedback = signal<{ tone: 'success' | 'error'; message: string } | null>(null);
  readonly registeredClaim = signal<Reclamacion | null>(null);

  readonly reclamacionForm = this.fb.nonNullable.group({
    empresa_id: [0, [Validators.required, Validators.min(1)]],
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/)]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/)]],
    tipo_documento: ['DNI', [Validators.required]],
    numero_documento: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    telefono: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]{6,15}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100), Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
    menor_edad: [false],
    nombre_apoderado: ['', [Validators.maxLength(200)]],
    tipo_bien: ['PRODUCTO' as 'PRODUCTO' | 'SERVICIO', [Validators.required]],
    monto_reclamado: [0.0, [Validators.min(0)]],
    descripcion_bien: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    tipo_reclamacion: ['RECLAMO' as 'RECLAMO' | 'QUEJA', [Validators.required]],
    detalle_reclamacion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(4000)]],
    pedido_consumidor: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(2000)]]
  });

  ngOnInit(): void {
    this.loadEmpresas();

    // Condicionalmente requerir apoderado si es menor de edad
    this.reclamacionForm.get('menor_edad')?.valueChanges.subscribe(isMinor => {
      const apoderadoCtrl = this.reclamacionForm.get('nombre_apoderado');
      if (isMinor) {
        apoderadoCtrl?.setValidators([
          Validators.required, 
          Validators.minLength(5), 
          Validators.maxLength(200), 
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/)
        ]);
      } else {
        apoderadoCtrl?.clearValidators();
        apoderadoCtrl?.patchValue('');
      }
      apoderadoCtrl?.updateValueAndValidity();
    });

    // Dinámicamente actualizar validadores de numero_documento según tipo_documento
    this.reclamacionForm.get('tipo_documento')?.valueChanges.subscribe(tipo => {
      const numCtrl = this.reclamacionForm.get('numero_documento');
      if (tipo === 'DNI') {
        numCtrl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
      } else {
        numCtrl?.setValidators([Validators.required, Validators.pattern(/^[a-zA-Z0-9-]{5,15}$/)]);
      }
      numCtrl?.updateValueAndValidity();
    });
  }

  loadEmpresas(): void {
    this.reclamacionesService.getPublicEmpresas().subscribe({
      next: (data) => this.empresas.set(data),
      error: () => this.setFeedback('error', 'Error al cargar listado de empresas')
    });
  }

  onSubmit(): void {
    if (this.reclamacionForm.invalid || Number(this.reclamacionForm.get('empresa_id')?.value) === 0) {
      this.reclamacionForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const rawPayload = this.reclamacionForm.getRawValue();
    const payload = {
      ...rawPayload,
      empresa_id: Number(rawPayload.empresa_id),
      monto_reclamado: Number(rawPayload.monto_reclamado || 0)
    };

    this.reclamacionesService.registrarPublica(payload as any)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (claim) => {
          this.registeredClaim.set(claim);
          this.setFeedback('success', 'Su reclamación ha sido registrada. Código: ' + claim.codigo);
          // Auto trigger pdf download
          this.downloadPdfCopy();
        },
        error: (err) => {
          this.setFeedback('error', extractHttpErrorMessage(err, 'Error al enviar reclamación. Intente nuevamente.'));
        }
      });
  }

  downloadPdfCopy(): void {
    const claim = this.registeredClaim();
    if (!claim) return;

    this.isDownloadingPdf.set(true);
    this.reclamacionesService.descargarPdfPublico(claim.id, claim.empresa_id)
      .pipe(finalize(() => this.isDownloadingPdf.set(false)))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reclamo_${claim.codigo}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.setFeedback('error', 'No se pudo descargar el PDF automáticamente. Puede intentar descargar de nuevo.');
        }
      });
  }

  setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedback.set({ tone, message });
    if (tone === 'success') {
      setTimeout(() => this.feedback.set(null), 5000);
    }
  }
}
