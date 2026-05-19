# Inmobiliaria - Sistema de Gestión Inmobiliaria

Inmobiliaria es una plataforma web desarrollada para la administración y gestión integral de propiedades residenciales y comerciales. El sistema facilita la relación entre propietarios, inquilinos y personal administrativo, centralizando las operaciones de cobro, mantenimiento, control de asistencia y generación de reportes financieros.

## Tabla de Contenidos
1. Tecnologías Utilizadas
2. Arquitectura del Proyecto
3. Módulos del Sistema
4. Configuración del Entorno de Desarrollo
5. Compilación y Pruebas
6. Despliegue en Producción

---

## 1. Tecnologías Utilizadas

El proyecto está construido bajo estándares modernos de desarrollo web utilizando el siguiente conjunto de tecnologías:

* **Framework Principal:** Angular v21.2.0 (con soporte para componentes Standalone y arquitectura reactiva basada en Signals).
* **Estilos y Diseño:** Tailwind CSS v4 para el diseño adaptable, modular y de alto rendimiento.
* **Componentes de Gráficos:** ApexCharts y ng-apexcharts para la visualización de datos estadísticos.
* **Manejador de Entorno:** @ngx-env/builder para la inyección dinámica de variables de entorno en tiempo de compilación, Zod para la validación de esquemas y dotenv para la lectura local.
* **Pruebas Unitarias:** Vitest como framework de ejecución de pruebas de alta velocidad en sustitución de Karma/Jasmine.
* **Plataforma de Despliegue y Servidor:** Wrangler (Cloudflare Pages/Workers) como plataforma de alojamiento estático y serverless.

---

## 2. Arquitectura del Proyecto

El código fuente sigue una estructura limpia, separando las responsabilidades de definición de datos, componentes de presentación, vistas globales y servicios de negocio:

