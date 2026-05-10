import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ColaTrabajoSectionComponent } from '../components/cola-trabajo-section.component';

@Component({
  selector: 'app-cola-trabajo-page',
  standalone: true,
  imports: [CommonModule, ColaTrabajoSectionComponent],
  template: `<app-cola-trabajo-section></app-cola-trabajo-section>`
})
export class ColaTrabajoPageComponent {}
