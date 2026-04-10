import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PagosSectionComponent } from '../components/pagos-section.component';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [CommonModule, PagosSectionComponent],
  template: `<app-pagos-section></app-pagos-section>`
})
export class PagosPageComponent {}
