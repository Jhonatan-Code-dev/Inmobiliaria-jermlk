import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../services/servicios.service';
import { AlquileresService } from '../services/alquileres.service';
import { Medicion, MedicionPayload, AlquilerSelector } from '../core/servicios/servicios.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

function getLocalTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-servicios-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styles: [`
    :host { display: block; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">Servicios y Mediciones</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">Registra lecturas de agua, luz y consumos de cada unidad.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button (click)="loadPendientes('luz')" class="h-12 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-primary-600 hover:text-white transition-all active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 group">
             <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
             Lecturas Pendientes
          </button>
          <button (click)="openComposer()" class="bg-primary-600 dark:bg-primary-500 text-white rounded-xl px-6 py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-all flex items-center gap-2 group shadow-xl shadow-primary-500/20 active:scale-95">
            <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
            Nueva Lectura
          </button>
        </div>
      </div>

      <!-- Pendientes View -->
      @if (pendientes().length) {
        <div class="bg-primary-50/50 dark:bg-dark-bg/50 p-8 rounded-[2.5rem] border border-primary-100 dark:border-dark-border animate-zoom transition-colors shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Carga por Lote (Fin de Mes)</h3>
              <p class="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-1">Registra múltiples lecturas en un solo paso</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex bg-white dark:bg-dark-surface p-1 rounded-xl shadow-sm border border-slate-200 dark:border-dark-border">
                <button (click)="loadPendientes('luz')" class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" [ngClass]="activePendingType() === 'luz' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'">Luz</button>
                <button (click)="loadPendientes('agua')" class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" [ngClass]="activePendingType() === 'agua' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'">Agua</button>
              </div>
              <button (click)="clearPendientes()" class="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all shadow-sm">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (p of pendientes(); track p.id; let i = $index) {
              <div class="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-dark-border transition-all shadow-sm">
                <div class="flex items-center gap-4 mb-4">
                  <div class="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px]">{{ p.cliente }}</p>
                    <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Unidad: {{ p.unidad }}</p>
                  </div>
                </div>
                
                <div class="space-y-4">
                  <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Lectura Anterior</span>
                    <span class="text-slate-600 dark:text-slate-300">{{ p.lectura_actual || 0 }} {{ activePendingType() === 'luz' ? 'kWh' : 'm³' }}</span>
                  </div>
                  <div class="relative">
                    <input type="number" [(ngModel)]="bulkReadings[i].lectura_actual" placeholder="Ingresar lectura actual..." class="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-black text-slate-900 dark:text-white transition-all text-sm focus:ring-2 focus:ring-primary-500 text-center"/>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="mt-10 pt-8 border-t border-primary-100 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-6">
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Precio Unitario Aplicable</label>
                <div class="relative">
                   <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/.</span>
                   <input type="number" [(ngModel)]="bulkUnitPrice" step="0.01" class="w-32 h-10 pl-9 pr-4 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border outline-none font-black text-primary-600 text-sm focus:ring-2 focus:ring-primary-500"/>
                </div>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Fecha Global</label>
                <input type="date" [(ngModel)]="bulkDate" class="h-10 px-4 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-700 text-xs focus:ring-2 focus:ring-primary-500"/>
              </div>
            </div>
            <button (click)="submitBulk()" [disabled]="isSavingBulk()" class="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary-600 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
              @if (isSavingBulk()) {
                <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando Lote...
              } @else {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                Procesar y Cobrar Todo
              }
            </button>
          </div>
        </div>
      }

      <!-- Main List -->
      <div class="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] shadow-sm overflow-hidden transition-colors">
        @if (isLoading()) {
          <div class="p-24 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Calculando consumos...</p>
          </div>
        } @else if (mediciones().length) {
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left">
              <thead class="bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-200 dark:border-dark-border transition-colors">
                <tr class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] transition-colors">
                  <th class="px-8 py-5">Servicio</th>
                  <th class="px-8 py-5">Lectura Actual</th>
                  <th class="px-8 py-5">Consumo</th>
                  <th class="px-8 py-5">Monto Total</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-dark-border transition-colors">
                @for (item of mediciones(); track item.id) {
                  <tr class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-4">
                        <div class="h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm" [ngClass]="getServiceBg(item.tipo_servicio)">
                          @if (item.tipo_servicio === 'agua') {
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a7 7 0 007-7c0-4-7-12-7-12S5 10 5 14a7 7 0 007 7z" /></svg>
                          } @else if (item.tipo_servicio === 'luz') {
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          } @else {
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                          }
                        </div>
                        <span class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight transition-colors">{{ item.tipo_servicio }}</span>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <span class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition-colors">
                        {{ item.lectura_actual }} {{ item.tipo_servicio === 'luz' ? 'kWh' : 'm³' }}
                      </span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">{{ item.consumo | number:'1.0-2' }} unidad(es)</span>
                    </td>
                    <td class="px-8 py-6 bg-primary-50/20 dark:bg-primary-900/10">
                       <span class="text-sm font-black text-primary-600 dark:text-primary-400 transition-colors">S/. {{ item.monto | number:'1.2-2' }}</span>
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2 transition-all">
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600 dark:hover:border-primary-400 transition-all shadow-sm active:scale-95">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="p-24 text-center">
            <div class="h-24 w-24 bg-slate-50 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors shadow-inner">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">Sin Mediciones</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors max-w-xs mx-auto">No se registraron lecturas de servicios en el sistema todavía.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white dark:bg-dark-surface rounded-[3rem] shadow-2xl animate-zoom overflow-hidden transition-colors border border-slate-100 dark:border-dark-border">
            <div class="px-10 py-8 bg-slate-50/50 dark:bg-dark-bg/50 border-b border-slate-100 dark:border-dark-border transition-colors flex items-center justify-between">
              <div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">{{ editingId() ? 'Editar Lectura' : 'Nueva Medición' }}</h3>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Ingresa los datos de consumo de la unidad</p>
              </div>
              <button (click)="closeComposer()" class="h-10 w-10 rounded-full bg-white dark:bg-dark-bg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-90">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form [formGroup]="medicionForm" (ngSubmit)="submitMedicion()" class="p-10 space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Seleccionar Inquilino / Contrato</label>
                <select formControlName="contrato_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm focus:ring-2 focus:ring-primary-500">
                  <option [value]="0" disabled>-- Selecciona un contrato activo --</option>
                  @for (a of alquileres(); track a.id) {
                    <option [value]="a.id">{{ a.cliente_nombre || a.cliente }} ({{ a.unidad_codigo || a.unidad }})</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Tipo de Servicio</label>
                  <select formControlName="tipo_servicio" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-700 dark:text-slate-300 text-sm transition-all focus:ring-2 focus:ring-primary-500">
                    <option value="agua">Agua Potable</option>
                    <option value="luz">Energía Eléctrica</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Fecha de Lectura</label>
                  <input type="date" formControlName="fecha_lectura" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-bold text-slate-900 dark:text-white transition-all text-sm focus:ring-2 focus:ring-primary-500"/>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Lectura Anterior (Inicial)</label>
                  <input type="number" formControlName="lectura_anterior" class="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-dark-bg/50 border border-slate-200 dark:border-dark-border outline-none font-black text-slate-500 dark:text-slate-400 text-sm text-center focus:ring-2 focus:ring-primary-500"/>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Lectura Actual</label>
                  <input type="number" formControlName="lectura_actual" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-black text-slate-900 dark:text-white transition-all text-sm text-center focus:ring-2 focus:ring-primary-500"/>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Precio Unitario</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/.</span>
                    <input type="number" formControlName="precio_unitario" step="0.01" class="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-black text-primary-600 dark:text-primary-400 transition-colors text-sm focus:ring-2 focus:ring-primary-500"/>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Factor Multiplicador</label>
                  <input type="number" formControlName="factor" step="0.1" class="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-black text-slate-900 dark:text-white transition-all text-sm text-center focus:ring-2 focus:ring-primary-500"/>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors ml-1">Cargo Fijo / Mantenimiento (Opcional)</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/.</span>
                  <input type="number" formControlName="cargo_fijo" step="0.01" class="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-dark-border outline-none font-black text-slate-900 dark:text-white transition-colors text-sm focus:ring-2 focus:ring-primary-500"/>
                </div>
              </div>

              <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-dark-border mt-4 transition-colors">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-all active:scale-95">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-primary-600 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50">
                  {{ isSaving() ? 'Procesando...' : 'Guardar y Cobrar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (pendingDelete()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="pendingDelete.set(null)"></div>
          <div class="relative w-full max-w-sm bg-white dark:bg-dark-surface p-10 rounded-[2.5rem] shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-dark-border">
            <div class="h-20 w-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400 transition-colors shadow-sm">
                 <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">¿Eliminar Medición?</h3>
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3 mb-10 transition-colors">Esta acción no se puede deshacer y la lectura será invalidada permanentemente.</p>
            <div class="flex gap-3">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Cancelar</button>
              <button (click)="confirmDelete()" class="flex-1 h-12 rounded-xl bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95">Confirmar</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white' : 'bg-rose-50 border-rose-200 text-rose-800'">
            <div class="h-2 w-2 rounded-full animate-pulse" [ngClass]="f.tone === 'success' ? 'bg-primary-600 dark:bg-primary-400' : 'bg-rose-500'"></div>
            <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
          </div>
        </div>
      }
    </section>
  `
})
export class ServiciosSectionComponent implements OnInit {
  private readonly serviciosService = inject(ServiciosService);
  private readonly alquileresService = inject(AlquileresService);
  private readonly fb = inject(FormBuilder);

