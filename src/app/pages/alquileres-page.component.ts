import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AlquileresSectionComponent } from '../components/alquileres-section.component';

@Component({
  selector: 'app-alquileres-page',
  standalone: true,
  imports: [CommonModule, AlquileresSectionComponent],
  template: `<app-alquileres-section></app-alquileres-section>`
})
export class AlquileresPageComponent {}
