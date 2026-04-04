import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type LoginHighlight = {
  readonly title: string;
  readonly detail: string;
};

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  protected readonly highlights: readonly LoginHighlight[] = [
    {
      title: 'Cobros y proximos vencimientos',
      detail: 'Ve alquileres por vencer, pagos parciales y alertas de mora en tiempo real.'
    },
    {
      title: 'Servicios bajo control',
      detail: 'Recibe seguimiento de luz, agua y otros servicios ligados a cada propiedad.'
    },
    {
      title: 'Equipo y clientes alineados',
      detail: 'Acceso centralizado para administracion, seguimiento y atencion mas ordenada.'
    }
  ];
}
