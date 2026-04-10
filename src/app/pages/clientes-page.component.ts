import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ClientesSectionComponent } from '../components/clientes-section.component';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [CommonModule, ClientesSectionComponent],
  template: `<app-clientes-section></app-clientes-section>`
})
export class ClientesPageComponent {}
