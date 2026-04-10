import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { InmueblesSectionComponent } from '../components/inmuebles-section.component';

@Component({
  selector: 'app-inmuebles-page',
  standalone: true,
  imports: [CommonModule, InmueblesSectionComponent],
  template: `<app-inmuebles-section></app-inmuebles-section>`
})
export class InmueblesPageComponent {}
