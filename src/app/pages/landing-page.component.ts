import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Stat = {
  readonly value: string;
  readonly label: string;
};

type Feature = {
  readonly title: string;
  readonly description: string;
};

type Workflow = {
  readonly title: string;
  readonly detail: string;
};

type Notification = {
  readonly type: string;
  readonly message: string;
  readonly eta: string;
};

type TimelineItem = {
  readonly step: string;
  readonly title: string;
  readonly detail: string;
};

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  protected readonly stats: readonly Stat[] = [
    { value: '24/7', label: 'control centralizado de cobros y contratos' },
    { value: '1 panel', label: 'clientes, inmuebles, pagos y servicios' },
    { value: '+30%', label: 'menos retrasos con recordatorios automaticos' }
  ];

  protected readonly coreFeatures: readonly Feature[] = [
    {
      title: 'Registro completo de clientes',
      description: 'Centraliza fichas, documentos, historial de contratos y seguimiento de incidencias sin depender de hojas sueltas.'
    },
    {
      title: 'Alquileres y estados de unidad',
      description: 'Administra disponibilidad, contratos activos, renovaciones, montos pactados, garantias y fechas criticas desde una sola vista.'
    },
    {
      title: 'Pagos, mora y proximos vencimientos',
      description: 'Calcula cuotas, intereses, pagos parciales y proximos cobros para tomar decisiones antes de que aparezcan atrasos.'
    },
    {
      title: 'Servicios y notificaciones',
      description: 'Controla luz, agua y servicios comunes con alertas programadas para el equipo y para cada inquilino.'
    }
  ];

  protected readonly workflows: readonly Workflow[] = [
    {
      title: 'Cobros inteligentes',
      detail: 'Detecta proximos pagos, envia avisos y marca cuentas criticas antes del vencimiento.'
    },
    {
      title: 'Vista operativa del negocio',
      detail: 'Visualiza ingresos esperados, alquileres activos, pagos pendientes y contratos por renovar.'
    },
    {
      title: 'Seguimiento por inmueble',
      detail: 'Cada propiedad muestra ocupacion, historial de pagos, servicios y tareas administrativas.'
    }
  ];

  protected readonly notifications: readonly Notification[] = [
    {
      type: 'Pago de alquiler',
      message: 'Departamento 3B vence en 3 dias. Recordatorio enviado al cliente.',
      eta: 'Programado'
    },
    {
      type: 'Servicio de agua',
      message: 'Recibo pendiente del edificio central con fecha limite esta semana.',
      eta: 'Urgente'
    },
    {
      type: 'Renovacion',
      message: 'Contrato de local comercial termina el 30 de abril. Preparar propuesta.',
      eta: 'Seguimiento'
    }
  ];

  protected readonly timeline: readonly TimelineItem[] = [
    {
      step: '01',
      title: 'Registro y seguimiento',
      detail: 'Crea fichas de clientes, unidades y contratos sin depender de hojas de calculo.'
    },
    {
      step: '02',
      title: 'Calculo y control de pagos',
      detail: 'Monitorea alquileres, mora, pagos parciales y proximos vencimientos en un mismo flujo.'
    },
    {
      step: '03',
      title: 'Servicios y alertas',
      detail: 'Programa avisos para agua, luz y tareas operativas con contexto por inmueble.'
    }
  ];
}
