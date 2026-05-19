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
import { ApiUrlBuilder } from '../core/http/api-url.builder';

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
  styles: [`
    :host { display: block; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .filter-fields { animation: filter-fields-enter 200ms cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes filter-fields-enter { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  `],
  template: `
    <section id="expenses" class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">Gestión de Gastos</h2>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">
            Administra y registra los egresos de la empresa.
          </p>
        </div>

        <button
          type="button"
          class="bg-primary-600 dark:bg-primary-500 text-white rounded-xl px-6 py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-400 transition-all flex items-center gap-2 shadow-xl shadow-primary-500/20 active:scale-95 group"
          (click)="openComposerForNewExpense()"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          Nuevo gasto
        </button>
      </div>

      <!-- Stats -->
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="bg-primary-600 dark:bg-primary-700 p-6 rounded-[2rem] text-white shadow-xl shadow-primary-500/20 relative overflow-hidden transition-colors group">
          <div class="relative z-10">
            <p class="text-[10px] font-bold uppercase tracking-widest text-primary-100 transition-colors">Total página</p>
            <p class="mt-1 text-3xl font-black tracking-tighter transition-colors">{{ pageTotalLabel() }}</p>
          </div>
          <svg class="absolute -right-2 -bottom-2 h-20 w-20 opacity-10 text-white transform rotate-12 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 10c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm0-14c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z"/></svg>
        </div>

        <div class="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm transition-colors">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Registros página</p>
          <p class="mt-1 text-3xl font-black tracking-tighter text-slate-950 dark:text-white transition-colors">{{ pageRecordCount() }}</p>
        </div>

        <div class="bg-white dark:bg-dark-surface p-6 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm transition-colors">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Total registros</p>
          <p class="mt-1 text-3xl font-black tracking-tighter text-slate-950 dark:text-white transition-colors">{{ totalRecords() }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface p-8 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm transition-colors">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 transition-colors">Filtros Avanzados</h3>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-10 px-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors active:scale-95"
              (click)="clearFilters()"
            >
              Limpiar
            </button>
            <button
              type="button"
              class="h-10 px-6 rounded-xl bg-primary-600 dark:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-700 dark:hover:bg-primary-400 transition-all disabled:opacity-50 active:scale-95"
              [disabled]="filterMode() === 'none'"
              (click)="applyFilters()"
            >
              Filtrar
            </button>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          @for (option of filterModeOptions; track option.value) {
            <button
              type="button"
              class="rounded-xl border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all"
              [ngClass]="filterMode() === option.value
                ? 'border-primary-600 dark:border-primary-400 bg-primary-600 dark:bg-primary-400 text-white dark:text-slate-900 shadow-lg shadow-primary-500/20'
                : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-600 dark:text-slate-400 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-white dark:hover:bg-dark-surface'"
              (click)="setFilterMode(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>

        @if (filterMode() !== 'none') {
          <form
            class="filter-fields mt-8 grid gap-6"
            [ngClass]="{
              'md:grid-cols-2': filterMode() === 'anio' || filterMode() === 'rango',
              'md:grid-cols-1 max-w-xs': filterMode() === 'fecha'
            }"
            [formGroup]="filtersForm"
            (ngSubmit)="applyFilters()"
          >
            @if (filterMode() === 'anio') {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Año fiscal</label>
                <input
                  type="number"
                  formControlName="anio"
                  placeholder="Ej: 2026"
                  class="flex h-12 w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-4 text-sm font-bold text-slate-900 dark:text-white transition-colors outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Mes contable</label>
                <select
                  formControlName="mes"
                  class="flex h-12 w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-4 text-sm font-bold text-slate-900 dark:text-slate-300 transition-colors outline-none focus:ring-2 focus:ring-primary-500"
                >
                  @for (month of monthOptions; track month.value) {
                    <option [value]="month.value">{{ month.label }}</option>
                  }
                </select>
              </div>
            }

            @if (filterMode() === 'rango') {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Fecha de inicio</label>
                <input
                  type="date"
                  formControlName="desde"
                  class="flex h-12 w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-4 text-sm font-bold text-slate-900 dark:text-white transition-colors outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Fecha de término</label>
                <input
                  type="date"
                  formControlName="hasta"
                  class="flex h-12 w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-4 text-sm font-bold text-slate-900 dark:text-white transition-colors outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            }

            @if (filterMode() === 'fecha') {
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Fecha exacta del gasto</label>
                <input
                  type="date"
                  formControlName="fecha"
                  class="flex h-12 w-full rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-4 text-sm font-bold text-slate-900 dark:text-white transition-colors outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            }
          </form>
        } @else {
          <p class="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors">Selecciona un tipo de filtro para refinar los resultados.</p>
        }
      </div>

      <!-- Main List -->
      <div class="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-[2.5rem] shadow-sm overflow-hidden transition-colors">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-dark-border p-8 transition-colors">
          <div>
            <h3 class="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors">Historial de Egresos</h3>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1 transition-colors">Listado detallado de movimientos</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="h-10 px-5 rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                [disabled]="isExportingExcel()"
                (click)="exportReport('excel')"
              >
                @if (isExportingExcel()) {
                  <div class="h-3 w-3 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                } @else {
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                }
                <span>Excel</span>
              </button>
              <button
                type="button"
                class="h-10 px-5 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                [disabled]="isExportingPdf()"
                (click)="exportReport('pdf')"
              >
                @if (isExportingPdf()) {
                  <div class="h-3 w-3 border-2 border-rose-600 dark:border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                } @else {
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                }
                <span>PDF</span>
              </button>
            </div>
            <div class="flex items-center gap-2 overflow-hidden text-[10px] font-black uppercase tracking-widest transition-colors">
              <span class="hidden sm:inline-block rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-4 py-2 text-slate-600 dark:text-slate-400 transition-colors">
                {{ pagination().total }} registros
              </span>
              <span
                class="rounded-xl border px-4 py-2 transition-colors"
                [ngClass]="hasFiltersActive() ? 'border-primary-600 dark:border-primary-400 bg-primary-600 dark:bg-primary-400 text-white dark:text-slate-900 shadow-lg shadow-primary-500/20' : 'border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-600 dark:text-slate-400'"
              >
                {{ hasFiltersActive() ? 'Filtrado' : 'Todo' }}
              </span>
            </div>
          </div>
        </div>

        @if (isLoadingList()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sincronizando Registros...</p>
          </div>
        } @else if (gastos().length) {
          <div class="w-full overflow-x-auto custom-scrollbar">
            <table class="w-full text-left">
              <thead class="border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50 transition-colors">
                <tr class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 transition-colors">
                  <th scope="col" class="px-8 py-5">Descripción</th>
                  <th scope="col" class="px-8 py-5">Fecha</th>
                  <th scope="col" class="px-8 py-5">Método de pago</th>
                  <th scope="col" class="px-8 py-5 text-right font-black">Monto</th>
                  <th scope="col" class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-dark-border transition-colors">
                @for (gasto of gastos(); track gasto.id) {
                  <tr class="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td class="whitespace-nowrap px-8 py-6">
                       <p class="font-black text-sm text-slate-900 dark:text-white transition-colors uppercase tracking-tight">{{ gasto.descripcion }}</p>
                    </td>
                    <td class="whitespace-nowrap px-8 py-6">
                       <span class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 transition-colors">{{ formatShortDate(gasto.fecha) }}</span>
                    </td>
                    <td class="whitespace-nowrap px-8 py-6">
                       <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">{{ resolvePaymentMethodName(gasto) }}</span>
                    </td>
                    <td class="whitespace-nowrap bg-primary-50/20 dark:bg-primary-900/10 px-8 py-6 text-right">
                       <span class="text-sm font-black text-primary-600 dark:text-primary-400 transition-colors">{{ formatCurrency(gasto.monto, empresa()?.moneda ?? 'PEN') }}</span>
                    </td>
                    <td class="whitespace-nowrap px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2 transition-all">
                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600 dark:hover:border-primary-400 transition-all shadow-sm active:scale-95"
                          (click)="startEdit(gasto)"
                        >
                          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                          [disabled]="deletingId() !== null"
                          (click)="openDeleteDialog(gasto)"
                        >
                          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between border-t border-slate-200 dark:border-dark-border p-8 transition-colors bg-slate-50/30 dark:bg-dark-bg/30">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">
              Página {{ pagination().pagina }} de {{ pagination().paginas }}
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="h-9 px-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors disabled:opacity-50 shadow-sm active:scale-95"
                [disabled]="pagination().pagina <= 1"
                (click)="goToPage(pagination().pagina - 1)"
              >
                Anterior
              </button>
              <button
                type="button"
                class="h-9 px-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors disabled:opacity-50 shadow-sm active:scale-95"
                [disabled]="pagination().pagina >= pagination().paginas"
                (click)="goToPage(pagination().pagina + 1)"
              >
                Siguiente
              </button>
            </div>
          </div>
        } @else {
          <div class="p-24 text-center">
            <div class="h-24 w-24 bg-slate-50 dark:bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-500 transition-colors shadow-inner">
               <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter transition-colors">Sin Egresos</h3>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors max-w-xs mx-auto">No hay gastos registrados que coincidan con los criterios de búsqueda.</p>
          </div>
        }
      </div>

      <!-- Composer Modal Profesional -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
            (click)="closeComposer()"
          ></div>

          <div
            class="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] bg-white dark:bg-dark-surface shadow-2xl animate-zoom transition-colors border border-white/10 dark:border-dark-border"
          >
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-dark-border px-10 py-8 bg-slate-50/50 dark:bg-dark-bg/50 transition-colors">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-2xl bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <h3 class="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white transition-colors leading-none">{{ formTitle() }}</h3>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1.5 transition-colors">Ingresa los datos del comprobante contable</p>
                </div>
              </div>
              <button
                type="button"
                class="h-10 w-10 rounded-full bg-white dark:bg-dark-bg flex items-center justify-center text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 shadow-sm border border-slate-100 dark:border-dark-border transition-all active:scale-90"
                (click)="closeComposer()"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form class="space-y-6 p-10" [formGroup]="gastoForm" (ngSubmit)="submitGasto()">
              <!-- Concepto -->
              <div class="space-y-2">
                <div class="flex items-center justify-between ml-1">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Concepto del gasto (Máx. 20)</label>
                  @if (isInvalid('descripcion')) {
                    <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('descripcion') }}</span>
                  }
                </div>
                <div class="relative group">
                  <input
                    type="text"
                    formControlName="descripcion"
                    maxlength="20"
                    placeholder="Ej: Pago de luz..."
                    [ngClass]="isInvalid('descripcion') ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500/20'"
                    class="w-full h-14 pl-12 pr-4 rounded-2xl border bg-slate-50 dark:bg-dark-bg text-sm font-bold text-slate-900 dark:text-white transition-all outline-none focus:ring-4 focus:bg-white dark:focus:bg-dark-bg"
                  />
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </div>
              </div>

              <div class="grid gap-6 sm:grid-cols-2">
                <!-- Fecha -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between ml-1">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Fecha de emisión</label>
                    @if (isInvalid('fecha')) {
                      <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('fecha') }}</span>
                    }
                  </div>
                  <div class="relative group">
                    <input
                      type="date"
                      formControlName="fecha"
                      [ngClass]="isInvalid('fecha') ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500/20'"
                      class="w-full h-14 pl-12 pr-4 rounded-2xl border bg-slate-50 dark:bg-dark-bg text-sm font-bold text-slate-900 dark:text-white transition-all outline-none focus:ring-4 focus:bg-white dark:focus:bg-dark-bg"
                    />
                    <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                </div>

                <!-- Monto -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between ml-1">
                    <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Importe total</label>
                    @if (isInvalid('monto_display')) {
                      <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('monto_display') }}</span>
                    }
                  </div>
                  <div class="relative group">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/.</span>
                    <input
                      type="number"
                      formControlName="monto_display"
                      step="0.01"
                      placeholder="0.00"
                      [ngClass]="isInvalid('monto_display') ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500/20'"
                      class="w-full h-14 pl-12 pr-4 rounded-2xl border bg-slate-50 dark:bg-dark-bg text-sm font-black text-primary-600 dark:text-primary-400 transition-all outline-none focus:ring-4 focus:bg-white dark:focus:bg-dark-bg"
                    />
                  </div>
                </div>
              </div>

              <!-- Método de Pago -->
              <div class="space-y-2">
                <div class="flex items-center justify-between ml-1">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-colors">Forma de pago</label>
                  @if (isInvalid('tipo_pago_id')) {
                    <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider animate-pulse">{{ getErrorMessage('tipo_pago_id') }}</span>
                  }
                </div>
                <div class="relative group">
                  <select
                    formControlName="tipo_pago_id"
                    [ngClass]="isInvalid('tipo_pago_id') ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-dark-border focus:ring-primary-500/20'"
                    class="w-full h-14 pl-12 pr-10 rounded-2xl border bg-slate-50 dark:bg-dark-bg text-sm font-bold text-slate-900 dark:text-slate-300 transition-all outline-none focus:ring-4 focus:bg-white dark:focus:bg-dark-bg appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecciona un método</option>
                    @for (metodo of metodosPago(); track metodo.id) {
                      <option [value]="metodo.id">{{ metodo.nombre | uppercase }}</option>
                    }
                  </select>
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  <svg class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M19 9l-7 7-7-7"/></svg>
                </div>
                @if (metodosPago().length === 0) {
                  <p class="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                    <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z" stroke-width="4" class="opacity-25"/><path d="M12 2a10 10 0 0110 10" stroke-width="4" class="opacity-75"/></svg>
                    Cargando catálogo de pagos...
                  </p>
                }
              </div>

              <div class="mt-8 flex gap-4 border-t border-slate-100 dark:border-dark-border pt-8 transition-colors">
                <button
                  type="button"
                  class="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-dark-bg active:scale-95"
                  (click)="cancelEdit()"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="flex-1 h-14 rounded-2xl bg-primary-600 dark:bg-primary-500 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/30 transition-all hover:bg-primary-700 dark:hover:bg-primary-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  [disabled]="isSaving()"
                >
                  {{ formSubmitLabel() }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (isDeleteDialogOpen()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <button
            type="button"
            class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            aria-label="Cerrar confirmacion de eliminacion"
            [disabled]="deletingId() !== null"
            (click)="closeDeleteDialog()"
          ></button>

          <section class="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-white dark:bg-dark-surface p-10 shadow-2xl animate-zoom text-center transition-colors border border-slate-100 dark:border-dark-border">
            <div class="h-20 w-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400 transition-colors shadow-sm">
                 <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <h3 class="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white transition-colors">¿Eliminar registro?</h3>
            <p class="mt-3 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 transition-colors">
              Se eliminará <span class="font-black text-slate-900 dark:text-white">{{ deleteDialogDescription() }}</span> de forma permanente.
            </p>

            <div class="mt-10 flex items-center justify-center gap-3">
              <button
                type="button"
                class="flex-1 h-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                [disabled]="deletingId() !== null"
                (click)="closeDeleteDialog()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="flex-1 h-12 items-center justify-center rounded-xl bg-rose-600 dark:bg-rose-500 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                [disabled]="deletingId() !== null"
                (click)="confirmDeleteGasto()"
              >
                {{ deletingId() !== null ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </section>
        </div>
      }

      <!-- Notificaciones (Toast) - Posicionamiento directo para evitar interferencias -->
      <div class="fixed top-8 right-8 z-[500] pointer-events-none flex flex-col items-end gap-3">
        @if (feedback(); as currentFeedback) {
          <div class="pointer-events-auto animate-zoom flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] bg-slate-900 dark:bg-white shadow-2xl border border-white/10 dark:border-slate-200 transition-all min-w-[320px]">
            <div class="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
                 [ngClass]="currentFeedback.tone === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'">
              @if (currentFeedback.tone === 'success') {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              } @else {
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              }
            </div>
            <div class="flex flex-col pr-2">
              <span class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">Notificación</span>
              <p class="text-xs font-bold text-white dark:text-slate-900 leading-tight">{{ currentFeedback.message }}</p>
            </div>
            <button (click)="feedback.set(null)" class="ml-auto text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors p-1">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        }
      </div>
    </section>
  `
})
export class GastosSectionComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly gastosService = inject(GastosService);
  private readonly authService = inject(AuthService);
  private readonly apiUrlBuilder = inject(ApiUrlBuilder);

  readonly empresa = this.authService.empresa;
  readonly monthOptions = MONTH_OPTIONS;
  readonly filterModeOptions = FILTER_MODE_OPTIONS;
  readonly filterMode = signal<FilterMode>('none');
  readonly metodosPago = signal<MetodoPago[]>([]);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    anio: '',
    mes: '',
    desde: '',
    hasta: '',
    fecha: ''
  });

  readonly gastoForm = this.formBuilder.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(20)]],
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

  readonly isExportingExcel = signal(false);
  readonly isExportingPdf = signal(false);

  isInvalid(controlName: string): boolean {
    const control = this.gastoForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(controlName: string): string {
    const control = this.gastoForm.get(controlName);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Obligatorio';
    if (control.errors['min']) return 'Monto inválido';
    if (control.errors['maxlength']) return 'Muy largo';
    return 'Dato inválido';
  }

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
        ? 'Guardando...'
        : 'Registrando...'
      : this.editingId()
        ? 'Guardar cambios'
        : 'Confirmar Registro'
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
            editingId ? 'Gasto actualizado.' : 'Gasto registrado.'
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

  resolvePaymentMethodName(gasto: Gasto): string {
    const methodName = this.paymentMethodNameById().get(gasto.tipo_pago_id);
    return methodName ? methodName : `ID ${gasto.tipo_pago_id}`;
  }

  formatCurrency(value: number, currency: string): string {
    if (currency === 'PEN') {
      return `S/. ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
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
      dateStyle: 'medium',
      timeZone: 'UTC'
    }).format(date);
  }

  exportReport(formato: 'excel' | 'pdf'): void {
    const filters = this.buildFilters(1);
    if (!filters) {
      this.setFeedback('error', 'No se pudieron determinar los filtros para el reporte.');
      return;
    }

    const setLoader = (value: boolean) => {
      if (formato === 'excel') this.isExportingExcel.set(value);
      else this.isExportingPdf.set(value);
    };

    setLoader(true);

    this.gastosService
      .downloadReport(formato, filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => setLoader(false))
      )
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          const timestamp = this.todayDate();
          const extension = formato === 'excel' ? 'xlsx' : 'pdf';
          link.setAttribute('download', `reporte_gastos_${timestamp}.${extension}`);
          
          document.body.appendChild(link);
          link.click();
          
          link.remove();
          window.URL.revokeObjectURL(url);
          
          this.setFeedback('success', `Reporte ${formato.toUpperCase()} generado y descargado correctamente.`);
        },
        error: (error: unknown) => {
          this.setFeedback('error', extractHttpErrorMessage(error, 'No se pudo generar el reporte.'));
        }
      });
  }

  private buildFilters(page: number): GastosFilters | null {
    const empresaId = this.empresa()?.id;

    if (!empresaId) {
      return null;
    }

    const rawFilters = this.filtersForm.getRawValue();

    const safe = {
      anio: String(rawFilters.anio ?? ''),
      mes: String(rawFilters.mes ?? ''),
      desde: String(rawFilters.desde ?? ''),
      hasta: String(rawFilters.hasta ?? ''),
      fecha: String(rawFilters.fecha ?? '')
    };

    const exactDate = this.normalizeNullableText(safe.fecha);

    if (exactDate) {
      return { empresa_id: empresaId, pag: page, fecha: exactDate };
    }

    const desde = this.normalizeNullableText(safe.desde);
    const hasta = this.normalizeNullableText(safe.hasta);

    if (desde && hasta) {
      return { empresa_id: empresaId, pag: page, desde, hasta };
    }

    const anio = this.parseNullableNumber(safe.anio);
    const mes = this.parseMonth(safe.mes);

    if (anio && mes) {
      return { empresa_id: empresaId, pag: page, anio, mes };
    }

    if (anio) {
      return { empresa_id: empresaId, pag: page, anio };
    }

    return { empresa_id: empresaId, pag: page };
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

    // Buscar el ID de "Efectivo" para pre-seleccionarlo
    const efectivoMethod = this.metodosPago().find(m => 
      m.nombre.toLowerCase().includes('efectivo')
    );
    const defaultTipoPago = efectivoMethod ? String(efectivoMethod.id) : '';

    this.gastoForm.reset({
      descripcion: '',
      fecha: this.todayDate(),
      monto_display: '',
      tipo_pago_id: defaultTipoPago
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

    // Extract YYYY-MM-DD directly from the ISO string to prevent local timezone shifting
    const parts = value.split('T');
    if (parts[0] && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
      return parts[0];
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return this.todayDate();
    }

    return this.formatDateForInput(date);
  }

  private setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
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
