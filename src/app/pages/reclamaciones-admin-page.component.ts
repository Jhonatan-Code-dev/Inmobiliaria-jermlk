import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ReclamacionesService } from '../services/reclamaciones.service';
import { AuthService } from '../services/auth.service';
import { Reclamacion } from '../core/reclamaciones/reclamaciones.models';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';

@Component({
  selector: 'app-reclamaciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; padding: 1.5rem; }
    .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); }
  `],
  template: `
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Title Card -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Libro de Reclamaciones</h1>
          <p class="text-xs text-gray-500 mt-1">Supervisión, atención y descargo legal de las reclamaciones de los usuarios.</p>
        </div>
        <button (click)="openRegisterModal()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2">
          <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Reclamación Interna
        </button>
      </div>

      <!-- Feedback Banner -->
      <div *ngIf="feedback()" [ngClass]="feedback()?.tone === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'" class="p-4 rounded-xl border flex items-start gap-3">
        <svg class="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm font-medium">{{ feedback()?.message }}</span>
      </div>

      <!-- Main content list -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Loader -->
        <div *ngIf="isLoading()" class="p-12 flex flex-col justify-center items-center gap-3">
          <div class="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-gray-400 font-medium">Cargando reclamaciones...</span>
        </div>

        <!-- Table -->
        <div *ngIf="!isLoading()" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-100">
                <th class="p-4">Código</th>
                <th class="p-4">Reclamante</th>
                <th class="p-4">Tipo</th>
                <th class="p-4">Bien</th>
                <th class="p-4">Fecha</th>
                <th class="p-4">Estado</th>
                <th class="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 text-sm">
              <tr *ngFor="let item of list()" class="hover:bg-gray-50/55 transition-all">
                <td class="p-4 font-bold text-gray-800 tracking-wider">{{ item.codigo }}</td>
                <td class="p-4">
                  <div class="font-semibold text-gray-900">{{ item.nombres }} {{ item.apellidos }}</div>
                  <div class="text-xs text-gray-400">{{ item.tipo_documento }}: {{ item.numero_documento }}</div>
                </td>
                <td class="p-4">
                  <span [ngClass]="item.tipo_reclamacion === 'RECLAMO' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'" 
                        class="px-2 py-0.5 rounded text-xs font-semibold border">
                    {{ item.tipo_reclamacion }}
                  </span>
                </td>
                <td class="p-4 text-xs text-gray-600">{{ item.tipo_bien }}</td>
                <td class="p-4 text-xs text-gray-500">{{ item.creado_en | date:'mediumDate' }}</td>
                <td class="p-4">
                  <span [ngClass]="item.estado === 'PENDIENTE' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'" 
                        class="px-2 py-0.5 rounded text-xs font-semibold border">
                    {{ item.estado }}
                  </span>
                </td>
                <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
                  <button (click)="openDetail(item)" class="text-xs font-semibold text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg transition-all">
                    Ver Detalles
                  </button>
                  <button (click)="downloadPdf(item)" class="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all">
                    PDF
                  </button>
                  <button (click)="openDelete(item)" class="text-xs font-semibold text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all">
                    Borrar
                  </button>
                </td>
              </tr>
              <tr *ngIf="list().length === 0">
                <td colspan="7" class="p-12 text-center text-gray-400">No se encontraron reclamaciones registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="!isLoading() && total() > 0" class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs text-gray-500">Mostrando registros de reclamación (Total: {{ total() }})</span>
          <div class="flex items-center gap-1.5">
            <button [disabled]="currentPage() <= 1" (click)="goToPage(currentPage() - 1)" class="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-xs font-semibold text-gray-700">Pág. {{ currentPage() }} de {{ totalPages() }}</span>
            <button [disabled]="currentPage() >= totalPages()" (click)="goToPage(currentPage() + 1)" class="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail & Response Modal -->
    <div *ngIf="selectedClaim()" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade">
      <div class="glass-modal w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 class="font-bold text-gray-900">Hoja Nro: {{ selectedClaim()?.codigo }}</h3>
            <span class="text-xs text-gray-400">Registrado el {{ selectedClaim()?.creado_en | date:'medium' }}</span>
          </div>
          <button (click)="closeDetail()" class="text-gray-400 hover:text-gray-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- 1. Consumer -->
          <div>
            <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">1. Identificación del Consumidor</h4>
            <div class="bg-gray-50 rounded-xl p-4 space-y-1.5 text-xs text-gray-600">
              <div><strong class="text-gray-700">Nombre:</strong> {{ selectedClaim()?.nombres }} {{ selectedClaim()?.apellidos }}</div>
              <div><strong class="text-gray-700">Documento:</strong> {{ selectedClaim()?.tipo_documento }} - {{ selectedClaim()?.numero_documento }}</div>
              <div><strong class="text-gray-700">Contacto:</strong> {{ selectedClaim()?.telefono }} | {{ selectedClaim()?.email }}</div>
              <div><strong class="text-gray-700">Dirección:</strong> {{ selectedClaim()?.direccion }}</div>
              <div *ngIf="selectedClaim()?.menor_edad" class="text-amber-700 font-medium">
                * Consumidor Menor de Edad. Apoderado: {{ selectedClaim()?.nombre_apoderado }}
              </div>
            </div>
          </div>

          <!-- 2. Bien Contratado -->
          <div>
            <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">2. Identificación del Bien</h4>
            <div class="bg-gray-50 rounded-xl p-4 space-y-1.5 text-xs text-gray-600">
              <div><strong class="text-gray-700">Tipo de Bien:</strong> {{ selectedClaim()?.tipo_bien }}</div>
              <div><strong class="text-gray-700">Monto Reclamado:</strong> S/. {{ selectedClaim()?.monto_reclamado | number:'1.2-2' }}</div>
              <div><strong class="text-gray-700">Descripción del Bien:</strong> {{ selectedClaim()?.descripcion_bien }}</div>
            </div>
          </div>

          <!-- 3. Detalle Reclamacion -->
          <div>
            <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">3. Detalle de Reclamación & Pedido</h4>
            <div class="bg-gray-50 rounded-xl p-4 space-y-2.5 text-xs text-gray-600">
              <div>
                <strong class="text-gray-700 block">Tipo:</strong>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">{{ selectedClaim()?.tipo_reclamacion }}</span>
              </div>
              <div>
                <strong class="text-gray-700 block">Detalle de la Queja/Reclamo:</strong>
                <p class="mt-0.5 text-gray-600 leading-relaxed">{{ selectedClaim()?.detalle_reclamacion }}</p>
              </div>
              <div>
                <strong class="text-gray-700 block">Pedido del Consumidor:</strong>
                <p class="mt-0.5 text-gray-600 leading-relaxed">{{ selectedClaim()?.pedido_consumidor }}</p>
              </div>
            </div>
          </div>

          <!-- 4. Acciones y Respuesta -->
          <div class="border-t pt-4">
            <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">4. Respuesta y Descargo del Proveedor</h4>
            
            <!-- Show existing response -->
            <div *ngIf="selectedClaim()?.estado === 'RESUELTO'" class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
              <div><strong class="text-emerald-800">Fecha de Respuesta:</strong> {{ selectedClaim()?.respondido_en | date:'medium' }}</div>
              <div><strong class="text-emerald-800">Detalle de Respuesta:</strong></div>
              <p class="mt-1 leading-relaxed text-emerald-950">{{ selectedClaim()?.respuesta_detalle }}</p>
            </div>

            <!-- Respond Form -->
            <div *ngIf="selectedClaim()?.estado === 'PENDIENTE'" class="space-y-3">
              <label class="block text-xs font-semibold text-gray-500 uppercase">Redactar Respuesta Oficial *</label>
              <textarea [(ngModel)]="descargoTexto" rows="3" class="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ingrese el descargo o acción correctiva tomada..."></textarea>
              <div class="flex justify-end">
                <button [disabled]="isSavingResponse() || !descargoTexto.trim()" (click)="submitResponse()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-semibold transition-all">
                  <span *ngIf="isSavingResponse()">Guardando...</span>
                  <span *ngIf="!isSavingResponse()">Registrar Respuesta Legal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
          <button (click)="closeDetail()" class="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-xs transition-all">
            Cerrar
          </button>
          <button (click)="downloadPdf(selectedClaim()!)" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all">
            Descargar PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Register Claim Internal Modal -->
    <div *ngIf="isRegisterModalOpen()" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="glass-modal w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 class="font-bold text-gray-900">Registrar Reclamación Interna</h3>
            <p class="text-xs text-gray-500">Asociada automáticamente a la inmobiliaria activa</p>
          </div>
          <button (click)="closeRegisterModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 overflow-y-auto space-y-6">
          <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="space-y-6">
            <!-- 1. Consumidor -->
            <div>
              <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">1. Datos del Arrendatario / Reclamante</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Nombres *</label>
                  <input type="text" formControlName="nombres" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('nombres')?.touched && registerForm.get('nombres')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('nombres')?.errors?.['required']">El nombre es obligatorio.</span>
                    <span *ngIf="registerForm.get('nombres')?.errors?.['minlength']">Mínimo 2 caracteres.</span>
                    <span *ngIf="registerForm.get('nombres')?.errors?.['maxlength']">Máximo 150 caracteres.</span>
                    <span *ngIf="registerForm.get('nombres')?.errors?.['pattern']">Solo letras y espacios.</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Apellidos *</label>
                  <input type="text" formControlName="apellidos" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('apellidos')?.touched && registerForm.get('apellidos')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('apellidos')?.errors?.['required']">El apellido es obligatorio.</span>
                    <span *ngIf="registerForm.get('apellidos')?.errors?.['minlength']">Mínimo 2 caracteres.</span>
                    <span *ngIf="registerForm.get('apellidos')?.errors?.['maxlength']">Máximo 150 caracteres.</span>
                    <span *ngIf="registerForm.get('apellidos')?.errors?.['pattern']">Solo letras y espacios.</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Tipo de Documento *</label>
                  <select formControlName="tipo_documento" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                    <option value="CE">Carnet de Extranjería</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Número de Documento *</label>
                  <input type="text" formControlName="numero_documento" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('numero_documento')?.touched && registerForm.get('numero_documento')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('numero_documento')?.errors?.['required']">El número es obligatorio.</span>
                    <span *ngIf="registerForm.get('numero_documento')?.errors?.['pattern']">
                      Formato inválido ({{ registerForm.get('tipo_documento')?.value === 'DNI' ? '8 dígitos' : '5-15 alfanuméricos' }}).
                    </span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Teléfono *</label>
                  <input type="text" formControlName="telefono" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('telefono')?.touched && registerForm.get('telefono')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('telefono')?.errors?.['required']">El teléfono es obligatorio.</span>
                    <span *ngIf="registerForm.get('telefono')?.errors?.['pattern']">Formato inválido (7-15 dígitos).</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('email')?.errors?.['required']">El correo es obligatorio.</span>
                    <span *ngIf="registerForm.get('email')?.errors?.['email'] || registerForm.get('email')?.errors?.['pattern']">Correo inválido.</span>
                    <span *ngIf="registerForm.get('email')?.errors?.['maxlength']">Máximo 100 caracteres.</span>
                  </div>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Dirección de Domicilio *</label>
                  <input type="text" formControlName="direccion" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('direccion')?.touched && registerForm.get('direccion')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('direccion')?.errors?.['required']">La dirección es obligatoria.</span>
                    <span *ngIf="registerForm.get('direccion')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                    <span *ngIf="registerForm.get('direccion')?.errors?.['maxlength']">Máximo 255 caracteres.</span>
                  </div>
                </div>
                <div class="md:col-span-2 flex items-center gap-2 py-1">
                  <input type="checkbox" formControlName="menor_edad" id="chkMenorInt" class="h-4 w-4 text-indigo-600 rounded border-gray-300">
                  <label for="chkMenorInt" class="text-xs font-semibold text-gray-600 select-none">Es menor de edad</label>
                </div>
                <div *ngIf="registerForm.get('menor_edad')?.value" class="md:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Nombre del Padre / Madre / Apoderado *</label>
                  <input type="text" formControlName="nombre_apoderado" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('nombre_apoderado')?.touched && registerForm.get('nombre_apoderado')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('nombre_apoderado')?.errors?.['required']">El apoderado es obligatorio.</span>
                    <span *ngIf="registerForm.get('nombre_apoderado')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                    <span *ngIf="registerForm.get('nombre_apoderado')?.errors?.['pattern']">Solo letras y espacios.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Bien y Reclamacion -->
            <div>
              <h4 class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">2. Detalles del Reclamo</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Tipo de Bien *</label>
                  <select formControlName="tipo_bien" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="PRODUCTO">Producto (Departamento, Lote, Local)</option>
                    <option value="SERVICIO">Servicio (Administración, Limpieza)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Monto Reclamado (S/.)</label>
                  <input type="number" step="0.01" formControlName="monto_reclamado" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('monto_reclamado')?.touched && registerForm.get('monto_reclamado')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('monto_reclamado')?.errors?.['min']">No puede ser negativo.</span>
                  </div>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Descripción del Bien *</label>
                  <input type="text" formControlName="descripcion_bien" placeholder="Ej. Contrato de Alquiler de Dpto 301" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <div *ngIf="registerForm.get('descripcion_bien')?.touched && registerForm.get('descripcion_bien')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('descripcion_bien')?.errors?.['required']">La descripción es obligatoria.</span>
                    <span *ngIf="registerForm.get('descripcion_bien')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Tipo de Reclamación *</label>
                  <select formControlName="tipo_reclamacion" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="RECLAMO">Reclamo</option>
                    <option value="QUEJA">Queja</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Detalle del Reclamo/Queja *</label>
                  <textarea rows="3" formControlName="detalle_reclamacion" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  <div *ngIf="registerForm.get('detalle_reclamacion')?.touched && registerForm.get('detalle_reclamacion')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('detalle_reclamacion')?.errors?.['required']">El detalle es obligatorio.</span>
                    <span *ngIf="registerForm.get('detalle_reclamacion')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                  </div>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-xs font-semibold text-gray-500 mb-1">Pedido Concreto *</label>
                  <textarea rows="2" formControlName="pedido_consumidor" class="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  <div *ngIf="registerForm.get('pedido_consumidor')?.touched && registerForm.get('pedido_consumidor')?.invalid" class="text-[10px] text-red-600 mt-0.5">
                    <span *ngIf="registerForm.get('pedido_consumidor')?.errors?.['required']">El pedido concreto es obligatorio.</span>
                    <span *ngIf="registerForm.get('pedido_consumidor')?.errors?.['minlength']">Mínimo 5 caracteres.</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit footer -->
            <div class="border-t pt-4 flex justify-end gap-2">
              <button type="button" (click)="closeRegisterModal()" class="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-xs">
                Cancelar
              </button>
              <button type="submit" [disabled]="registerForm.invalid || isRegistering()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-semibold transition-all">
                <span *ngIf="isRegistering()">Guardando...</span>
                <span *ngIf="!isRegistering()">Registrar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div *ngIf="pendingDeleteClaim()" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div class="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl space-y-4">
        <h3 class="font-bold text-gray-900 text-base">¿Eliminar Reclamación?</h3>
        <p class="text-xs text-gray-500 leading-relaxed">
          Esta acción eliminará de forma permanente el registro {{ pendingDeleteClaim()?.codigo }}. Esta operación no se puede deshacer.
        </p>
        <div class="flex justify-end gap-2">
          <button (click)="cancelDelete()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-all">
            Cancelar
          </button>
          <button (click)="confirmDelete()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-all">
            Eliminar Permanentemente
          </button>
        </div>
      </div>
    </div>
  `
})
export class ReclamacionesAdminPageComponent implements OnInit {
  private readonly reclamacionesService = inject(ReclamacionesService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly list = signal<Reclamacion[]>([]);
  readonly isLoading = signal(false);
  readonly isSavingResponse = signal(false);
  readonly isRegistering = signal(false);
  readonly isRegisterModalOpen = signal(false);

  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  readonly selectedClaim = signal<Reclamacion | null>(null);
  readonly pendingDeleteClaim = signal<Reclamacion | null>(null);
  readonly feedback = signal<{ tone: 'success' | 'error'; message: string } | null>(null);

  descargoTexto = '';

  readonly registerForm = this.fb.nonNullable.group({
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
    this.loadReclamaciones();

    // Condicionalmente requerir apoderado si es menor de edad
    this.registerForm.get('menor_edad')?.valueChanges.subscribe(isMinor => {
      const apoderadoCtrl = this.registerForm.get('nombre_apoderado');
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
    this.registerForm.get('tipo_documento')?.valueChanges.subscribe(tipo => {
      const numCtrl = this.registerForm.get('numero_documento');
      if (tipo === 'DNI') {
        numCtrl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
      } else {
        numCtrl?.setValidators([Validators.required, Validators.pattern(/^[a-zA-Z0-9-]{5,15}$/)]);
      }
      numCtrl?.updateValueAndValidity();
    });
  }

  loadReclamaciones(): void {
    const empId = this.authService.empresaId();
    if (!empId) return;

    this.isLoading.set(true);
    this.reclamacionesService.list(this.currentPage(), empId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.list.set(res.datos);
          this.total.set(res.paginacion.total);
          this.totalPages.set(res.paginacion.paginas);
        },
        error: (err) => {
          this.setFeedback('error', extractHttpErrorMessage(err, 'Error al cargar listado de reclamaciones'));
        }
      });
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
    this.loadReclamaciones();
  }

  openDetail(item: Reclamacion): void {
    this.selectedClaim.set(item);
    this.descargoTexto = '';
  }

  closeDetail(): void {
    this.selectedClaim.set(null);
  }

  openRegisterModal(): void {
    this.registerForm.reset({
      tipo_documento: 'DNI',
      tipo_bien: 'PRODUCTO',
      tipo_reclamacion: 'RECLAMO',
      monto_reclamado: 0.0,
      menor_edad: false
    });
    this.isRegisterModalOpen.set(true);
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen.set(false);
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const empId = this.authService.empresaId();
    if (!empId) {
      this.setFeedback('error', 'Sesión inválida o empresa no identificada.');
      return;
    }

    this.isRegistering.set(true);
    const formVal = this.registerForm.getRawValue();
    const payload = {
      ...formVal,
      empresa_id: Number(empId),
      monto_reclamado: Number(formVal.monto_reclamado || 0)
    };

    this.reclamacionesService.registrarPublica(payload as any)
      .pipe(finalize(() => this.isRegistering.set(false)))
      .subscribe({
        next: (claim) => {
          this.setFeedback('success', `Reclamación interna ${claim.codigo} registrada con éxito.`);
          this.closeRegisterModal();
          this.loadReclamaciones();
          // Auto trigger pdf download
          this.downloadPdf(claim);
        },
        error: (err) => {
          this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo guardar la reclamación interna.'));
        }
      });
  }

  openDelete(item: Reclamacion): void {
    this.pendingDeleteClaim.set(item);
  }

  cancelDelete(): void {
    this.pendingDeleteClaim.set(null);
  }

  confirmDelete(): void {
    const claim = this.pendingDeleteClaim();
    if (!claim) return;

    const empId = this.authService.empresaId();
    if (!empId) return;

    this.reclamacionesService.delete(claim.id, empId).subscribe({
      next: () => {
        this.setFeedback('success', 'Registro de reclamación eliminado con éxito.');
        this.pendingDeleteClaim.set(null);
        this.loadReclamaciones();
      },
      error: (err) => {
        this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo eliminar la reclamación.'));
      }
    });
  }

  submitResponse(): void {
    const claim = this.selectedClaim();
    if (!claim || !this.descargoTexto.trim()) return;

    this.isSavingResponse.set(true);
    this.reclamacionesService.responder(claim.id, this.descargoTexto)
      .pipe(finalize(() => this.isSavingResponse.set(false)))
      .subscribe({
        next: (updated) => {
          this.setFeedback('success', 'Respuesta registrada correctamente.');
          this.selectedClaim.set(updated);
          this.loadReclamaciones();
        },
        error: (err) => {
          this.setFeedback('error', extractHttpErrorMessage(err, 'Error al guardar respuesta.'));
        }
      });
  }

  downloadPdf(claim: Reclamacion): void {
    this.reclamacionesService.descargarPdfPublico(claim.id, claim.empresa_id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reclamacion_${claim.codigo}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.setFeedback('error', 'Error al generar o descargar el PDF.');
      }
    });
  }

  setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 4000);
  }
}
