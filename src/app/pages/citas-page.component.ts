import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CitasSectionComponent } from '../components/citas-section.component';

@Component({
  selector: 'app-citas-page',
  standalone: true,
  imports: [CommonModule, CitasSectionComponent],
  template: `<app-citas-section></app-citas-section>`
})
export class CitasPageComponent {}
