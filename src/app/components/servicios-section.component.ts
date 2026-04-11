import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ServiciosService } from '../services/servicios.service';
import { Medicion, MedicionPayload } from '../core/servicios/servicios.models';

type FeedbackTone = 'success' | 'error';
type FeedbackState = { readonly tone: FeedbackTone; readonly message: string; };

@Component({
  selector: 'app-servicios-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; --primary: #0f172a; --accent: #10b981; }
    .premium-card { background: white; border: 1px solid #f1f5f9; border-radius: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .btn-primary { background: var(--primary); color: white; border-radius: 0.75rem; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.2s; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-zoom { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `],
  template: `
    <section class="max-w-7xl mx-auto space-y-8 p-4">
      <!-- Header -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 class="text-3xl font-black tracking-tighter text-slate-900 border-l-8 border-cyan-500 pl-4">Servicios y Mediciones</h2>
          <p class="text-slate-500 font-medium mt-1 ml-4">Registra lecturas de agua, luz y consumos de cada unidad.</p>
        </div>
        <button (click)="openComposer()" class="btn-primary flex items-center gap-2 group">
          <svg class="h-4 w-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="3" d="M12 5v14M5 12h14"/></svg>
          Nueva Lectura
        </button>
      </div>

      <!-- Main List -->
      <div class="premium-card overflow-hidden">
        @if (isLoading()) {
          <div class="p-20 flex flex-col items-center justify-center space-y-4">
            <div class="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Calculando consumos...</p>
          </div>
        } @else if (mediciones().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th class="px-8 py-5">Servicio</th>
                  <th class="px-8 py-5">Lectura Actual</th>
                  <th class="px-8 py-5">Consumo</th>
                  <th class="px-8 py-5">Monto Total</th>
                  <th class="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (item of mediciones(); track item.id) {
                  <tr class="group hover:bg-slate-50/80 transition-all">
                    <td class="px-8 py-6">
                      <div class="flex items-center gap-3">
                        <div class="h-8 w-8 rounded-lg flex items-center justify-center" [ngClass]="getServiceBg(item.tipo_servicio)">
                          @if (item.tipo_servicio === 'agua') {
                             <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                          } @else if (item.tipo_servicio === 'luz') {
                             <svg class="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          } @else {
                             <svg class="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                          }
                        </div>
                        <span class="text-sm font-black text-slate-800 uppercase tracking-tight">{{ item.tipo_servicio }}</span>
                      </div>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-xs font-bold text-slate-600">{{ item.lectura_actual }}</span>
                    </td>
                    <td class="px-8 py-6">
                      <span class="text-xs font-black text-slate-900">{{ item.consumo }} unidad(es)</span>
                    </td>
                    <td class="px-8 py-6 font-black text-slate-900">
                       S/. {{ item.monto }}
                    </td>
                    <td class="px-8 py-6 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button (click)="startEdit(item)" class="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button (click)="openDelete(item)" class="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
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
          <div class="p-20 text-center">
            <p class="text-slate-500 font-bold uppercase tracking-widest">No se registraron lecturas.</p>
          </div>
        }
      </div>

      <!-- Composer Modal -->
      @if (isComposerOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="closeComposer()"></div>
          <div class="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl animate-zoom overflow-hidden">
            <div class="px-10 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 class="text-xl font-black text-slate-900 uppercase tracking-tighter">{{ editingId() ? 'Editar Lectura' : 'Nueva Medición' }}</h3>
            </div>
            <form [formGroup]="medicionForm" (ngSubmit)="submitMedicion()" class="p-10 space-y-6">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Contrato ID</label>
                <input type="number" formControlName="contrato_id" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo Servicio</label>
                  <select formControlName="tipo_servicio" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold text-slate-700">
                    <option value="agua">Agua</option>
                    <option value="luz">Luz</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Lectura Actual</label>
                  <input type="number" formControlName="lectura_actual" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio Unitario</label>
                <input type="number" formControlName="precio_unitario" class="w-full h-12 px-4 rounded-xl bg-slate-50 border-transparent outline-none font-bold"/>
              </div>
              <div class="flex gap-3 pt-6">
                <button type="button" (click)="closeComposer()" class="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">Cancelar</button>
                <button type="submit" [disabled]="isSaving()" class="flex-1 h-12 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl">
                  {{ isSaving() ? 'Guardando...' : 'Registrar Lectura' }}
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
          <div class="relative w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-2xl animate-zoom text-center">
            <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">¿Eliminar Medición?</h3>
            <div class="flex gap-2 mt-8">
              <button (click)="pendingDelete.set(null)" class="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">Cancelar</button>
              <button (click)="confirmDelete()" class="flex-1 h-11 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Confirmar</button>
            </div>
          </div>
        </div>
      }

      <!-- Feedback Toast -->
      @if (feedback(); as f) {
        <div class="fixed bottom-8 right-8 z-[200] animate-zoom">
          <div class="px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl" [ngClass]="f.tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'">
            <p class="text-xs font-black uppercase tracking-widest">{{ f.message }}</p>
          </div>
        </div>
      }
    </section>
  `
})
export class ServiciosSectionComponent implements OnInit {
  private readonly serviciosService = inject(ServiciosService);
  private readonly fb = inject(FormBuilder);

  readonly mediciones = signal<Medicion[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isComposerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly pendingDelete = signal<Medicion | null>(null);
  readonly feedback = signal<FeedbackState | null>(null);

  readonly medicionForm = this.fb.nonNullable.group({
    contrato_id: [0, [Validators.required]],
    tipo_servicio: ['agua', [Validators.required]],
    lectura_actual: [0, [Validators.required]],
    precio_unitario: [1.5, [Validators.required]]
  });

  ngOnInit(): void { this.loadMediciones(); }

  loadMediciones(): void {
    this.isLoading.set(true);
    this.serviciosService.list({})
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => this.mediciones.set(res.datos));
  }

  openComposer(): void {
    this.editingId.set(null);
    this.medicionForm.reset({ tipo_servicio: 'agua', precio_unitario: 1.5 });
    this.isComposerOpen.set(true);
  }

  startEdit(item: Medicion): void {
    this.editingId.set(item.id);
    this.medicionForm.patchValue({
      tipo_servicio: item.tipo_servicio,
      lectura_actual: item.lectura_actual,
      precio_unitario: 1.5 // Mock or fetch the unit price
    });
    this.isComposerOpen.set(true);
  }

  closeComposer(): void { this.isComposerOpen.set(false); }

  submitMedicion(): void {
    if (this.medicionForm.invalid) return;
    this.isSaving.set(true);
    const payload = this.medicionForm.getRawValue() as MedicionPayload;
    const req = this.editingId() ? this.serviciosService.update(this.editingId()!, payload) : this.serviciosService.registrarLectura(payload);
    
    req.pipe(finalize(() => { this.isSaving.set(false); this.closeComposer(); }))
       .subscribe(() => { this.setFeedback('success', 'Medición registrada.'); this.loadMediciones(); });
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
    if (type === 'agua') return 'bg-blue-100 text-blue-600';
    if (type === 'luz') return 'bg-amber-100 text-amber-600';
    return 'bg-slate-100 text-slate-600';
  }

  setFeedback(tone: FeedbackTone, message: string): void {
    this.feedback.set({ tone, message });
    setTimeout(() => this.feedback.set(null), 3000);
  }
}
