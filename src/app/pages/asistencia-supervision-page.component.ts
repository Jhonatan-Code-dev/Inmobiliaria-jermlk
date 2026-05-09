import { Component } from '@angular/core';
import { AsistenciaSupervisionContentComponent } from '../components/asistencia-supervision-content.component';

@Component({
  selector: 'app-asistencia-supervision-page',
  standalone: true,
  imports: [AsistenciaSupervisionContentComponent],
  template: `<app-asistencia-supervision-content />`
})
export class AsistenciaSupervisionPageComponent {}
