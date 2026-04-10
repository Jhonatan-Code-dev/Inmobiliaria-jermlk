import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StaffSectionComponent } from '../components/staff-section.component';

@Component({
  selector: 'app-staff-page',
  standalone: true,
  imports: [CommonModule, StaffSectionComponent],
  template: `<app-staff-section></app-staff-section>`
})
export class StaffPageComponent {}
