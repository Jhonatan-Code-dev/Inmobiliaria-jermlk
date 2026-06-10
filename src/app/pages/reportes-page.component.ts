import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ReportesService } from '../services/reportes.service';
import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgApexchartsModule],
  styles: [`
    :host { display: block; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    .card-dashboard {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 2rem;
      border: 1px solid rgba(226, 232, 240, 0.8);
      padding: 1.75rem;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
      transition: all 0.3s ease;
    }
    :host-context(.dark) .card-dashboard {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.5);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
    }
    .card-dashboard:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
    }
    :host-context(.dark) .card-dashboard:hover {
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4);
    }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header with Filter Controls -->
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-dark-surface p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-border transition-colors">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-3xl font-black tracking-tighter text-slate-950 dark:text-white border-l-8 border-primary-600 dark:border-primary-500 pl-4 transition-colors">
              Reportes Gerenciales
            </h2>
            <span class="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-lg animate-pulse">
              Dashboard Activo
            </span>
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-4 transition-colors">
            Cuadro de mando corporativo para la toma de decisiones financieras y operacionales.
          </p>
        </div>
        
        <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800 transition-colors">
          <div class="flex items-center gap-2">
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Desde</label>
            <input type="date" formControlName="desde" class="h-10 px-3 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"/>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-400">Hasta</label>
            <input type="date" formControlName="hasta" class="h-10 px-3 rounded-xl bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"/>
          </div>
          <div class="flex gap-2">
            <button type="submit" [disabled]="isLoading()" class="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-sm disabled:opacity-50">
              Filtrar
            </button>
            <button type="button" (click)="resetFilters()" [disabled]="isLoading()" class="h-10 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">
              Reiniciar
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="p-24 flex flex-col items-center justify-center space-y-4">
        <div class="h-14 w-14 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] animate-pulse">
          Procesando métricas gerenciales y consolidando datos...
        </p>
      </div>

      <!-- Main Dashboard Grid -->
      <div *ngIf="!isLoading()" class="space-y-8 animate-zoom">
        
        <!-- KPI Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- KPI 1 -->
          <div class="card-dashboard flex items-center justify-between">
            <div>
              <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Volumen Total Ingresos (Meses Seleccionados)</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white mt-1 select-none">
                {{ formatCurrency(kpis.totalIngresos) }}
              </h3>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306 9.75-9.75M18.75 8.25h4.5v4.5" /></svg>
            </div>
          </div>
          
          <!-- KPI 2 -->
          <div class="card-dashboard flex items-center justify-between">
            <div>
              <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Eficiencia Operativa (Margen Neto)</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white mt-1 select-none">
                {{ kpis.margenNeto | number:'1.0-1' }}%
              </h3>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
            </div>
          </div>
          
          <!-- KPI 3 -->
          <div class="card-dashboard flex items-center justify-between">
            <div>
              <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Carga Operativa de Soporte</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white mt-1 select-none">
                {{ kpis.totalTickets }} <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Tickets</span>
              </h3>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l-1.12-1.12c-.592-.592-1.46-.838-2.288-.621L3 14.5l6.22-6.22a3.75 3.75 0 1 1 5.3 5.3l-2.288 2.287M11.42 15.17l-4.444-4.444" /></svg>
            </div>
          </div>
        </div>

        <!-- Charts Grid Section 1 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- 1. Tendencia Financiera Mensual (Full Row Span on Large Screens) -->
          <div class="card-dashboard lg:col-span-2">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Tendencia Financiera Mensual</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ingresos vs Gastos vs Utilidad Neta</p>
              </div>
            </div>
            <div class="w-full overflow-hidden" *ngIf="hasFinancieroData()">
              <apx-chart
                [series]="financieroChart.series"
                [chart]="financieroChart.chart"
                [xaxis]="financieroChart.xaxis"
                [yaxis]="financieroChart.yaxis"
                [stroke]="financieroChart.stroke"
                [colors]="financieroChart.colors"
                [fill]="financieroChart.fill"
                [legend]="financieroChart.legend"
                [markers]="financieroChart.markers"
                [tooltip]="financieroChart.tooltip"
                [theme]="chartTheme()"
              ></apx-chart>
            </div>
            <div *ngIf="!hasFinancieroData()" class="w-full flex flex-col justify-center items-center py-20 text-center">
              <div class="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>
              </div>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin datos financieros</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No hay transacciones registradas en este período.</p>
            </div>
          </div>

          <!-- 2. Distribución de Métodos de Pago -->
          <div class="card-dashboard">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Métodos de Pago</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distribución porcentual de recaudación</p>
              </div>
            </div>
            <div class="w-full flex justify-center items-center py-4" *ngIf="hasPagosData()">
              <apx-chart
                [series]="pagosChart.series"
                [chart]="pagosChart.chart"
                [labels]="pagosChart.labels"
                [colors]="pagosChart.colors"
                [legend]="pagosChart.legend"
                [responsive]="pagosChart.responsive"
                [theme]="chartTheme()"
              ></apx-chart>
            </div>
            <div *ngIf="!hasPagosData()" class="w-full flex flex-col justify-center items-center py-12 text-center">
              <div class="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
              </div>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin datos de recaudación</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No se registraron cobros en el período seleccionado.</p>
            </div>
          </div>
        </div>

        <!-- Charts Grid Section 2 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- 3. Distribución de Categorías de Gastos -->
          <div class="card-dashboard">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Breakdown de Egresos</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gastos clasificados por categorías</p>
              </div>
            </div>
            <div class="w-full flex justify-center items-center py-4" *ngIf="hasGastosData()">
              <apx-chart
                [series]="gastosChart.series"
                [chart]="gastosChart.chart"
                [labels]="gastosChart.labels"
                [colors]="gastosChart.colors"
                [legend]="gastosChart.legend"
                [responsive]="gastosChart.responsive"
                [theme]="chartTheme()"
              ></apx-chart>
            </div>
            <div *ngIf="!hasGastosData()" class="w-full flex flex-col justify-center items-center py-12 text-center">
              <div class="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              </div>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin gastos registrados</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No se reportaron egresos en el período seleccionado.</p>
            </div>
          </div>

          <!-- 4. Rentabilidad por Propiedades (Horizontal Double Bar Chart) -->
          <div class="card-dashboard lg:col-span-2">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Rentabilidad Operativa por Propiedad</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Desempeño financiero prorrateado</p>
              </div>
            </div>
            <div class="w-full overflow-hidden" *ngIf="hasRentabilidadData()">
              <apx-chart
                [series]="rentabilidadChart.series"
                [chart]="rentabilidadChart.chart"
                [plotOptions]="rentabilidadChart.plotOptions"
                [xaxis]="rentabilidadChart.xaxis"
                [colors]="rentabilidadChart.colors"
                [legend]="rentabilidadChart.legend"
                [tooltip]="rentabilidadChart.tooltip"
                [theme]="chartTheme()"
              ></apx-chart>
            </div>
            <div *ngIf="!hasRentabilidadData()" class="w-full flex flex-col justify-center items-center py-20 text-center">
              <div class="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.339a.75.75 0 0 0-.208-.518L12 3.75l-8.292 6.071a.75.75 0 0 0-.208.518V21h17.25Z" /></svg>
              </div>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin datos de propiedades</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No hay datos financieros asignados a las propiedades.</p>
            </div>
          </div>
        </div>

        <!-- Column Section 3: Tickets and Workload -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Tickets Priorities Pie Chart -->
          <div class="card-dashboard">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Soporte por Prioridad</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clasificación de solicitudes críticas</p>
              </div>
            </div>
            <div class="w-full flex justify-center items-center py-4" *ngIf="hasTicketsData()">
              <apx-chart
                [series]="ticketsChart.series"
                [chart]="ticketsChart.chart"
                [labels]="ticketsChart.labels"
                [colors]="ticketsChart.colors"
                [legend]="ticketsChart.legend"
                [responsive]="ticketsChart.responsive"
                [theme]="chartTheme()"
              ></apx-chart>
            </div>
            <div *ngIf="!hasTicketsData()" class="w-full flex flex-col justify-center items-center py-12 text-center">
              <div class="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin incidencias de soporte</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">No se registraron incidentes técnicos en este período.</p>
            </div>
          </div>

          <!-- Tickets Status breakdown card -->
          <div class="card-dashboard md:col-span-2">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h3 class="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Estados de Incidentes Técnicos</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SLA y control de mantenimiento de unidades</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
              <!-- Abiertos -->
              <div class="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex flex-col items-center text-center">
                <span class="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-2">Abiertos</span>
                <span class="text-4xl font-black text-rose-600 dark:text-rose-400">{{ kpis.ticketsAbiertos }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Por iniciar</span>
              </div>
              
              <!-- En Progreso -->
              <div class="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex flex-col items-center text-center">
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-2">En Progreso</span>
                <span class="text-4xl font-black text-amber-600 dark:text-amber-400">{{ kpis.ticketsEnProgreso }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Resolviendo</span>
              </div>
              
              <!-- Resueltos -->
              <div class="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center">
                <span class="text-[10px] font-black uppercase tracking-wider text-emerald-500 mb-2">Resueltos</span>
                <span class="text-4xl font-black text-emerald-600 dark:text-emerald-400">{{ kpis.ticketsResueltos }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Finalizados</span>
              </div>

              <!-- Anulados -->
              <div class="p-6 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 flex flex-col items-center text-center">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Anulados</span>
                <span class="text-4xl font-black text-slate-600 dark:text-slate-400">{{ kpis.ticketsAnulados }}</span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Cancelados</span>
              </div>
            </div>
            
            <div class="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span class="text-slate-500 font-bold dark:text-slate-400 uppercase tracking-wider text-[10px]">Tasa de Resolución Operativa:</span>
              <span class="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {{ ((kpis.ticketsResueltos / (kpis.totalTickets || 1)) * 100) | number:'1.0-1' }}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  `
})
export class ReportesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly reportesService = inject(ReportesService);
  private readonly themeService = inject(ThemeService);

  readonly empresa = this.authService.empresa;
  readonly isLoading = signal(false);

  readonly hasFinancieroData = signal(false);
  readonly hasPagosData = signal(false);
  readonly hasGastosData = signal(false);
  readonly hasRentabilidadData = signal(false);
  readonly hasTicketsData = signal(false);

  readonly filterForm = this.fb.group({
    desde: [''],
    hasta: ['']
  });

  // KPI States
  kpis = {
    totalIngresos: 0,
    margenNeto: 0,
    totalTickets: 0,
    ticketsAbiertos: 0,
    ticketsEnProgreso: 0,
    ticketsResueltos: 0,
    ticketsAnulados: 0
  };

  // ApexCharts Options Configurations
  financieroChart: any = {};
  pagosChart: any = {};
  gastosChart: any = {};
  rentabilidadChart: any = {};
  ticketsChart: any = {};

  readonly chartTheme = computed(() => ({
    mode: this.themeService.isDarkActive() ? 'dark' : 'light' as 'light' | 'dark',
    palette: 'palette1'
  }));

  ngOnInit(): void {
    // Load initial data
    this.loadData();
  }

  loadData(desde?: string, hasta?: string): void {
    const empresaId = this.empresa()?.id;
    if (!empresaId) return;

    this.isLoading.set(true);
    this.reportesService.cargarDashboardCompleto(empresaId, desde, hasta)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => {
        this.processKpis(res);
        this.initFinancieroChart(res.financiero);
        this.initPagosChart(res.metodosPago);
        this.initGastosChart(res.categoriasGastos);
        this.initRentabilidadChart(res.rentabilidad);
        this.initTicketsChart(res.tickets);
      });
  }

  applyFilters(): void {
    const { desde, hasta } = this.filterForm.value;
    this.loadData(desde || undefined, hasta || undefined);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.loadData();
  }

  private processKpis(res: any): void {
    // 1. Total ingresos & margen
    let totalIng = 0;
    let totalGastos = 0;
    if (res.financiero?.serie_mensual) {
      res.financiero.serie_mensual.forEach((s: any) => {
        totalIng += s.ingresos || 0;
        totalGastos += s.gastos || 0;
      });
    }
    this.kpis.totalIngresos = totalIng;
    this.kpis.margenNeto = totalIng > 0 ? ((totalIng - totalGastos) / totalIng) * 100 : 0;

    // 2. Tickets counts
    if (res.tickets) {
      this.kpis.totalTickets = res.tickets.total_tickets || 0;
      this.kpis.ticketsAbiertos = res.tickets.por_estado?.abierto || 0;
      this.kpis.ticketsEnProgreso = res.tickets.por_estado?.en_progreso || 0;
      this.kpis.ticketsResueltos = res.tickets.por_estado?.resuelto || 0;
      this.kpis.ticketsAnulados = res.tickets.por_estado?.anulado || 0;
    }
  }

  private initFinancieroChart(data: any): void {
    const hasData = data && data.serie_mensual && data.serie_mensual.length > 0 && data.serie_mensual.some((s: any) => s.ingresos > 0 || s.gastos > 0);
    this.hasFinancieroData.set(hasData);
    if (!hasData) return;

    const meses = data.serie_mensual.map((s: any) => s.periodo);
    const ingresos = data.serie_mensual.map((s: any) => s.ingresos);
    const gastos = data.serie_mensual.map((s: any) => s.gastos);
    const balance = data.serie_mensual.map((s: any) => s.balance);

    const currencySymbol = this.empresa()?.moneda || 'S/.';

    this.financieroChart = {
      series: [
        { name: 'Ingresos', type: 'column', data: ingresos },
        { name: 'Gastos', type: 'column', data: gastos },
        { name: 'Balance Neto', type: 'line', data: balance }
      ],
      chart: {
        height: 350,
        type: 'line',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 850 },
        background: 'transparent'
      },
      colors: ['#10B981', '#EF4444', '#3B82F6'],
      stroke: { width: [0, 0, 4.5], curve: 'smooth' },
      fill: { opacity: [0.85, 0.85, 1] },
      xaxis: { categories: meses },
      yaxis: {
        labels: {
          formatter: (val: number) => `${currencySymbol} ${val.toLocaleString()}`
        }
      },
      markers: { size: 5, strokeWidth: 2, hover: { size: 7 } },
      legend: { position: 'top', horizontalAlign: 'right' },
      tooltip: {
        y: {
          formatter: (val: number) => `${currencySymbol} ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
        }
      }
    };
  }

  private initPagosChart(data: any[]): void {
    const hasData = data && data.length > 0 && data.some(d => d.total > 0);
    this.hasPagosData.set(hasData);
    if (!hasData) return;

    const labels = data.map(d => d.metodo.toUpperCase());
    const series = data.map(d => d.total);

    this.pagosChart = {
      series: series,
      labels: labels,
      chart: {
        type: 'donut',
        height: 310,
        background: 'transparent'
      },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
      legend: { position: 'bottom', horizontalAlign: 'center' },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { width: 280 },
            legend: { position: 'bottom' }
          }
        }
      ]
    };
  }

  private initGastosChart(data: any[]): void {
    const hasData = data && data.length > 0 && data.some(d => d.total > 0);
    this.hasGastosData.set(hasData);
    if (!hasData) return;

    const labels = data.map(d => d.categoria.toUpperCase());
    const series = data.map(d => d.total);

    this.gastosChart = {
      series: series,
      labels: labels,
      chart: {
        type: 'donut',
        height: 310,
        background: 'transparent'
      },
      colors: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#64748B'],
      legend: { position: 'bottom', horizontalAlign: 'center' },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { width: 280 },
            legend: { position: 'bottom' }
          }
        }
      ]
    };
  }

  private initRentabilidadChart(data: any[]): void {
    const hasData = data && data.length > 0 && data.some(d => d.ingresos > 0 || d.gastos > 0);
    this.hasRentabilidadData.set(hasData);
    if (!hasData) return;

    const properties = data.map(r => r.nombre || r.propiedad || '');
    const ingresos = data.map(r => r.ingresos);
    const gastos = data.map(r => r.gastos);
    const rentabilidad = data.map(r => r.rentabilidad);

    const currencySymbol = this.empresa()?.moneda || 'S/.';

    this.rentabilidadChart = {
      series: [
        { name: 'Ingresos', data: ingresos },
        { name: 'Gastos Asignados', data: gastos },
        { name: 'Utilidad Neta', data: rentabilidad }
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '75%',
          dataLabels: { position: 'top' }
        }
      },
      colors: ['#10B981', '#F59E0B', '#3B82F6'],
      xaxis: {
        categories: properties,
        labels: {
          formatter: (val: number) => `${currencySymbol} ${val.toLocaleString()}`
        }
      },
      legend: { position: 'top', horizontalAlign: 'right' },
      tooltip: {
        y: {
          formatter: (val: number) => `${currencySymbol} ${val.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
        }
      }
    };
  }

  private initTicketsChart(data: any): void {
    const baja = data?.por_prioridad?.baja || 0;
    const media = data?.por_prioridad?.media || 0;
    const alta = data?.por_prioridad?.alta || 0;
    const hasData = (baja + media + alta) > 0;
    this.hasTicketsData.set(hasData);
    if (!hasData) return;

    this.ticketsChart = {
      series: [baja, media, alta],
      labels: ['BAJA', 'MEDIA', 'ALTA'],
      chart: {
        type: 'pie',
        height: 310,
        background: 'transparent'
      },
      colors: ['#10B981', '#F59E0B', '#EF4444'], // Traffic light priority mapping
      legend: { position: 'bottom', horizontalAlign: 'center' },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: { width: 280 },
            legend: { position: 'bottom' }
          }
        }
      ]
    };
  }

  formatCurrency(amount: number): string {
    const currency = this.empresa()?.moneda || 'PEN';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
  }
}
