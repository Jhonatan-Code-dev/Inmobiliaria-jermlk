import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CargosSectionComponent } from '../components/cargos-section.component';

@Component({
  selector: 'app-cargos-page',
  standalone: true,
  imports: [CommonModule, CargosSectionComponent],
  template: `<app-cargos-section></app-cargos-section>`
})
export class CargosPageComponent {}
