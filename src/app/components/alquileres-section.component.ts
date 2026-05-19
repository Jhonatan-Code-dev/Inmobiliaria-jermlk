import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractHttpErrorMessage } from '../core/http/http-error.utils';

// Services
import { AuthService } from '../services/auth.service';
import { AlquileresService } from '../services/alquileres.service';
import { ClientesService } from '../services/clientes.service';
import { InmueblesService } from '../services/inmuebles.service';

// Models
import { Alquiler, AlquilerPayload, AlquileresFilters, AlquileresPaginacion, PagoPendiente, PagoPayload, GeneradorBorradorPayload } from '../core/alquileres/alquileres.models';
import { Cliente } from '../core/clientes/clientes.models';
import { Inmueble, Unidad } from '../core/inmuebles/inmuebles.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

const DEFAULT_PAGINATION: AlquileresPaginacion = { total: 0, paginas: 0, pagina: 1, pagina_actual: 1, por_pagina: 10 };

@Component({
  selector: 'app-alquileres-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-slide { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">Alquileres y Contratos</h2>
            <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Gestiona tus contratos, emite documentos legales y centraliza tus recaudaciones.</p>
          </div>
          @if (activeTab() === 'activos') {
            <button (click)="openComposer()" class="bg-primary-600 dark:bg-primary-500 text-white rounded-xl px-5 py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-all flex items-center gap-2 group shadow-xl shadow-primary-500/20 active:scale-95">
              <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
              Nuevo Contrato
            </button>
          }
        </div>
        
        <!-- Pestañas -->
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-dark-bg p-1.5 rounded-2xl border border-slate-200 dark:border-dark-border transition-colors w-fit">
          <button 
            (click)="setTab('activos')"
            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            [ngClass]="activeTab() === 'activos' ? 'bg-white dark:bg-dark-surface text-primary-600 dark:text-primary-400 shadow-sm border border-slate-200 dark:border-dark-border' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'">
            Contratos Activos
          </button>
          <button 
            (click)="setTab('emision')"
            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            [ngClass]="activeTab() === 'emision' ? 'bg-white dark:bg-dark-surface text-primary-600 dark:text-primary-400 shadow-sm border border-slate-200 dark:border-dark-border' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'">
            Emisión de Contrato
          </button>
        </div>
      </div>

      @if (activeTab() === 'activos') {
        <!-- Dashboard Stats & Filters -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Deudores Panel -->
        <div class="lg:col-span-1 bg-primary-600 dark:bg-primary-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden transition-colors">
          <svg class="absolute -right-4 -bottom-4 h-32 w-32 opacity-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
          <div class="relative z-10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-primary-100 mb-1">Pagos Pendientes Este Mes</p>
            <p class="text-4xl font-black text-white">{{ pendientesCount() }}</p>
          </div>
          <button (click)="openPendientes()" class="mt-4 bg-white/20 hover:bg-white/30 text-white transition-colors w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest relative z-10 border border-white/10 shadow-sm backdrop-blur-md">Revisar Morosos</button>
        </div>

        <!-- Filters form -->
        <div class="lg:col-span-3 bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm flex flex-col justify-center transition-colors">
          <form [formGroup]="searchForm" (ngSubmit)="applySearch()" class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-[200px] relative">
              <input type="text" formControlName="buscar" placeholder="Nombe de inquilino o Unidad..." class="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-slate-900 dark:text-white focus:bg-white dark:focus:bg-dark-bg focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm font-medium"/>
              <svg class="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <select formControlName="estado" (change)="applySearch()" class="h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-bg transition-colors">
              <option value="">Cualquier Estado</option>
              <option value="activo">Activos</option>
              <option value="vencido">Vencidos</option>
            </select>
            <button type="submit" class="h-12 px-8 rounded-xl bg-primary-600 dark:bg-primary-500 text-white font-black uppercase text-xs tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-all shadow-lg active:scale-95">Buscar</button>
          </form>
        </div>
      </div>

      <!-- Alquileres List -->
      <div class="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2rem] shadow-sm overflow-hidden transition-colors">
        @if (isLoadingList()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sincronizando Contratos...</p>
          </div>
        } @else if (alquileres().length) {
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left">
              <thead class="bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-200 dark:border-dark-border transition-colors">
                <tr class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                  <th class="px-8 py-5">Contrato</th>
                  <th class="px-8 py-5">Inquilino</th>
                  <th class="px-8 py-5">Duración</th>
                  <th class="px-8 py-5">Estado</th>
                  <th class="px-8 py-5 text-right flex-shrink-0">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-dark-border transition-colors">
                @for (item of alquileres(); track item.id) {
                  <tr class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-[10px] font-black shadow-sm border border-primary-100 dark:border-primary-800 transition-colors">
                           S/.
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight transition-colors">{{ item.unidad }}</p>
                          <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">S/. {{ item.monto }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <p class="text-sm font-bold text-slate-800 dark:text-slate-300 truncate max-w-[200px] transition-colors">{{ item.cliente }}</p>
                    </td>
                    <td class="px-8 py-6">
                      <p class="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate transition-colors">I: {{ item.fecha_inicio }}</p>
                      <p class="text-[10px] text-slate-500 dark:text-slate-500 transition-colors">F: {{ item.fecha_fin }}</p>
                    </td>
                    <td class="px-8 py-6">
                      <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors" [ngClass]="item.estado === 'activo' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200/50 dark:ring-rose-800/50'">{{ item.estado }}</span>
                    </td>
                    <td class="px-8 py-6 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-2 transition-all">
                        <button (click)="openPago(item)" class="h-9 px-4 rounded-lg bg-primary-600 dark:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-colors active:scale-95 shadow-sm">Cobrar</button>
                        <button (click)="viewDetail(item)" class="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600 dark:hover:border-primary-400 transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        @if (item.estado === 'activo') {
                          <button (click)="confirmFinalizar(item)" class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all" title="Finalizar Contrato">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                          </button>
                        }
                        <button (click)="confirmDelete(item)" class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all" title="Eliminar Contrato">
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
          <div class="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Página {{ pagination().pagina }} de {{ pagination().paginas }} </p>
            <div class="flex gap-2">
              <button [disabled]="pagination().pagina === 1" (click)="loadAlquileres(pagination().pagina - 1)" class="h-8 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">Atrás</button>
              <button [disabled]="pagination().pagina >= pagination().paginas" (click)="loadAlquileres(pagination().pagina + 1)" class="h-8 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">Siguiente</button>
            </div>
          </div>
        } @else {
          <div class="p-20 text-center flex flex-col items-center">
             <div class="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400 dark:text-slate-500 transition-colors">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
             </div>
             <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin Contratos Guardados</h3>
             <p class="text-slate-500 dark:text-slate-400 max-w-xs mt-2 font-medium">Asocia un inquilino con un inmueble para empezar a generar cobros automatizados.</p>
          </div>
        }
      </div>
      }

      <!-- Alquiler Detail Slide-Over -->
      @if (isDetailOpen()) {
        <div class="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" (click)="closeDetail()"></div>
          <div class="relative w-full max-w-sm bg-white dark:bg-slate-950 shadow-2xl animate-slide flex flex-col transition-colors border-l border-slate-200 dark:border-slate-800">
            <div class="bg-primary-600 dark:bg-primary-700 px-8 py-8 flex items-center justify-between text-white border-b border-primary-500">
               <div>
                 <h3 class="text-2xl font-black tracking-tighter uppercase text-white">Detalle Contrato</h3>
                 <p class="text-primary-100 text-xs font-black tracking-widest uppercase mt-1">{{ selectedAlquiler()?.cliente }}</p>
               </div>
               <button (click)="closeDetail()" class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary-700 text-white transition-colors">
                 <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>
            <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                <div>
                   <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Unidad Alquilada</p>
                   <p class="text-lg font-black text-slate-900 dark:text-white mt-1">{{ selectedAlquiler()?.unidad }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                   <div>
                       <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Inicio</p>
                       <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{{ selectedAlquiler()?.fecha_inicio }}</p>
                   </div>
                   <div>
                       <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fecha Fin</p>
                       <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{{ selectedAlquiler()?.fecha_fin }}</p>
                   </div>
                </div>
                <div>
                   <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Renta Mensual</p>
                   <p class="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">S/. {{ selectedAlquiler()?.monto }}</p>
                </div>
                <div>
                   <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estado</p>
                   <span class="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors" [ngClass]="selectedAlquiler()?.estado === 'activo' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200/50 dark:ring-rose-800/50'">{{ selectedAlquiler()?.estado }}</span>
                </div>
            </div>
            <div class="p-6 border-t border-slate-200 dark:border-dark-border transition-colors">
                <button (click)="openPago(selectedAlquiler()!); closeDetail()" class="w-full h-12 rounded-xl bg-primary-600 dark:bg-primary-500 text-white font-black uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-colors shadow-lg active:scale-95 mb-4">Cobrar Cuota</button>
                
                <div class="bg-slate-50 dark:bg-dark-bg p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button (click)="generarDocumentoFromAlquiler(); closeDetail()" class="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Emitir Contrato
                  </button>
                </div>
            </div>
          </div>
        </div>
      }



      <!-- Vista Emisión de Contrato -->
      @if (activeTab() === 'emision') {
        <div class="bg-white dark:bg-dark-surface p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-border">
           <div class="mb-8 pb-6 border-b border-slate-100 dark:border-dark-border">
             <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Emisión de Contrato Independiente</h3>
             <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Genera un contrato legal de forma inmediata sin registro previo en la base de datos. Ideal para cierres rápidos o pre-visualizaciones legales.</p>
           </div>
           
           <form [formGroup]="contratoDirectoForm" (ngSubmit)="emitirContratoDirecto()" class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                 
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Documento Cliente</label>
                       @if (isInvalid('contratoDirecto', 'cliente_documento')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'cliente_documento') }}</span>
                       }
                    </div>
                    <input type="text" formControlName="cliente_documento" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'cliente_documento') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. 72081492 / Pasaporte"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombres</label>
                       @if (isInvalid('contratoDirecto', 'cliente_nombre')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'cliente_nombre') }}</span>
                       }
                    </div>
                    <input type="text" formControlName="cliente_nombre" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'cliente_nombre') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. Juan Manuel"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Apellidos</label>
                       @if (isInvalid('contratoDirecto', 'cliente_apellidos')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'cliente_apellidos') }}</span>
                       }
                    </div>
                    <input type="text" formControlName="cliente_apellidos" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'cliente_apellidos') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. Pérez Gómez"/>
                 </div>

                 <div class="space-y-1.5 lg:col-span-2">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Dirección</label>
                       @if (isInvalid('contratoDirecto', 'cliente_direccion')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'cliente_direccion') }}</span>
                       }
                    </div>
                    <input type="text" formControlName="cliente_direccion" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'cliente_direccion') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. Av. Larco 456, Dpto 302"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Correo</label>
                       @if (isInvalid('contratoDirecto', 'cliente_correo')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'cliente_correo') }}</span>
                       }
                    </div>
                    <input type="email" formControlName="cliente_correo" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'cliente_correo') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. juan.perez@email.com"/>
                 </div>

                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Código Unidad</label>
                       @if (isInvalid('contratoDirecto', 'unidad_codigo')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'unidad_codigo') }}</span>
                       }
                    </div>
                    <input type="text" formControlName="unidad_codigo" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'unidad_codigo') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. DPTO-302"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Moneda</label>
                       @if (isInvalid('contratoDirecto', 'moneda')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'moneda') }}</span>
                       }
                    </div>
                    <select formControlName="moneda" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'moneda') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'">
                       <option value="PEN">Soles (PEN)</option>
                       <option value="USD">Dólares (USD)</option>
                    </select>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Renta Mensual</label>
                       @if (isInvalid('contratoDirecto', 'monto_renta')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'monto_renta') }}</span>
                       }
                    </div>
                    <input type="number" formControlName="monto_renta" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors text-center" [ngClass]="isInvalid('contratoDirecto', 'monto_renta') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. 1200"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Depósito Garantía</label>
                       @if (isInvalid('contratoDirecto', 'monto_deposito')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'monto_deposito') }}</span>
                       }
                    </div>
                    <input type="number" formControlName="monto_deposito" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors text-center" [ngClass]="isInvalid('contratoDirecto', 'monto_deposito') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. 1200"/>
                 </div>

                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha Inicio</label>
                       @if (isInvalid('contratoDirecto', 'fecha_inicio')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'fecha_inicio') }}</span>
                       }
                    </div>
                    <input type="date" formControlName="fecha_inicio" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'fecha_inicio') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha Fin</label>
                       @if (isInvalid('contratoDirecto', 'fecha_fin')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'fecha_fin') }}</span>
                       }
                    </div>
                    <input type="date" formControlName="fecha_fin" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors" [ngClass]="isInvalid('contratoDirecto', 'fecha_fin') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                 </div>
                 <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500">Día de Pago</label>
                       @if (isInvalid('contratoDirecto', 'dia_vencimiento')) {
                          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('contratoDirecto', 'dia_vencimiento') }}</span>
                       }
                    </div>
                    <input type="number" formControlName="dia_vencimiento" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white focus:ring-2 text-sm transition-colors text-center" [ngClass]="isInvalid('contratoDirecto', 'dia_vencimiento') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'" placeholder="Ej. 5"/>
                 </div>
              </div>
              


              <div class="flex justify-end pt-4">
                 <button type="submit" [disabled]="isGenerating()" class="h-14 px-8 rounded-2xl bg-primary-600 dark:bg-primary-500 text-white font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2">
                    @if (isGenerating()) {
                      <div class="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    } @else {
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    }
                    Descargar Contrato
                 </button>
              </div>
           </form>
        </div>
      }

      <!-- Composer Contrato -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-black/80 backdrop-blur-md" (click)="closeComposer()"></div>
           <div class="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden flex flex-col max-h-[90vh] transition-colors">
              <div class="px-10 py-8 bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-100 dark:border-dark-border flex-shrink-0 transition-colors">
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nuevo Contrato de Alquiler</h3>
                <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Asocia un inquilino con una propiedad disponible.</p>
              </div>
              
              <div class="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <form [formGroup]="alquilerForm" (ngSubmit)="submitAlquiler()" class="space-y-6">
                   <!-- Inquilino y Unidad -->
                   <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Inquilino <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'cliente_id')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'cliente_id') }}</span>
                            }
                         </div>
                         <select formControlName="cliente_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-slate-200 transition-colors text-sm focus:ring-2" [ngClass]="isInvalid('alquiler', 'cliente_id') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'">
                           <option value="">Seleccione Cliente...</option>
                           @for(cli of cachedClientes(); track cli.id) {
                             <option [value]="cli.id">{{ cli.nombres }} {{ cli.apellidos }} - {{ cli.documento_numero }}</option>
                           }
                         </select>
                      </div>
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Unidad <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'unidad_id')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'unidad_id') }}</span>
                            }
                         </div>
                         <select formControlName="unidad_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-slate-200 transition-colors text-sm focus:ring-2" [ngClass]="isInvalid('alquiler', 'unidad_id') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'">
                           <option value="">Seleccione Unidad Libre...</option>
                           @for(uni of cachedUnidadesLibres(); track uni.id) {
                             <option [value]="uni.id">{{ uni.codigo }} ({{ uni.precio_base }} PEN)</option>
                           }
                         </select>
                      </div>
                   </div>

                   <!-- Tiempos -->
                   <div class="grid grid-cols-3 gap-4">
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Inicio <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'fecha_inicio')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'fecha_inicio') }}</span>
                            }
                         </div>
                         <input type="date" formControlName="fecha_inicio" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm focus:ring-2" [ngClass]="isInvalid('alquiler', 'fecha_inicio') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                      </div>
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fin <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'fecha_fin')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'fecha_fin') }}</span>
                            }
                         </div>
                         <input type="date" formControlName="fecha_fin" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm focus:ring-2" [ngClass]="isInvalid('alquiler', 'fecha_fin') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                      </div>
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Día Pago <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'vencimiento_dia_pago')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'vencimiento_dia_pago') }}</span>
                            }
                         </div>
                         <input type="number" formControlName="vencimiento_dia_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm text-center focus:ring-2" [ngClass]="isInvalid('alquiler', 'vencimiento_dia_pago') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                      </div>
                   </div>

                   <!-- Montos -->
                   <div class="grid grid-cols-3 gap-4">
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Moneda <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'moneda')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'moneda') }}</span>
                            }
                         </div>
                         <select formControlName="moneda" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-slate-200 focus:ring-2 transition-all text-sm" [ngClass]="isInvalid('alquiler', 'moneda') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'">
                            <option value="PEN">Soles (PEN)</option>
                            <option value="USD">Dólares (USD)</option>
                         </select>
                      </div>
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Renta Mensual <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'monto_renta')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'monto_renta') }}</span>
                            }
                         </div>
                         <input type="number" formControlName="monto_renta" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm text-center focus:ring-2" [ngClass]="isInvalid('alquiler', 'monto_renta') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                      </div>
                      <div class="space-y-1.5">
                         <div class="flex justify-between items-center">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Depósito <span class="text-primary-600 dark:text-primary-400">*</span></label>
                            @if (isInvalid('alquiler', 'deposito_garantia')) {
                               <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('alquiler', 'deposito_garantia') }}</span>
                            }
                         </div>
                         <input type="number" formControlName="deposito_garantia" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm text-center focus:ring-2" [ngClass]="isInvalid('alquiler', 'deposito_garantia') ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 focus:ring-rose-500' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500'"/>
                      </div>
                   </div>

                   <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-dark-border mt-8 transition-colors">
                      <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                      <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-primary-600 dark:bg-primary-500 text-white font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-primary-400 transition-all disabled:opacity-50">
                         {{ isSaving() ? 'Redactando...' : 'Legalizar Contrato' }}
                      </button>
                   </div>
                </form>
              </div>
           </div>
        </div>
      }

      <!-- Composer Registrar Pago -->
      @if (pendingPagoAlquiler()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-black/80 backdrop-blur-md" (click)="closePago()"></div>
           <div class="relative w-full max-w-md bg-white dark:bg-dark-surface rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden flex flex-col transition-colors border border-slate-100 dark:border-dark-border">
              <div class="px-10 py-8 bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-100 dark:border-dark-border text-center transition-colors">
                 <div class="h-16 w-16 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                   <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 </div>
                 <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Registrar Recibo</h3>
                 <p class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{{ pendingPagoAlquiler()?.cliente }}</p>
              </div>
              <form [formGroup]="pagoForm" (ngSubmit)="submitPago()" class="p-8 space-y-4">
                 <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Monto A Pagar</label>
                       <input type="number" formControlName="monto_pagado" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-black text-primary-600 dark:text-primary-400 text-lg text-center transition-colors focus:ring-2 focus:ring-primary-500"/>
                    </div>
                    <div class="space-y-1.5">
                       <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Mes (1-12)</label>
                       <input type="number" formControlName="mes_correspondiente" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white text-center transition-colors focus:ring-2 focus:ring-primary-500"/>
                    </div>
                 </div>
                 <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha de Pago</label>
                    <input type="date" formControlName="fecha_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white transition-colors focus:ring-2 focus:ring-primary-500 text-sm"/>
                 </div>
                 <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Método Operativo</label>
                    <select formControlName="metodo_pago" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-slate-300 transition-colors focus:ring-2 focus:ring-primary-500 text-sm">
                       <option value="transferencia">Transferencia Bancaria</option>
                       <option value="efectivo">Efectivo Físico</option>
                       <option value="tarjeta">Tarjeta (POS)</option>
                    </select>
                 </div>
                 <div class="space-y-1.5">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nota u Objeto</label>
                    <input type="text" formControlName="nota" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-medium text-slate-900 dark:text-white transition-colors focus:ring-2 focus:ring-primary-500 text-sm"/>
                 </div>
                 <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-dark-border mt-6 transition-colors">
                    <button type="button" (click)="closePago()" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Abortar</button>
                    <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-primary-600 dark:bg-primary-500 text-white font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-primary-400 transition-all disabled:opacity-50">Confirmar Ingreso</button>
                 </div>
              </form>
           </div>
        </div>
      }

      <!-- Drawer Pendientes (Slide Over) -->
      @if (isPendientesOpen()) {
        <div class="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" (click)="closePendientes()"></div>
          <div class="relative w-full max-w-md bg-white dark:bg-dark-bg shadow-2xl animate-slide flex flex-col transition-colors border-l border-slate-200 dark:border-dark-border">
            <div class="bg-primary-600 dark:bg-primary-700 px-8 py-8 flex items-center justify-between text-white border-b border-primary-500">
               <div>
                 <h3 class="text-2xl font-black tracking-tighter uppercase text-white">Morosidad</h3>
                 <p class="text-primary-100 text-xs font-black tracking-widest uppercase mt-1">Requieren Cobranza</p>
               </div>
               <button (click)="closePendientes()" class="h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary-700 text-white transition-colors">
                 <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
            </div>
            <div class="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
              @if (isLoadingPendientes()) {
                <div class="text-center p-10 text-slate-400 font-bold">Verificando saldos...</div>
              } @else if (pagosPendientes().length) {
                @for (p of pagosPendientes(); track p.alquiler_id) {
                  <div class="bg-white dark:bg-dark-surface p-5 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-400 transition-all shadow-sm group">
                    <p class="text-sm font-black text-slate-900 dark:text-white uppercase transition-colors">{{ p.cliente }}</p>
                    <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 transition-colors">Unidad: {{ p.unidad }}</p>
                    <div class="mt-4 flex items-center justify-between">
                       <div>
                         <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">Deuda Vencida</p>
                         <p class="text-lg font-black text-primary-600 dark:text-primary-400 transition-colors">S/. {{ p.monto }}</p>
                       </div>
                       <button (click)="loadAlquilerForCobro(p.alquiler_id); closePendientes()" class="h-8 px-4 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-bold uppercase hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 transition-all">Cobrar</button>
                    </div>
                  </div>
                }
              } @else {
                <div class="text-center p-10">
                   <div class="inline-flex h-16 w-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full items-center justify-center mb-4 transition-colors">
                      <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                   </div>
                   <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase transition-colors">Sin Morosos</h4>
                   <p class="text-slate-500 dark:text-slate-400 text-xs mt-2 transition-colors">Todos tus inquilinos están al día.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Confirmation Modal: Finalizar Contrato -->
      @if (pendingFinalizarAlquiler()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm shadow-inner" (click)="pendingFinalizarAlquiler.set(null)"></div>
           <div class="relative w-full max-w-sm bg-white dark:bg-dark-surface p-8 rounded-[2rem] shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-dark-border">
              <div class="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 transition-colors">
                 <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">¿Finalizar Contrato?</h3>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 mb-8">Confirmas que el inquilino "{{ pendingFinalizarAlquiler()?.cliente }}" ha cumplido su periodo y la unidad quedará disponible.</p>
              <div class="flex gap-2">
                 <button (click)="pendingFinalizarAlquiler.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancelar</button>
                 <button (click)="onConfirmFinalizar()" [disabled]="isSaving()" class="flex-1 h-11 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all">Finalizar</button>
              </div>
           </div>
        </div>
      }

      <!-- Confirmation Modal: Delete Contrato -->
      @if (pendingDeleteAlquiler()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="pendingDeleteAlquiler.set(null)"></div>
           <div class="relative w-full max-w-sm bg-white dark:bg-dark-surface p-8 rounded-[2rem] shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-dark-border">
              <div class="h-16 w-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400 transition-colors">
                 <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter pb-2">¿Eliminar Registro?</h3>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-4 mb-8 italic">Se borrará todo el historial del contrato con "{{ pendingDeleteAlquiler()?.cliente }}". Esta acción es irreversible.</p>
              <div class="flex gap-2">
                 <button (click)="pendingDeleteAlquiler.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Desistir</button>
                 <button (click)="onConfirmDelete()" [disabled]="isSaving()" class="flex-1 h-11 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 active:scale-95 transition-all">Eliminar</button>
              </div>
           </div>
        </div>
      }

      <!-- Feedbacks -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
           <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="feedbackClasses(f.tone)">
              <div class="h-2 w-2 rounded-full animate-pulse" [ngClass]="f.tone === 'success' ? 'bg-primary-600 dark:bg-primary-400' : 'bg-rose-500'"></div>
              <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
           </div>
        </div>
      }
    </section>
  `
})
export class AlquileresSectionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly alquileresService = inject(AlquileresService);
  private readonly clientesService = inject(ClientesService);
  private readonly inmueblesService = inject(InmueblesService);

  readonly empresa = this.authService.empresa;
  readonly feedback = signal<FeedbackState | null>(null);

  // Tabs
  readonly activeTab = signal<'activos' | 'emision'>('activos');

  // States Alquileres
  readonly isLoadingList = signal(false);
  readonly isSaving = signal(false);
  readonly isLoadingPendientes = signal(false);
  
  readonly alquileres = signal<Alquiler[]>([]);
  readonly pagination = signal<AlquileresPaginacion>(DEFAULT_PAGINATION);
  
  readonly pagosPendientes = signal<PagoPendiente[]>([]);
  readonly pendientesCount = computed(() => this.pagosPendientes().length);

  readonly isComposerOpen = signal(false);
  readonly pendingPagoAlquiler = signal<Alquiler | null>(null);
  readonly isPendientesOpen = signal(false);
  readonly isDetailOpen = signal(false);
  readonly selectedAlquiler = signal<Alquiler | null>(null);
  
  readonly pendingFinalizarAlquiler = signal<Alquiler | null>(null);
  readonly pendingDeleteAlquiler = signal<Alquiler | null>(null);



  // States Generador de Contratos (Unificado a Word)
  readonly isGenerating = signal(false);
  readonly selectedAlquilerForDoc = signal<Alquiler | null>(null);
  readonly docTemplateId = signal<number>(0);

  // Caches for the form
  readonly cachedClientes = signal<Cliente[]>([]);
  readonly cachedUnidadesLibres = signal<{id:number, codigo:string, precio_base:number}[]>([]);

  // Forms
  readonly searchForm = this.fb.nonNullable.group({ buscar: '', estado: '' });
  
  readonly alquilerForm = this.fb.nonNullable.group({
    cliente_id: ['', [Validators.required]],
    unidad_id: ['', [Validators.required]],
    fecha_inicio: ['', [Validators.required]],
    fecha_fin: ['', [Validators.required]],
    vencimiento_dia_pago: [5, [Validators.required, Validators.min(1), Validators.max(31)]],
    monto_renta: [0, [Validators.required, Validators.min(0.01)]],
    deposito_garantia: [0, [Validators.required, Validators.min(0)]],
    moneda: ['PEN', [Validators.required]]
  }, { validators: [control => this.dateRangeValidator(control)] });

  readonly pagoForm = this.fb.nonNullable.group({
    monto_pagado: [0, [Validators.required, Validators.min(0.01)]],
    fecha_pago: ['', [Validators.required]],
    metodo_pago: ['transferencia', [Validators.required]],
    nota: ['Pago correspondiente a la cuota'],
    mes_correspondiente: [this.currentMonth(), [Validators.required, Validators.min(1), Validators.max(12)]]
  });

  readonly contratoDirectoForm = this.fb.nonNullable.group({
    cliente_documento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
    cliente_nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$')]],
    cliente_apellidos: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$')]],
    cliente_direccion: ['', [Validators.required]],
    cliente_correo: ['', [Validators.required, Validators.email]],
    unidad_codigo: ['', [Validators.required]],
    monto_renta: [0, [Validators.required, Validators.min(0.01)]],
    monto_deposito: [0, [Validators.required, Validators.min(0)]],
    moneda: ['PEN', [Validators.required]],
    fecha_inicio: ['', [Validators.required]],
    fecha_fin: ['', [Validators.required]],
    dia_vencimiento: [5, [Validators.required, Validators.min(1), Validators.max(31)]]
  }, { validators: [control => this.dateRangeValidator(control)] });

  ngOnInit(): void { 
    this.loadAlquileres(1);
    this.checkPagosPendientes();
  }

  setTab(tab: 'activos' | 'emision'): void {
    this.activeTab.set(tab);
    if (tab === 'emision') {
      this.contratoDirectoForm.patchValue({
        fecha_inicio: this.todayDate(),
        fecha_fin: this.nextYearDate()
      });
    }
  }

  // --- Logic API ---
  loadAlquileres(page: number): void {
    const eid = this.empresa()?.id;
    if (!eid) return;
    this.isLoadingList.set(true);
    this.alquileresService.list({ empresa_id: eid, pag: page, ...this.searchForm.getRawValue() })
      .pipe(finalize(() => this.isLoadingList.set(false)))
      .subscribe({
        next: res => { this.alquileres.set(res.datos); this.pagination.set(res.paginacion); },
        error: e => this.setFeedback('error', extractHttpErrorMessage(e, 'Error al cargar alquileres'))
      });
  }

  applySearch(): void { this.loadAlquileres(1); }

  checkPagosPendientes(): void {
    const eid = this.empresa()?.id;
    if (!eid) return;
    this.isLoadingPendientes.set(true);
    this.alquileresService.getPagosPendientes(eid)
      .pipe(finalize(() => this.isLoadingPendientes.set(false)))
      .subscribe({
        next: list => this.pagosPendientes.set(list),
        error: () => {}
      });
  }

  // --- Alquiler Composer ---
  openComposer(): void {
    this.preloadDataForForms();
    this.alquilerForm.reset({
      vencimiento_dia_pago: 5, moneda: 'PEN', monto_renta: 0, deposito_garantia: 0,
      fecha_inicio: this.todayDate(), fecha_fin: this.nextYearDate()
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitAlquiler(): void {
    if (this.alquilerForm.invalid) {
      this.alquilerForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const payload = {
      ...this.alquilerForm.getRawValue(),
      cliente_id: Number(this.alquilerForm.value.cliente_id),
      unidad_id: Number(this.alquilerForm.value.unidad_id),
    } as AlquilerPayload;

    this.alquileresService.create(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Contrato firmado satisfactoriamente.');
          this.closeComposer();
          this.loadAlquileres(1);
          this.checkPagosPendientes();
        },
        error: e => this.setFeedback('error', extractHttpErrorMessage(e, 'Error al firmar trato.'))
      });
  }

  // --- Preloaders ---
  private preloadDataForForms(): void {
    const eid = this.empresa()?.id;
    if (!eid) return;
    if(!this.cachedClientes().length) {
       this.clientesService.list({ empresa_id: eid, pag: 1 }).subscribe(res => this.cachedClientes.set(res.datos));
    }
    this.inmueblesService.list({ empresa_id: eid, pag: 1 }).subscribe(res => {
      let unidadesVacias: any[] = [];
      res.datos.forEach(inm => {
        this.inmueblesService.listUnidades(inm.id, eid).subscribe(uns => {
          const disponibles = uns.filter(u => u.estado === 'disponible');
          unidadesVacias = [...unidadesVacias, ...disponibles];
          this.cachedUnidadesLibres.set(unidadesVacias);
        });
      });
    });
  }

  // --- Pago Logic ---
  openPago(alquiler: Alquiler): void {
    this.pendingPagoAlquiler.set(alquiler);
    this.pagoForm.reset({
      monto_pagado: alquiler.monto,
      fecha_pago: this.todayDate(),
      metodo_pago: 'transferencia',
      nota: 'Abono de mantenimiento / alquiler',
      mes_correspondiente: this.currentMonth()
    });
  }
  closePago(): void { this.pendingPagoAlquiler.set(null); }

  submitPago(): void {
    const alg = this.pendingPagoAlquiler();
    if (!alg || this.pagoForm.invalid) return;
    this.isSaving.set(true);

    const payload = {
      ...this.pagoForm.getRawValue(),
      alquiler_id: alg.id
    } as PagoPayload;

    this.alquileresService.registrarPago(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.setFeedback('success', `Recibo emitido para ${alg.cliente}`);
          this.closePago();
          this.checkPagosPendientes();
        },
        error: e => this.setFeedback('error', extractHttpErrorMessage(e, 'Rechazado al procesar caja.'))
      });
  }

  // --- Pendientes & Detail Logic ---
  openPendientes(): void { this.isPendientesOpen.set(true); }
  closePendientes(): void { this.isPendientesOpen.set(false); }

  viewDetail(item: Alquiler): void {
     this.selectedAlquiler.set(item);
     this.selectedAlquilerForDoc.set(item);
     this.isDetailOpen.set(true);
  }
  closeDetail(): void { this.isDetailOpen.set(false); this.selectedAlquiler.set(null); }

  loadAlquilerForCobro(id: number): void {
     const eid = this.empresa()?.id;
     if(!eid) return;
     this.alquileresService.getById(id, eid).subscribe(a => this.openPago(a));
  }

  confirmFinalizar(item: Alquiler): void {
    this.pendingFinalizarAlquiler.set(item);
  }

  onConfirmFinalizar(): void {
    const item = this.pendingFinalizarAlquiler();
    if (!item) return;
    this.isSaving.set(true);
    this.alquileresService.finalizarAlquiler(item.id)
      .pipe(finalize(() => { this.isSaving.set(false); this.pendingFinalizarAlquiler.set(null); }))
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Contrato finalizado correctamente.');
          this.loadAlquileres(1);
          this.checkPagosPendientes();
        },
        error: e => this.setFeedback('error', extractHttpErrorMessage(e, 'No se pudo finalizar el contrato.'))
      });
  }

  confirmDelete(item: Alquiler): void {
    this.pendingDeleteAlquiler.set(item);
  }

  onConfirmDelete(): void {
    const item = this.pendingDeleteAlquiler();
    if (!item) return;
    this.isSaving.set(true);
    this.alquileresService.delete(item.id)
      .pipe(finalize(() => { this.isSaving.set(false); this.pendingDeleteAlquiler.set(null); }))
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Contrato eliminado correctamente.');
          this.loadAlquileres(1);
          this.checkPagosPendientes();
        },
        error: e => this.setFeedback('error', extractHttpErrorMessage(e, 'No se pudo borrar el registro.'))
      });
  }



  // --- Generación de Contratos Logic ---
  closeDocumentView(): void {
    this.selectedAlquilerForDoc.set(null);
    this.docTemplateId.set(0);
  }

  openDocumentGenerator(alquiler: Alquiler): void {
    this.selectedAlquilerForDoc.set(alquiler);
    this.docTemplateId.set(0);
  }

  generarDocumentoFromAlquiler(): void {
    const alg = this.selectedAlquilerForDoc();
    if (!alg) return;
    this.isGenerating.set(true);
    this.alquileresService.generarDocumentoWord(alg.id, this.docTemplateId())
      .pipe(finalize(() => this.isGenerating.set(false)))
      .subscribe({
        next: (blob) => {
          this.triggerDownload(blob, `contrato_${alg.id}.doc`);
          this.setFeedback('success', 'Contrato Word generado y descargado.');
          this.closeDetail();
        },
        error: e => this.setFeedback('error', 'Error al generar contrato Word.')
      });
  }

  emitirContratoDirecto(): void {
    if (this.contratoDirectoForm.invalid) {
      this.contratoDirectoForm.markAllAsTouched();
      return;
    }
    this.isGenerating.set(true);
    this.alquileresService.generarBorradorWord(this.contratoDirectoForm.getRawValue())
      .pipe(finalize(() => this.isGenerating.set(false)))
      .subscribe({
        next: (blob) => {
          this.triggerDownload(blob, 'contrato_emision_directa.doc');
          this.setFeedback('success', 'Contrato generado y listo para descarga.');
        },
        error: e => this.setFeedback('error', 'Error al emitir contrato legal.')
      });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }



  // --- Helpers ---
  private todayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private nextYearDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  private currentMonth(): number { return new Date().getMonth() + 1; }

  isInvalid(form: 'contratoDirecto' | 'alquiler' | 'pago', controlName: string): boolean {
    const group = (form === 'contratoDirecto' ? this.contratoDirectoForm 
                : form === 'alquiler' ? this.alquilerForm 
                : this.pagoForm) as any;
    const control = group.get(controlName);
    const hasControlError = !!(control && control.invalid && (control.dirty || control.touched));
    const hasFormError = controlName === 'fecha_fin' && group.errors?.['dateRangeInvalid'] && (control.dirty || control.touched);
    return hasControlError || !!hasFormError;
  }

  getErrorMessage(form: 'contratoDirecto' | 'alquiler' | 'pago', controlName: string): string {
    const group = (form === 'contratoDirecto' ? this.contratoDirectoForm 
                : form === 'alquiler' ? this.alquilerForm 
                : this.pagoForm) as any;
    const control = group.get(controlName);
    
    if (controlName === 'fecha_fin' && group.errors?.['dateRangeInvalid']) {
      return 'Fin debe ser posterior';
    }
    
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Obligatorio';
    if (control.errors['email']) return 'Correo inválido';
    if (control.errors['min']) return 'Mínimo ' + control.errors['min'].min;
    if (control.errors['max']) return 'Máximo ' + control.errors['max'].max;
    if (control.errors['minlength']) return 'Muy corto';
    if (control.errors['maxlength']) return 'Muy largo';
    if (control.errors['pattern']) {
      if (['cliente_nombre', 'cliente_apellidos'].includes(controlName)) return 'Solo letras';
      return 'Formato inválido';
    }
    return 'Dato inválido';
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const inicio = control.get('fecha_inicio')?.value;
    const fin = control.get('fecha_fin')?.value;
    return inicio && fin && new Date(fin) < new Date(inicio) ? { dateRangeInvalid: true } : null;
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 4000);
  }
  feedbackClasses(tone: FeedbackTone): string {
     return tone === 'success' ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white' : 'bg-rose-50 border-rose-200 text-rose-800';
  }
}
