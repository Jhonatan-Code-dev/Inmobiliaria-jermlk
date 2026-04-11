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
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

const DEFAULT_PAGINATION: InmueblesPaginacion = { total: 0, paginas: 0, pagina_actual: 1, por_pagina: 10 };

@Component({
  selector: 'app-inmuebles-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; --primary: #0f172a; --accent: #10b981; }
    .premium-card { background: white; border: 1px solid #f1f5f9; border-radius: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05); }
    .btn-primary { background: var(--primary); color: white; border-radius: 0.75rem; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.2s; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .btn-primary:active { transform: scale(0.98); }
    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; }
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-slide { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section id="inmuebles" class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 border-l-8 border-emerald-500 pl-4">Gestión de Inmuebles</h2>
          <p class="text-slate-500 font-medium mt-1 ml-4">Control total sobre tus activos inmobiliarios y arriendos.</p>
        </div>
        <button (click)="openComposer()" class="btn-primary flex items-center gap-2 group">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Registrar Propiedad
        </button>
      </div>

      <!-- Filters & Stats -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-3 bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <form [formGroup]="searchForm" (ngSubmit)="applySearch()" class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px] relative">
              <input type="text" formControlName="buscar" placeholder="Buscar por nombre o dirección..." class="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"/>
              <svg class="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <select formControlName="tipo" (change)="applySearch()" class="h-12 px-4 rounded-xl bg-slate-50 border-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors">
              <option value="">Cualquier Tipo</option>
              <option value="edificio">Edificios</option>
              <option value="casa">Casas / Quintas</option>
            </select>
            <button type="submit" class="h-12 px-8 rounded-xl bg-emerald-500 text-white font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Filtrar</button>
          </form>
        </div>
        <div class="bg-slate-900 rounded-[1.5rem] p-6 text-white flex flex-col justify-center shadow-xl">
           <p class="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">Total Propiedades</p>
           <p class="text-4xl font-black">{{ totalRecords() }}</p>
        </div>
      </div>

      <!-- Main List -->
      <div class="premium-card overflow-hidden">
        @if (isLoadingList()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Inventario...</p>
          </div>
        } @else if (inmuebles().length) {
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left">
              <thead class="bg-slate-50/50 border-b border-slate-100">
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th class="px-8 py-5">Propiedad</th>
                  <th class="px-8 py-5">Ubicación</th>
                  <th class="px-8 py-5">Unidades</th>
                  <th class="px-8 py-5">Estado</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (item of inmuebles(); track item.id) {
                  <tr class="group hover:bg-slate-50/80 transition-all">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors shadow-sm">
                           <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ item.nombre }}</p>
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ item.tipo }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <p class="text-xs font-bold text-slate-600 truncate max-w-[200px]">{{ item.direccion }}</p>
                      <p class="text-[10px] text-slate-400">{{ item.ciudad }}</p>
                    </td>
                    <td class="px-8 py-6">
                      <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-black shadow-md">
                        {{ item.total_unidades }}
                      </span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="badge" [ngClass]="getStatusBadgeClass(item.estado)">{{ item.estado }}</span>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button (click)="viewDetail(item)" class="h-9 px-4 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors active:scale-95">Gestionar</button>
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button (click)="openDeleteInmueble(item)" class="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Pagination simple -->
          <div class="p-6 border-t border-slate-100 flex items-center justify-between">
            <p class="text-xs font-bold text-slate-400">Página {{ pagination().pagina_actual }} de {{ pagination().paginas }} </p>
            <div class="flex gap-2">
              <button [disabled]="pagination().pagina_actual === 1" (click)="loadInmuebles(pagination().pagina_actual - 1)" class="h-8 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">Atrás</button>
              <button [disabled]="pagination().pagina_actual >= pagination().paginas" (click)="loadInmuebles(pagination().pagina_actual + 1)" class="h-8 px-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        } @else {
          <div class="p-20 text-center flex flex-col items-center">
            <div class="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <svg class="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">Sin Propiedades</h3>
            <p class="text-slate-500 max-w-xs mt-2 font-medium">No se encontraron resultados para tu búsqueda. ¡Registra tu primer inmueble ahora!</p>
          </div>
        }
      </div>

      <!-- Slide-Over: Inmueble Detail -->
      @if (isDetailOpen()) {
        <div class="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" (click)="closeDetail()"></div>
          <div class="relative w-full max-w-3xl bg-slate-50 shadow-2xl animate-slide flex flex-col">
            <!-- Header Detail -->
            <div class="bg-white px-8 py-8 flex items-center justify-between border-b border-slate-200">
               <div>
                 <h3 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">{{ selectedInmueble()?.nombre }}</h3>
                 <p class="text-emerald-500 text-xs font-black tracking-widest uppercase mt-1">Gestión de Unidades</p>
               </div>
               <button (click)="closeDetail()" class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                 <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>

            <!-- Content Detail -->
            <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
               <!-- Stats Mini -->
               <div class="grid grid-cols-2 gap-4">
                  <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidades Registradas</p>
                    <p class="text-3xl font-black text-slate-900 mt-1">{{ selectedInmueble()?.unidades?.length || 0 }}</p>
                  </div>
                  <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Propiedad</p>
                    <span class="inline-block mt-2 badge" [ngClass]="getStatusBadgeClass(selectedInmueble()?.estado || '')">{{ selectedInmueble()?.estado }}</span>
                  </div>
               </div>

               <!-- Units List -->
               <div class="space-y-4">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Unidades de Alquiler</h4>
                    <button (click)="openUnidadComposer()" class="text-[10px] font-black text-emerald-600 border-2 border-emerald-600 rounded-lg px-3 py-1 hover:bg-emerald-600 hover:text-white transition-all uppercase">+ Nueva Unidad</button>
                  </div>

                  @if (selectedInmueble()?.unidades?.length) {
                    <div class="grid gap-3">
                       @for (u of selectedInmueble()?.unidades; track u.id) {
                         <div class="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-900 transition-all group">
                            <div class="flex items-center justify-between">
                               <div class="flex items-center gap-4">
                                  <div class="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                     <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                                  </div>
                                  <div>
                                    <p class="text-sm font-black text-slate-900">{{ u.nombre }}</p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ u.codigo }} • S/. {{ u.precio_base }}</p>
                                  </div>
                               </div>
                               <div class="flex items-center gap-2">
                                  <button (click)="openUnidadComposer(u)" class="h-8 px-3 rounded-lg text-[9px] font-bold uppercase bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all">Editar</button>
                                  <button (click)="openDeleteUnidad(u)" class="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center">
                                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                  </button>
                               </div>
                            </div>
                         </div>
                       }
                    </div>
                  } @else {
                    <div class="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                       <p class="text-xs font-bold text-slate-400 uppercase mb-4">Aún no hay unidades en este edificio.</p>
                       <button (click)="openUnidadComposer()" class="btn-primary">Añadir Primer Unidad</button>
                    </div>
                  }
               </div>
            </div>
          </div>
        </div>
      }

      <!-- Modals (Simplified logic for brevity but fully functional) -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
           <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden">
              <div class="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
                <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingId() ? 'Editar Propiedad' : 'Nueva Propiedad' }}</h3>
                <p class="text-xs font-medium text-slate-500 mt-0.5">Define los datos estructurales del inmueble.</p>
              </div>
              <form [formGroup]="inmuebleForm" (ngSubmit)="submitInmueble()" class="p-10 space-y-5">
                 <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1 col-span-2">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Inmueble</label>
                       <input type="text" formControlName="nombre" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all outline-none font-bold text-slate-900 text-sm"/>
                    </div>
                    
                    <div class="space-y-1 col-span-2">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción (Opcional)</label>
                       <textarea formControlName="descripcion" rows="2" class="w-full p-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all outline-none font-medium text-slate-800 text-sm resize-none"></textarea>
                    </div>

                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</label>
                       <select formControlName="tipo" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-700 text-sm">
                          <option value="edificio">Edificio</option>
                          <option value="casa">Casa</option>
                          <option value="quinta">Quinta</option>
                          <option value="condominio">Condominio</option>
                          <option value="otro">Otro</option>
                       </select>
                    </div>
                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                       <select formControlName="estado" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-700 text-sm">
                          <option value="activo">Activo</option>
                          <option value="inactivo">Inactivo</option>
                          <option value="mantenimiento">Mantenimiento</option>
                       </select>
                    </div>

                    <div class="space-y-1 col-span-2">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Dirección</label>
                       <input type="text" formControlName="direccion" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>

                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ciudad</label>
                       <input type="text" formControlName="ciudad" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>
                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Región</label>
                       <input type="text" formControlName="region" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>

                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">País</label>
                       <input type="text" formControlName="pais" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>
                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Código Postal</label>
                       <input type="text" formControlName="codigo_postal" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>

                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">N° Pisos</label>
                       <input type="number" formControlName="total_pisos" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>
                    <div class="space-y-1">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">N° Unidades</label>
                       <input type="number" formControlName="total_unidades" class="w-full h-11 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    </div>
                 </div>
                 <div class="flex gap-3 pt-4">
                    <button type="button" (click)="closeComposer()" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" [disabled]="isSaving()" class="flex-1 h-11 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50">
                       {{ isSaving() ? 'Procesando...' : 'Confirmar Datos' }}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
           <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="feedbackClasses(f.tone)">
              <div class="h-2 w-2 rounded-full animate-pulse" [ngClass]="f.tone === 'success' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
              <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
           </div>
        </div>
      }

      <!-- Confirmation Modals for Delete -->
      @if (pendingDeleteInmueble()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="pendingDeleteInmueble.set(null)"></div>
           <div class="relative w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl animate-zoom text-center">
              <div class="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                 <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">¿Eliminar Propiedad?</h3>
              <p class="text-xs font-medium text-slate-500 mt-2 mb-8">Esta acción borrará "{{ pendingDeleteInmueble()?.nombre }}" y todas sus unidades de forma permanente.</p>
              <div class="flex gap-2">
                 <button (click)="pendingDeleteInmueble.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-50 transition-all">Cancelar</button>
                 <button (click)="confirmDeleteInmueble()" [disabled]="isSaving()" class="flex-1 h-11 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50">Borrar Todo</button>
              </div>
           </div>
        </div>
      }

      <!-- Unidad Composer Modal (Simplified structure) -->
      @if (isUnidadComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeUnidadComposer()"></div>
           <div class="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl animate-zoom p-10 space-y-6">
              <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingUnidadId() ? 'Editar Unidad' : 'Nueva Unidad' }}</h3>
              <form [formGroup]="unidadForm" (ngSubmit)="submitUnidad()" class="space-y-4">
                 <div class="grid grid-cols-2 gap-4">
                    <input type="text" formControlName="codigo" placeholder="Código (Eje: A-101)" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                    <input type="text" formControlName="nombre" placeholder="Nombre descriptivo" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-sm"/>
                 </div>
                 <div class="grid grid-cols-2 gap-4 text-xs font-bold">
                    <div class="space-y-1">
                      <label class="text-slate-400 ml-1">Precio Base</label>
                      <input type="number" formControlName="precio_base" class="w-full h-12 px-4 rounded-xl bg-slate-50 outline-none"/>
                    </div>
                    <div class="space-y-1">
                      <label class="text-slate-400 ml-1">Piso</label>
                      <input type="number" formControlName="piso" class="w-full h-12 px-4 rounded-xl bg-slate-50 outline-none"/>
                    </div>
                 </div>
                 <div class="flex gap-3 pt-6">
                    <button type="button" (click)="closeUnidadComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all">Sincronizar</button>
                 </div>
              </form>
           </div>
        </div>
      }
    </section>
  `
})
export class InmueblesSectionComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inmueblesService = inject(InmueblesService);
  private readonly authService = inject(AuthService);

  readonly empresa = this.authService.empresa;
  readonly feedback = signal<FeedbackState | null>(null);
  readonly isLoadingList = signal(false);
  readonly isSaving = signal(false);
  
  readonly inmuebles = signal<Inmueble[]>([]);
  readonly pagination = signal<InmueblesPaginacion>(DEFAULT_PAGINATION);
  
  readonly isComposerOpen = signal(false);
  readonly isDetailOpen = signal(false);
  readonly isUnidadComposerOpen = signal(false);
  
  readonly editingId = signal<number | null>(null);
  readonly selectedInmueble = signal<Inmueble | null>(null);
  readonly editingUnidadId = signal<number | null>(null);
  readonly pendingDeleteInmueble = signal<Inmueble | null>(null);
  readonly pendingDeleteUnidad = signal<Unidad | null>(null);

  readonly searchForm = this.formBuilder.nonNullable.group({ buscar: '', estado: '', tipo: '' });
  
  readonly inmuebleForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required]],
    tipo: ['edificio', [Validators.required]],
    descripcion: [''],
    direccion: ['', [Validators.required]],
    ciudad: [''],
    region: [''],
    pais: [''],
    codigo_postal: [''],
    total_pisos: [1, [Validators.required, Validators.min(1)]],
    total_unidades: [1, [Validators.required, Validators.min(1)]],
    estado: ['activo']
  });

  readonly unidadForm = this.formBuilder.nonNullable.group({
    codigo: ['', [Validators.required]],
    nombre: [''],
    piso: [1],
    precio_base: [0],
    tipo: ['departamento'],
    moneda: ['PEN'],
    area_m2: [0],
    estado: ['disponible']
  });

  ngOnInit(): void { this.loadInmuebles(1); }

  loadInmuebles(page = 1): void {
    const eid = this.empresa()?.id;
    if (!eid) return;
    this.isLoadingList.set(true);
    this.inmueblesService.list({ 
      empresa_id: eid, 
      pag: page, 
      ...this.searchForm.getRawValue() 
    })
      .pipe(finalize(() => this.isLoadingList.set(false)))
      .subscribe(res => { this.inmuebles.set(res.datos); this.pagination.set(res.paginacion); });
  }

  applySearch(): void { this.loadInmuebles(1); }
  totalRecords = computed(() => this.pagination().total);

  // --- Inmueble Logic ---
  openComposer(): void {
    this.editingId.set(null);
    this.inmuebleForm.reset({ 
      tipo: 'edificio', 
      total_pisos: 1, 
      total_unidades: 1, 
      estado: 'activo',
      pais: 'Perú',
      ciudad: 'Lima'
    });
    this.isComposerOpen.set(true);
  }

  startEdit(item: Inmueble): void {
    this.editingId.set(item.id);
    this.inmuebleForm.patchValue({
      nombre: item.nombre,
      tipo: item.tipo,
      descripcion: item.descripcion || '',
      direccion: item.direccion,
      ciudad: item.ciudad || '',
      region: item.region || '',
      pais: item.pais || '',
      codigo_postal: item.codigo_postal || '',
      total_pisos: item.total_pisos,
      total_unidades: item.total_unidades,
      estado: item.estado
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitInmueble(): void {
    const eid = this.empresa()?.id;
    if (this.inmuebleForm.invalid || !eid) return;
    this.isSaving.set(true);
    const payload = { ...this.inmuebleForm.getRawValue(), empresa_id: eid } as InmueblePayload;
    const req = this.editingId() 
      ? this.inmueblesService.update(this.editingId()!, payload) 
      : this.inmueblesService.create(payload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); this.closeComposer(); }))
       .subscribe({
         next: () => { this.setFeedback('success', 'Propiedad actualizada.'); this.loadInmuebles(1); },
         error: err => this.setFeedback('error', extractHttpErrorMessage(err, 'Error al guardar propiedad.'))
       });
  }

  openDeleteInmueble(item: Inmueble): void { this.pendingDeleteInmueble.set(item); }
  confirmDeleteInmueble(): void {
    const target = this.pendingDeleteInmueble();
    const eid = this.empresa()?.id;
    if (!target || !eid) return;
    this.isSaving.set(true);
    this.inmueblesService.delete(target.id, eid)
      .pipe(finalize(() => { this.isSaving.set(false); this.pendingDeleteInmueble.set(null); }))
      .subscribe({
        next: () => { this.setFeedback('success', 'Inmueble eliminado.'); this.loadInmuebles(1); },
        error: err => this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo eliminar el inmueble.'))
      });
  }

  // --- Detail Logic ---
  viewDetail(item: Inmueble): void {
    const eid = this.empresa()?.id;
    if (!eid) return;
    this.isDetailOpen.set(true);
    this.inmueblesService.getById(item.id, eid).subscribe(data => this.selectedInmueble.set(data));
  }
  closeDetail(): void { this.isDetailOpen.set(false); this.selectedInmueble.set(null); }

  // --- Unidad Logic ---
  openUnidadComposer(u?: Unidad): void {
    if (u) {
      this.editingUnidadId.set(u.id);
      this.unidadForm.patchValue({
        codigo: u.codigo,
        nombre: u.nombre || '',
        piso: u.piso,
        precio_base: u.precio_base || 0,
        tipo: u.tipo || 'departamento',
        moneda: u.moneda || 'PEN',
        area_m2: u.area_m2 || 0,
        estado: u.estado
      });
    } else {
      this.editingUnidadId.set(null);
      this.unidadForm.reset({ tipo: 'departamento', moneda: 'PEN', piso: 1, area_m2: 0, estado: 'disponible' });
    }
    this.isUnidadComposerOpen.set(true);
  }

  closeUnidadComposer(): void { this.isUnidadComposerOpen.set(false); }

  submitUnidad(): void {
    const item = this.selectedInmueble();
    const eid = this.empresa()?.id;
    if (!item || !eid || this.unidadForm.invalid) return;
    this.isSaving.set(true);
    const payload = { ...this.unidadForm.getRawValue(), empresa_id: eid } as UnidadPayload;
    
    const req = this.editingUnidadId() 
      ? this.inmueblesService.updateUnidad(item.id, this.editingUnidadId()!, payload) 
      : this.inmueblesService.createUnidad(item.id, payload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); this.closeUnidadComposer(); }))
       .subscribe({
         next: () => { this.setFeedback('success', 'Unidad actualizada.'); this.viewDetail(item); },
         error: err => this.setFeedback('error', extractHttpErrorMessage(err, 'Error en la unidad.'))
       });
  }

  openDeleteUnidad(u: Unidad): void { this.pendingDeleteUnidad.set(u); this.confirmDeleteUnidad(); }
  confirmDeleteUnidad(): void {
    const u = this.pendingDeleteUnidad();
    const item = this.selectedInmueble();
    const eid = this.empresa()?.id;
    if (!u || !item || !eid) return;
    
    this.isSaving.set(true);
    this.inmueblesService.deleteUnidad(item.id, u.id, eid)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => { 
          this.setFeedback('success', 'Unidad removida.'); 
          this.viewDetail(item); 
          this.pendingDeleteUnidad.set(null); 
        },
        error: err => this.setFeedback('error', extractHttpErrorMessage(err, 'No se pudo eliminar unidad.'))
      });
  }

  // --- Helpers ---
  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }

  feedbackClasses(tone: FeedbackTone): string {
    return tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800';
  }

  getStatusBadgeClass(s: string): string {
    if (['activa', 'disponible'].includes(s)) return 'bg-emerald-100 text-emerald-700';
    if (['mantenimiento'].includes(s)) return 'bg-amber-100 text-amber-700';
    if (['inactiva', 'ocupado'].includes(s)) return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }
}
