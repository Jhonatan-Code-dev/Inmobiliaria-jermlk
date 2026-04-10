import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TicketsSectionComponent } from '../components/tickets-section.component';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  imports: [CommonModule, TicketsSectionComponent],
  template: `<app-tickets-section></app-tickets-section>`
})
export class TicketsPageComponent {}
