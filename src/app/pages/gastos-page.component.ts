import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GastosSectionComponent } from '../components/gastos-section.component';

@Component({
  selector: 'app-gastos-page',
  standalone: true,
  imports: [CommonModule, GastosSectionComponent],
  template: `<app-gastos-section></app-gastos-section>`
})
export class GastosPageComponent {}
