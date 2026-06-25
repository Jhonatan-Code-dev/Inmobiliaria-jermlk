import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import jsPDF from 'jspdf';

interface ModuleGuide {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly steps: readonly string[];
  readonly faq: readonly { readonly q: string; readonly a: string; }[];
  readonly tips: readonly string[];
}

@Component({
  selector: 'app-manual-usuario-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host { display: block; min-height: 100vh; background: #fafafa; }
    .hero-bg { background: linear-gradient(135deg, #1e1b4b, #312e81); }
    .active-tab { background-color: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    .dark .active-tab { background-color: rgba(22, 101, 52, 0.2); border-color: rgba(34, 197, 94, 0.4); color: #4ade80; }
  `],
  template: `
    <!-- Header/Hero -->
    <div class="hero-bg text-white py-10 px-6 md:px-12 text-center relative overflow-hidden">
      <div class="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <a [routerLink]="authService.isLoggedIn() ? '/menu/overview' : '/'" 
           class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200 hover:text-white transition-all bg-indigo-950/45 px-3.5 py-2 rounded-xl border border-indigo-800/40">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </a>
      </div>

      <div class="max-w-3xl mx-auto">
        <span class="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest">Soporte Técnico Legal</span>
        <h1 class="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">Manual del Usuario Inmobiliaria</h1>
        <p class="mt-3 text-sm text-indigo-200/90 max-w-xl mx-auto">
          Explore de forma interactiva el funcionamiento de los 12 módulos principales de nuestro sistema.
        </p>

        <!-- CTA Download -->
        <div class="mt-6 flex justify-center">
          <button (click)="generarPDF()"
             class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/25 hover:scale-102 transition-all text-sm">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar Manual en PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Left Sidebar (Module Tabs Selector) -->
      <div class="lg:col-span-4 space-y-3">
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3.5 px-1">Módulos del Sistema</h2>
          <nav class="space-y-1.5">
            <button *ngFor="let item of modules" 
                    (click)="selectModule(item.id)"
                    [class]="selectedId() === item.id ? 'active-tab' : 'text-gray-600 hover:bg-gray-50 border-transparent'"
                    class="w-full text-left px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-3 transition-all">
              <span class="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0 select-none">
                {{ item.id }}
              </span>
              <span class="truncate">{{ item.title }}</span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Right Panel (Detailed Guide Viewer) -->
      <div class="lg:col-span-8 space-y-6">
        <div class="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          
          <!-- Header detail -->
          <div class="border-b pb-4">
            <div class="flex items-center gap-3 mb-2">
              <span class="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                Módulo {{ activeModule().id }}
              </span>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">{{ activeModule().title }}</h2>
            <p class="mt-2 text-sm text-gray-500 leading-relaxed">{{ activeModule().description }}</p>
          </div>

          <!-- Pasos clave -->
          <div>
            <h3 class="text-xs font-extrabold text-indigo-600 uppercase tracking-wider mb-3">Paso a Paso Operativo</h3>
            <ol class="space-y-3.5">
              <li *ngFor="let step of activeModule().steps; let i = index" class="flex gap-3 text-xs leading-relaxed text-gray-600">
                <span class="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  {{ i + 1 }}
                </span>
                <span>{{ step }}</span>
              </li>
            </ol>
          </div>

          <!-- Consejos de Buenas Prácticas -->
          <div class="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 space-y-2">
            <h4 class="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Consejos & Buenas Prácticas
            </h4>
            <ul class="list-disc pl-4.5 space-y-1 text-xs text-indigo-900/80">
              <li *ngFor="let tip of activeModule().tips">{{ tip }}</li>
            </ul>
          </div>

          <!-- FAQ Módulo -->
          <div class="pt-4 border-t">
            <h3 class="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-4">Preguntas Frecuentes del Módulo</h3>
            <div class="space-y-4.5">
              <div *ngFor="let faq of activeModule().faq" class="space-y-1">
                <h5 class="text-xs font-bold text-gray-800 flex items-start gap-1">
                  <span class="text-indigo-600 font-extrabold">¿</span>
                  <span>{{ faq.q }}?</span>
                </h5>
                <p class="text-xs text-gray-500 pl-3 leading-relaxed">{{ faq.a }}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ManualUsuarioPageComponent {
  readonly authService = inject(AuthService);

  readonly selectedId = signal<string>('01');

  readonly modules: readonly ModuleGuide[] = [
    {
      id: '01',
      title: 'Módulo de Resumen (Dashboard)',
      icon: 'overview',
      description: 'El núcleo de visualización del sistema. Agrupa los indicadores de rendimiento clave, reportes financieros y estados de contratos del mes actual.',
      steps: [
        'Acceda al sistema ingresando sus credenciales autorizadas en la pantalla de inicio.',
        'Visualice el panel de Resumen para revisar los contadores principales: Inmuebles Libres, Contratos por Vencer y Caja Chica.',
        'Inspeccione el gráfico dinámico de "Balance Mensual" para comparar Ingresos (Cobros) versus Egresos (Gastos).',
        'Revise las Alertas Rápidas en el lado derecho para detectar atrasos en contratos o vencimientos de deudas.'
      ],
      tips: [
        'Consulte este panel al iniciar su jornada laboral para identificar prioridades inmediatas.',
        'Las alertas de contratos por vencer le permiten enviar pre-avisos de renovación con 30 días de anticipación.'
      ],
      faq: [
        {
          q: '¿Con qué frecuencia se actualizan los datos del balance financiero',
          a: 'Los indicadores del gráfico de balance financiero y resúmenes de caja se actualizan en tiempo real cada vez que registra un cobro, pago de deudas o gasto.'
        },
        {
          q: '¿Por qué no puedo visualizar los gráficos de facturación',
          a: 'Asegúrese de que su perfil de usuario tenga permisos de rol administrador. Los roles del staff estándar tienen visualización restringida en métricas de ganancias corporativas.'
        }
      ]
    },
    {
      id: '02',
      title: 'Inmuebles y Unidades',
      icon: 'inmuebles',
      description: 'Catálogo completo de propiedades de la inmobiliaria. Permite estructurar edificios o condominios en unidades independientes para alquilar.',
      steps: [
        'Vaya a la sección "Inmuebles" en el menú de navegación lateral.',
        'Haga clic en "Crear Inmueble" e ingrese los datos globales: Nombre del Edificio, Dirección, Ubicación y fotos de fachada.',
        'Dentro del Inmueble, añada "Unidades" (Ej. Dpto 101, Local B) indicando el precio base de alquiler, número de dormitorios, baños y medidores asociados.',
        'Cambie el estado de la unidad según corresponda: "Disponible" (para alquilar), "Alquilado" (contrato activo) o "Mantenimiento".'
      ],
      tips: [
        'Asocie los medidores de agua/luz a cada unidad durante su creación para facilitar el prorrateo automático posterior.',
        'Mantenga fotos actualizadas de cada unidad para mostrarlas en la ficha del cliente.'
      ],
      faq: [
        {
          q: '¿Se puede eliminar una unidad con un contrato activo',
          a: 'No. Por seguridad de base de datos, el sistema impide la eliminación de unidades que posean vínculos a contratos históricos o vigentes. Debe archivar el contrato primero.'
        },
        {
          q: '¿Cómo cambio una unidad a estado de Mantenimiento',
          a: 'Acceda a la edición de la unidad, despliegue el selector de Estado y seleccione Mantenimiento. Esto inhabilitará temporalmente la unidad para nuevos contratos.'
        }
      ]
    },
    {
      id: '03',
      title: 'Contratos y Alquileres',
      icon: 'alquileres',
      description: 'Gestión legal de arrendamientos. Vincula un inquilino a una propiedad definiendo plazos contractuales, montos fijos y términos del cobro.',
      steps: [
        'Vaya a "Contratos" en la navegación lateral del sistema.',
        'Presione "Nuevo Contrato" y seleccione el Cliente (arrendatario) y la Unidad disponible del inmueble.',
        'Configure la fecha de inicio, la duración en meses, y el día del mes límite de pago.',
        'Especifique el monto de renta mensual, las garantías entregadas y la tasa de mora diaria en caso de retraso.',
        'Guarde para activar el flujo de facturación automática mensual.'
      ],
      tips: [
        'Siempre registre el depósito de garantía en el campo correspondiente para facilitar la liquidación al finalizar el contrato.',
        'Configure el día límite de pago antes del 5 de cada mes para mantener una recaudación ordenada.'
      ],
      faq: [
        {
          q: '¿Cómo se maneja la renovación de un contrato vencido',
          a: 'El sistema permite hacer clic en el botón "Renovar" en la ficha del contrato vencido. Esto creará un anexo contractual manteniendo el historial anterior pero actualizando plazos y montos.'
        },
        {
          q: '¿Qué ocurre si un cliente se retira antes del plazo legal',
          a: 'Debe usar la opción "Finalizar Contrato" y registrar la penalidad aplicable en el campo de liquidación de garantía.'
        }
      ]
    },
    {
      id: '04',
      title: 'Directorio de Clientes',
      icon: 'clients',
      description: 'Centralización de información de inquilinos y codeudores (aval). Permite archivar datos de contacto y realizar búsquedas rápidas.',
      steps: [
        'Diríjase al módulo de "Clientes" en el panel.',
        'Presione "Registrar Cliente".',
        'Ingrese los datos: Nombres, Apellidos, Tipo de Documento (DNI/CE/RUC) y Número.',
        'Complete los campos de contacto esenciales: Teléfono celular principal y Correo electrónico (vital para el envío de recibos digitales).',
        'Opcionalmente, vincule el documento escaneado del perfil del cliente.'
      ],
      tips: [
        'Asegúrese de validar que el correo electrónico del cliente no tenga errores tipográficos, ya que aquí se enviarán las notificaciones de cobranza.',
        'Registre a los codeudores de los contratos también como clientes para vincularlos en las firmas.'
      ],
      faq: [
        {
          q: '¿Puedo registrar un cliente extranjero sin DNI',
          a: 'Sí. Seleccione en Tipo de Documento la opción "Carnet de Extranjería" o "Pasaporte" e ingrese el código alfanumérico correspondiente.'
        },
        {
          q: '¿Cómo busco un cliente por su número de documento',
          a: 'Utilice la barra de búsqueda rápida del módulo de Clientes ingresando los dígitos del documento; la tabla se filtrará automáticamente.'
        }
      ]
    },
    {
      id: '05',
      title: 'Emisión de Cobros y Pagos',
      icon: 'pagos',
      description: 'Módulo de caja. Registro y control de las rentas pagadas por los inquilinos y emisión de recibos digitales conformes.',
      steps: [
        'Vaya al módulo de "Cobros". El sistema mostrará la lista de recibos emitidos del mes y su estado (Pendiente, Pagado, Vencido).',
        'Busque el recibo del cliente utilizando el filtro de nombre o código de unidad.',
        'Haga clic en la acción "Registrar Pago".',
        'Seleccione el método de pago utilizado (Efectivo, Transferencia Bancaria, Pago con Tarjeta) y cargue el número de operación bancaria si aplica.',
        'Guarde el cobro. El sistema generará el recibo en formato PDF y ofrecerá enviarlo por correo al inquilino.'
      ],
      tips: [
        'Al registrar transferencias bancarias, siempre ingrese el número de operación para facilitar la conciliación bancaria mensual.',
        'Si el cliente paga fuera de fecha, el sistema calculará automáticamente la mora diaria configurada en el contrato.'
      ],
      faq: [
        {
          q: '¿Se pueden realizar pagos parciales de un recibo de renta',
          a: 'Sí. Al registrar el pago, puede modificar el importe abonado. El recibo quedará con estado "Pago Parcial" y la diferencia se mantendrá como deuda activa.'
        },
        {
          q: '¿Cómo anulo un cobro registrado por error',
          a: 'Busque el recibo cobrado, haga clic en "Detalle del Pago" y seleccione "Anular Operación". Esto revertirá el saldo de caja y pondrá el recibo nuevamente como Pendiente.'
        }
      ]
    },
    {
      id: '06',
      title: 'Cargos y Deudas Adicionales',
      icon: 'cargos',
      description: 'Asignación de conceptos de cobro adicionales independientes de la renta fija, tales como penalidades, multas o expensas extraordinarias.',
      steps: [
        'Acceda a la sección "Deudas/Cargos".',
        'Presione "Generar Cargo".',
        'Seleccione el Contrato o la Unidad a la que se aplicará el cobro.',
        'Defina el concepto (Ej. Penalidad por fiesta, Daños estructurales de áreas comunes).',
        'Ingrese el monto exacto y la fecha de vencimiento del pago.',
        'Haga clic en Guardar. El cargo se sumará al estado de cuenta del inquilino y se cobrará en el siguiente recibo de alquiler.'
      ],
      tips: [
        'Utilice este módulo para centralizar cobros por daños antes de descontar del depósito de garantía al finalizar el alquiler.',
        'Los cargos extras se visualizan de manera desglosada en el recibo PDF que se envía al cliente.'
      ],
      faq: [
        {
          q: '¿Puedo exonerar un cargo generado por error',
          a: 'Sí. Si el cargo está en estado Pendiente, puede hacer clic en "Eliminar" o "Condonar" para removerlo del estado de cuenta del cliente sin penalidades.'
        }
      ]
    },
    {
      id: '07',
      title: 'Mediciones de Servicios',
      icon: 'servicios',
      description: 'Control de consumo de servicios básicos (agua, luz, gas). Calcula montos variables en función de lecturas de medidores.',
      steps: [
        'Diríjase a "Mediciones" en el menú de navegación.',
        'Seleccione el Inmueble y el mes de facturación correspondiente.',
        'El sistema listará todas las unidades y sus medidores registrados.',
        'Ingrese la "Lectura Actual" de cada medidor. El sistema recuperará automáticamente la "Lectura Anterior".',
        'Presione "Procesar Mediciones". El sistema calculará el consumo neto (Lectura Actual - Lectura Anterior) multiplicado por el costo del kilowatt/metro cúbico configurado, generando el recibo de servicio.'
      ],
      tips: [
        'Realice la lectura física de medidores el mismo día del mes para mantener consistencia en la facturación.',
        'Verifique consumos inusualmente altos para alertar a los inquilinos sobre posibles fugas de agua.'
      ],
      faq: [
        {
          q: '¿Qué hago si un medidor fue cambiado o reseteado a cero',
          a: 'Debe ingresar a la ficha del medidor en la unidad, registrar el cambio físico y marcar la casilla "Reset de Lectura" para inicializar el contador desde cero.'
        }
      ]
    },
    {
      id: '08',
      title: 'Egresos y Gastos',
      icon: 'expenses',
      description: 'Control y auditoría de egresos. Registra costos operativos, pagos a proveedores, mantenimiento global de áreas comunes y compras de insumos.',
      steps: [
        'Vaya a "Gastos/Egresos" en el panel.',
        'Presione "Registrar Egreso".',
        'Ingrese el concepto del gasto, categoría (Ej. Impuestos, Reparaciones, Publicidad) e importe.',
        'Seleccione el Inmueble asociado (si el gasto es específico de una propiedad) o marque como Administrativo Global.',
        'Cargue el comprobante de pago digitalizado (boleta, factura) y la fecha de pago.',
        'Guarde para registrar la salida de dinero en el Balance General.'
      ],
      tips: [
        'Subcategorice los gastos detalladamente para obtener reportes de rentabilidad más precisos por cada edificio.',
        'Adjunte siempre el PDF de la factura del proveedor para simplificar las auditorías tributarias.'
      ],
      faq: [
        {
          q: '¿Puedo registrar un gasto programado a futuro (Cuentas por pagar)',
          a: 'Sí. Al registrar el egreso, configure el estado como "Pendiente" y asigne la fecha límite de pago. Aparecerá en las alertas de tesorería del administrador.'
        }
      ]
    },
    {
      id: '09',
      title: 'Horarios y Asistencias',
      icon: 'asistencia',
      description: 'Control de asistencia en tiempo real para asesores comerciales, administradores y personal de campo.',
      steps: [
        'Al ingresar al sistema, los empleados verán el widget de "Asistencia" en la cabecera.',
        'Para iniciar la jornada, presione "Marcar Entrada". El sistema registrará la hora exacta y guardará la geolocalización IP.',
        'Para salidas a refrigerio o fin de jornada laboral, presione "Marcar Salida".',
        'Revise su historial personal de marcaciones mensuales en la pestaña de historial.'
      ],
      tips: [
        'El sistema cuenta con un margen de tolerancia parametrizable (Ej. 10 minutos). Todo marcaje posterior se registrará automáticamente como Tardanza.',
        'Recuerde cerrar su jornada de trabajo antes de apagar su equipo para evitar marcaciones inconclusas.'
      ],
      faq: [
        {
          q: '¿Qué pasa si olvidé marcar mi entrada por la mañana',
          a: 'El sistema marcará la jornada como "Inasistencia" al finalizar el día. Deberá solicitar a su supervisor de RRHH una justificación manual de marcación.'
        }
      ]
    },
    {
      id: '10',
      title: 'Supervisión de RRHH',
      icon: 'supervision_asistencia',
      description: 'Consola administrativa de Recursos Humanos. Permite auditar tardanzas, inasistencias y autorizar justificaciones formales.',
      steps: [
        'Navegue a "RRHH Asistencia" en la barra lateral (acceso exclusivo administradores/jefes).',
        'Visualice el listado diario de personal con su estado: Presente, Tardanza, Inasistencia o Permiso.',
        'Para resolver una tardanza o falta, haga clic en el botón "Justificar" al lado del nombre del empleado.',
        'Seleccione el motivo de la justificación (Salud, Comisión de Servicio, Falla Técnica), ingrese los comentarios de descargo y guarde.',
        'Exportar el reporte consolidado mensual para el cálculo de planillas de sueldos.'
      ],
      tips: [
        'Audite las asistencias semanalmente para detectar patrones de impuntualidad reiterada en el staff.',
        'Use las justificaciones con adjuntos médicos para mantener el legajo laboral en regla.'
      ],
      faq: [
        {
          q: '¿Cómo configuro la tolerancia de tardanza global',
          a: 'Ingrese a Configuración del Sistema -> Parámetros de Personal, y ajuste el campo "Minutos de Tolerancia". Los cambios aplicarán para las marcaciones del día siguiente.'
        }
      ]
    },
    {
      id: '11',
      title: 'Cola de Trabajo y Tareas',
      icon: 'cola_trabajo',
      description: 'Organizador Kanban y lista de tareas operativas y comerciales del equipo. Permite asegurar que los pendientes se resuelvan a tiempo.',
      steps: [
        'Diríjase a "Cola de Trabajo" en el menú lateral.',
        'Visualice las columnas de estados de tareas: Pendiente, En Proceso, En Revisión y Completada.',
        'Haga clic en "Nueva Tarea" para crear una asignación comercial o técnica.',
        'Defina la prioridad (Baja, Media, Alta), el responsable del staff y la fecha de entrega.',
        'Los miembros asignados recibirán notificaciones en el sistema y podrán arrastrar las tareas entre columnas según avancen.'
      ],
      tips: [
        'Vincule las tareas de mantenimiento de la cola de trabajo directamente a los Tickets de Soporte creados por los inquilinos.',
        'Use descripciones detalladas y adjunte archivos adjuntos para guiar correctamente al técnico encargado.'
      ],
      faq: [
        {
          q: '¿Quién puede reasignar una tarea de la cola de trabajo',
          a: 'Tanto el creador original de la tarea como cualquier usuario con privilegios de Administrador pueden cambiar al responsable asignado.'
        }
      ]
    },
    {
      id: '12',
      title: 'Libro de Reclamaciones',
      icon: 'reclamaciones',
      description: 'Canal oficial para canalizar reclamos y quejas en cumplimiento legal del INDECOPI. Permite capturar e ingresar respuestas formales.',
      steps: [
        'El cliente o usuario ingresa mediante la ruta pública `/libro-reclamaciones` o mediante el botón interno "Registrar Reclamación Interna" en el dashboard.',
        'El sistema solicita datos de contacto, identificación del bien, tipo de incidencia (Reclamo o Queja) y el pedido concreto.',
        'Al guardar, se genera el código único correlativo (Ej: `REC-2026-00010`) y se autodescarga la hoja de reclamación oficial en formato PDF.',
        'El administrador revisa el reclamo en el panel de Reclamaciones, ingresa el descargo oficial y presiona "Registrar Respuesta Legal".',
        'El estado cambia a RESUELTO y se genera el PDF consolidado con los descargos de la inmobiliaria.'
      ],
      tips: [
        'La ley de INDECOPI exige un plazo máximo de 15 días hábiles para responder a las reclamaciones; revise este módulo a diario.',
        'El descargo debe redactarse de forma clara, profesional y objetiva, puesto que es vinculante legalmente.'
      ],
      faq: [
        {
          q: '¿Cuál es la diferencia entre Reclamo y Queja en el sistema',
          a: 'Un Reclamo se genera ante la disconformidad directa con el servicio de alquiler prestado. Una Queja expresa malestar respecto a la atención recibida por parte del staff.'
        },
        {
          q: '¿Se pueden eliminar reclamos guardados',
          a: 'Sí, pero se recomienda conservar los registros históricos completos a fin de acreditar un correcto libro de incidencias ante inspecciones regulatorias.'
        }
      ]
    }
  ];

  activeModule(): ModuleGuide {
    return this.modules.find(m => m.id === this.selectedId()) || this.modules[0];
  }

  selectModule(id: string): void {
    this.selectedId.set(id);
  }

  /** Normalize text for jsPDF standard (Latin-1) fonts: strip diacritics and replace special chars */
  private n(s: string): string {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritics (a\u0301 -> a)
      .replace(/\u00f1/g, 'n').replace(/\u00d1/g, 'N')  // n with tilde
      .replace(/[\u00b7\u2022]/g, '-')   // middle dot, bullet
      .replace(/[\u2014\u2013]/g, '-')   // em dash, en dash
      .replace(/\u00bf/g, '?')           // inverted question mark
      .replace(/\u00a1/g, '!');          // inverted exclamation
  }

  generarPDF(): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentW = pageW - margin * 2;
    let y = margin;

    const addPage = () => { doc.addPage(); y = margin; };
    const checkPage = (needed: number) => { if (y + needed > pageH - margin) addPage(); };

    // ===== PORTADA =====
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.setFillColor(67, 56, 202);
    doc.rect(0, 0, pageW, 8, 'F');
    doc.rect(0, pageH - 8, pageW, 8, 'F');

    doc.setFillColor(67, 56, 202);
    doc.circle(pageW / 2, pageH / 2 - 90, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.text('I', pageW / 2, pageH / 2 - 82, { align: 'center' });

    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Inmobiliaria', pageW / 2, pageH / 2 - 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(165, 180, 252);
    doc.text('Manual del Usuario', pageW / 2, pageH / 2 + 12, { align: 'center' });

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.line(pageW / 2 - 40, pageH / 2 + 30, pageW / 2 + 40, pageH / 2 + 30);

    const fecha = this.n(new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }));
    doc.setFontSize(9);
    doc.setTextColor(129, 140, 248);
    doc.text(`Version 2026  -  12 Modulos  -  ${fecha}`, pageW / 2, pageH / 2 + 52, { align: 'center' });

    doc.setFillColor(55, 48, 163);
    doc.roundedRect(pageW / 2 - 100, pageH / 2 + 66, 200, 22, 11, 11, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(199, 210, 254);
    doc.text('SISTEMA DE GESTION INMOBILIARIA', pageW / 2, pageH / 2 + 81, { align: 'center' });

    // ===== INDICE =====
    addPage();
    doc.setFillColor(238, 242, 255);
    doc.rect(0, 0, pageW, 70, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 27, 75);
    doc.text('Indice de Modulos', margin, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241);
    doc.text('Guia completa de uso del sistema Inmobiliaria', margin, 57);

    y = 90;
    this.modules.forEach((mod, i) => {
      checkPage(28);
      if (i % 2 === 0) {
        doc.setFillColor(248, 249, 255);
        doc.rect(margin - 8, y - 14, contentW + 16, 24, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(67, 56, 202);
      doc.text(`${mod.id}.`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(this.n(mod.title), margin + 28, y);
      y += 24;
    });

    // ===== MODULOS =====
    for (const mod of this.modules) {
      addPage();

      doc.setFillColor(238, 242, 255);
      doc.rect(0, 0, pageW, 90, 'F');
      doc.setFillColor(67, 56, 202);
      doc.rect(0, 0, 5, 90, 'F');

      doc.setFillColor(67, 56, 202);
      doc.roundedRect(margin, 16, 80, 16, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`MODULO ${mod.id}`, margin + 40, 27, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 27, 75);
      const titleLines = doc.splitTextToSize(this.n(mod.title), contentW) as string[];
      doc.text(titleLines, margin, 54);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      const descLines = doc.splitTextToSize(this.n(mod.description), contentW) as string[];
      doc.text(descLines, margin, 76);

      y = 108;

      // --- PASOS ---
      doc.setFillColor(238, 242, 255);
      doc.rect(margin - 8, y - 12, contentW + 16, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(67, 56, 202);
      doc.text('PASO A PASO OPERATIVO', margin, y);
      y += 18;

      mod.steps.forEach((step, i) => {
        const stepLines = doc.splitTextToSize(this.n(step), contentW - 26) as string[];
        const stepH = stepLines.length * 13 + 10;
        checkPage(stepH);

        doc.setFillColor(238, 242, 255);
        doc.circle(margin + 8, y - 4, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(67, 56, 202);
        doc.text(String(i + 1), margin + 8, y - 1, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(stepLines, margin + 22, y);
        y += stepH;
      });

      y += 8;

      // --- TIPS ---
      checkPage(30);
      doc.setFillColor(236, 253, 245);
      doc.rect(margin - 8, y - 12, contentW + 16, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(5, 150, 105);
      doc.text('CONSEJOS Y BUENAS PRACTICAS', margin, y);
      y += 18;

      mod.tips.forEach(tip => {
        const tipLines = doc.splitTextToSize(this.n(tip), contentW - 16) as string[];
        const tipH = tipLines.length * 13 + 7;
        checkPage(tipH);
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105);
        doc.text('*', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(6, 78, 59);
        doc.text(tipLines, margin + 14, y);
        y += tipH;
      });

      y += 8;

      // --- FAQs ---
      checkPage(30);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin - 8, y - 12, contentW + 16, 18, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.text('PREGUNTAS FRECUENTES', margin, y);
      y += 18;

      mod.faq.forEach(faq => {
        const qLines = doc.splitTextToSize(`?${this.n(faq.q)}?`, contentW) as string[];
        const aLines = doc.splitTextToSize(this.n(faq.a), contentW - 8) as string[];
        const blockH = qLines.length * 13 + aLines.length * 12 + 20;
        checkPage(blockH);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin - 6, y - 12, contentW + 12, blockH - 4, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(qLines, margin, y);
        y += qLines.length * 13 + 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(aLines, margin + 4, y);
        y += aLines.length * 12 + 16;
      });
    }

    // ===== NUMERACION DE PAGINAS =====
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      if (p === 1) continue;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Inmobiliaria - Manual del Usuario', margin, pageH - 20);
      doc.text(`Pag. ${p - 1} / ${totalPages - 1}`, pageW - margin, pageH - 20, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageH - 28, pageW - margin, pageH - 28);
    }

    doc.save('Manual_Usuario_Inmobiliaria.pdf');
  }
}