* **src/app/core/**
  * **config/**: Constantes globales del sistema y resolución de variables de entorno (como la URL base de la API).
  * **http/**: Interceptores de autenticación, constructores de URLs de API y utilidades para el manejo global de errores de red.
  * **layout/**: Definición de navegación del panel de control (sidebar) y elementos estructurales del shell del sistema.
  * **routing/**: Parámetros de rutas, constantes de segmentos de URLs y guardianes de ruta (Guards) para restringir el acceso a usuarios autenticados o redirigir a usuarios anónimos.
  * **theme/**: Administración del tema visual del sistema (soporte para Modo Claro y Modo Oscuro).
* **src/app/services/**: Capa de servicios que encapsula las peticiones HTTP hacia el backend para cada entidad del sistema (Alquileres, Clientes, Inmuebles, Asistencias, etc.).
* **src/app/components/**: Componentes de interfaz de usuario específicos para cada sección. Contienen formularios, tablas de datos, modales de edición y la lógica interactiva interna.
* **src/app/pages/**: Componentes contenedores de página de Angular que se vinculan directamente al enrutador. Actúan como contenedores principales cargando las secciones correspondientes según el estado de la navegación.

---

## 3. Módulos del Sistema

El sistema está dividido en catorce módulos operativos principales:

1. **Resumen (Overview):** Muestra el panel de control general del negocio con indicadores clave (KPIs), gráficos estadísticos y métricas resumidas sobre inmuebles arrendados, alertas de contratos por vencer, tickets de mantenimiento activos y flujos financieros básicos de ingresos y egresos.
2. **Inmuebles (Properties):** Administra el catálogo de propiedades de la inmobiliaria. Permite registrar nuevos bienes inmuebles, definir sus detalles físicos, establecer las tarifas base de arrendamiento y controlar sus estados de disponibilidad (disponible, alquilado, mantenimiento).
3. **Contratos (Leases):** Gestiona los convenios contractuales de alquiler. Permite la asociación de inquilinos con inmuebles específicos, define la vigencia temporal del contrato, el canon mensual pactado, las condiciones de renovación y controla la vigencia legal del acuerdo.
4. **Cobros (Payments):** Controla el ingreso de flujos de dinero correspondientes a las rentas mensuales. Permite realizar el registro detallado de los pagos ejecutados por los inquilinos, generar comprobantes digitales de pago y verificar el histórico transaccional.
5. **Deudas/Cargos (Debts/Charges):** Permite imputar cargos extraordinarios, multas por retrasos o deudas acumuladas a cuentas específicas de inquilinos para asegurar el control de la cartera vencida y los cobros pendientes de regularización.
6. **Mediciones (Meter Readings):** Módulo encargado del registro de lecturas de consumo de servicios básicos (agua, electricidad, gas) asignados a cada unidad de vivienda o local comercial para prorratear adecuadamente los costos en función del consumo real.
7. **Egresos (Expenses):** Administra los costos de operación de la inmobiliaria. Registra pagos a proveedores externos, compra de materiales de reparación, impuestos prediales y liquidaciones de servicios generales de áreas comunes.
8. **Clientes (Clients):** Centraliza la información de contacto, antecedentes de renta y perfiles de inquilinos, coarrendatarios y fiadores. Funciona como un CRM básico inmobiliario.
9. **Mantenimiento (Maintenance Tickets):** Sistema de gestión de incidencias y órdenes de reparación. Permite el reporte de daños, la asignación automática o manual a técnicos y el seguimiento de los estados de resolución.
10. **Cola de Trabajo (Work Queue):** Organizador interno de actividades pendientes y flujos de ejecución para el equipo administrativo y de mantenimiento, optimizando el despacho de solicitudes y tareas operativas de forma ordenada.
11. **Config Staff (Staff Management):** Permite administrar las cuentas del personal interno de la empresa, gestionar sus perfiles de usuario, roles de seguridad y niveles de permisos.
12. **Asistencia (Attendance Tracking):** Interfaz para que los empleados registren sus jornadas laborales (ingreso y salida diarios), facilitando la captura automática de horarios y ubicaciones de marcado.
13. **RRHH Asistencia (Attendance Supervision):** Herramienta gerencial de recursos humanos que permite a los supervisores visualizar registros consolidados de asistencia, justificar tardanzas, validar ausencias y verificar reportes consolidados del personal.
14. **Reportes (Analytics & Reports):** Módulo de inteligencia de negocios que consolida los reportes financieros anuales, mensuales e históricos, permitiendo evaluar la rentabilidad neta mediante gráficos interactivos de ingresos versus egresos.

---

## 4. Configuración del Entorno de Desarrollo

### Requisitos Previos
* Node.js (versión 18 o superior recomendada)
* npm (versión 9 o superior recomendada)

### Paso 1: Instalación de dependencias
Ejecute el siguiente comando en la raíz del proyecto para descargar e instalar todas las dependencias necesarias:
```bash
npm install
```
*Nota: Al finalizar la instalación, de manera automática se ejecutará el script de post-instalación para sincronizar el entorno.*

### Paso 2: Configuración de variables de entorno
Cree un archivo llamado `.env` en el directorio raíz del proyecto. Este archivo debe definir la URL base de la interfaz de programación (API) del backend:
```env
NG_APP_BACKEND_URL=http://localhost:5000/api
```
El script automatizado `scripts/sync-env.mjs` validará que esta variable esté declarada y tenga un formato de URL válido. Además, este script generará dinámicamente el archivo `proxy.conf.json` requerido por el servidor de desarrollo local para canalizar las llamadas del prefijo `/api` hacia el backend configurado.

### Paso 3: Iniciar el servidor de desarrollo
Para iniciar la ejecución del servidor de pruebas en su máquina local, ejecute:
```bash
npm run dev
```
Esto levantará la aplicación en el puerto predeterminado (usualmente `http://localhost:4200/`) y aplicará recargas automática ante cualquier cambio detectado en los archivos fuente.

---

## 5. Compilación y Pruebas

### Compilación para producción
Para generar la versión optimizada y lista para producción de la aplicación, ejecute:
```bash
npm run build
```
Este comando sincronizará las variables de entorno, compilará los módulos de TypeScript y exportará los archivos resultantes en el directorio `dist/alquilamax-jermlk/browser` (correspondiente al nombre interno de salida del compilador).

### Visualización previa local (Preview)
Si desea simular el comportamiento de producción en un servidor local ligero administrado por Wrangler antes de publicar, ejecute:
```bash
npm run preview
```

### Ejecutar Pruebas Unitarias
El proyecto utiliza Vitest para garantizar la calidad del código. Ejecute las pruebas mediante el comando:
```bash
npm run test
```

---

## 6. Despliegue en Producción

La aplicación está diseñada para ejecutarse y distribuirse a través de la red global de Cloudflare Pages o Workers mediante la herramienta Wrangler.

### Paso 1: Autenticación en Cloudflare
Si es la primera vez que realiza un despliegue desde su terminal, autentíquese con su cuenta corporativa o personal ejecutando:
```bash
npx wrangler login
```

### Paso 2: Revisión de parámetros en wrangler.jsonc
El archivo `wrangler.jsonc` contiene la configuración básica del sitio estático. Asegúrese de verificar la URL del servidor de backend de producción asociada a la variable de entorno de producción:
```json
"vars": {
  "NG_APP_BACKEND_URL": "https://alquila.duckdns.org/api"
}
```

### Paso 3: Ejecutar el despliegue
Ejecute la tarea integrada en `package.json` para realizar la compilación limpia y subir los recursos estáticos compilados a los servidores Cloudflare:
```bash
npm run deploy
```
El comando procesará el build de Angular bajo configuración de producción y utilizará Wrangler para cargar los archivos ubicados en el directorio `dist/alquilamax-jermlk/browser`, entregando al finalizar una dirección URL pública y segura para acceder a la plataforma.
