import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ServiciosSectionComponent } from '../components/servicios-section.component';

@Component({
  selector: 'app-servicios-page',
  standalone: true,
  imports: [CommonModule, ServiciosSectionComponent],
  template: `<app-servicios-section></app-servicios-section>`
})
export class ServiciosPageComponent {}
