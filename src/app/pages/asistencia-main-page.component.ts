import { Component } from '@angular/core';
import { AsistenciaSectionComponent } from '../components/asistencia-section.component';

@Component({
  selector: 'app-asistencia-page',
  standalone: true,
  imports: [AsistenciaSectionComponent],
  template: `<app-asistencia-section />`
})
export class AsistenciaPageComponent {}