  readonly mediciones = signal<Medicion[]>([]);
  readonly alquileres = signal<AlquilerSelector[]>([]);
  readonly pendientes = signal<any[]>([]);
  readonly activePendingType = signal<'luz' | 'agua'>('luz');
  readonly lecturaAnterior = signal<number>(0);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isSavingBulk = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Medicion | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  // Bulk process helpers
  bulkReadings: any[] = [];
  bulkUnitPrice = 1.5;
  bulkDate = getLocalTodayDate();

  readonly medicionForm = this.fb.nonNullable.group({
    contrato_id: [0, [Validators.required, Validators.min(1)]],
    tipo_servicio: ['luz', [Validators.required]],
    lectura_anterior: [0],
    lectura_actual: [0, [Validators.required]],
    precio_unitario: [1.5, [Validators.required]],
    fecha_lectura: [getLocalTodayDate(), [Validators.required]],
    factor: [1.0],
    cargo_fijo: [0.0]
  });

  ngOnInit(): void { 
    this.loadMediciones();
    this.loadAlquileres();
    this.setupListeners();
  }

  loadAlquileres(): void {
    this.alquileresService.getActivosSelector().subscribe(res => {
      this.alquileres.set(res || []);
    });
  }

  loadPendientes(tipo: 'luz' | 'agua'): void {
    this.isLoading.set(true);
    this.activePendingType.set(tipo);
    this.serviciosService.getPendientes(tipo)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(err => {
          console.error('Error loading pending readings:', err);
          this.setFeedback('error', 'Error al cargar unidades pendientes.');
          return of([]);
        })
      )
      .subscribe(res => {
        // Init bulk readings FIRST to avoid template errors
        this.bulkReadings = (res || []).map(p => ({
          contrato_id: p.id,
          tipo_servicio: tipo,
          lectura_actual: 0,
          lectura_anterior: p.lectura_actual || 0,
          factor: 1.0,
          cargo_fijo: 0.0
        }));
        this.pendientes.set(res || []);
        if (!res || res.length === 0) {
          this.setFeedback('success', `No hay unidades con lecturas de ${tipo} pendientes.`);
        }
      });
  }

  clearPendientes(): void {
    this.pendientes.set([]);
    this.bulkReadings = [];
  }

  submitBulk(): void {
    const validReadings = this.bulkReadings.filter(r => r.lectura_actual > 0);
    if (validReadings.length === 0) {
      this.setFeedback('error', 'Debes ingresar al menos una lectura válida.');
      return;
    }

    this.isSavingBulk.set(true);
    const payload: MedicionPayload[] = validReadings.map(r => ({
      ...r,
      fecha_lectura: this.bulkDate,
      precio_unitario: this.bulkUnitPrice
    }));

    this.serviciosService.registrarMasivo(payload)
      .pipe(finalize(() => this.isSavingBulk.set(false)))
      .subscribe({
        next: () => {
          this.setFeedback('success', `${payload.length} lecturas procesadas exitosamente.`);
          this.clearPendientes();
          this.loadMediciones();
        },
        error: () => this.setFeedback('error', 'Error al procesar el lote de lecturas.')
      });
  }

  setupListeners(): void {
    this.medicionForm.get('contrato_id')?.valueChanges.subscribe(() => this.updateLecturaAnterior());
    this.medicionForm.get('tipo_servicio')?.valueChanges.subscribe(() => this.updateLecturaAnterior());
  }

  updateLecturaAnterior(): void {
    const contratoId = this.medicionForm.value.contrato_id;
    const tipo = this.medicionForm.value.tipo_servicio as 'luz' | 'agua';
    
    if (contratoId && contratoId > 0) {
      this.serviciosService.getUltimaLectura(contratoId, tipo).subscribe(res => {
        const val = res?.lectura_actual || 0;
        this.lecturaAnterior.set(val);
        this.medicionForm.patchValue({ lectura_anterior: val });
      });
    } else {
      this.lecturaAnterior.set(0);
      this.medicionForm.patchValue({ lectura_anterior: 0 });
    }
  }

  loadMediciones(): void {
    this.isLoading.set(true);
    this.serviciosService.list({})
      .subscribe({
        next: (res) => {
          this.mediciones.set(res?.datos || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading history:', err);
          this.mediciones.set([]);
          this.isLoading.set(false);
        }
      });
  }

  openComposer(): void {
    this.editingId.set(null);
    this.medicionForm.enable();
    this.medicionForm.reset({ 
      tipo_servicio: 'luz', 
      lectura_anterior: 0,
      precio_unitario: 1.5,
      fecha_lectura: getLocalTodayDate(),
      factor: 1.0,
      cargo_fijo: 0.0
    });
    this.lecturaAnterior.set(0);
    // Modal toggle should be last
    setTimeout(() => this.isComposerOpen.set(true), 0);
  }

  startEdit(item: any): void {
    this.editingId.set(item.id);
    this.medicionForm.patchValue({
      contrato_id: item.contrato_id || 0,
      tipo_servicio: item.tipo_servicio,
      lectura_actual: item.lectura_actual,
      precio_unitario: 1.5
    });
    // According to docs, only lectura_actual is typically corrected
    this.medicionForm.get('contrato_id')?.disable();
    this.medicionForm.get('tipo_servicio')?.disable();
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitMedicion(): void {
    if (this.medicionForm.invalid) {
      this.medicionForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const formValues = this.medicionForm.getRawValue();
    
    const req = this.editingId() 
      ? this.serviciosService.update(this.editingId()!, { lectura_actual: formValues.lectura_actual }) 
      : this.serviciosService.registrarYCobrar(formValues as MedicionPayload);
    
    req.pipe(finalize(() => this.isSaving.set(false)))
       .subscribe({
         next: (res) => {
           const action = this.editingId() ? 'corregida' : 'registrada';
           this.setFeedback('success', `Lectura ${action}. Se ha generado un cargo de S/. ${res.monto}`);
           this.closeComposer();
           this.loadMediciones();
         },
         error: () => this.setFeedback('error', 'Error al procesar la medición.')
       });
  }

  openDelete(item: Medicion): void { this.pendingDelete.set(item); }
  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;
    this.serviciosService.delete(target.id).subscribe(() => {
      this.setFeedback('success', 'Medición eliminada.');
      this.pendingDelete.set(null);
      this.loadMediciones();
    });
  }

  getServiceBg(type: string): string {
    if (type === 'agua') return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
    if (type === 'luz') return 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
