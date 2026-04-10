# Especificaciones Técnicas de Backend: Alquilamax

Este documento define los requisitos técnicos para la implementación de los servicios faltantes. El backend debe seguir estas directrices para asegurar la compatibilidad con el frontend y la integridad de los datos.

---

## Estándares Globales de API
1. **Autenticación**: Todos los endpoints (excepto Login) deben requerir `Authorization: Bearer <token>`.
2. **Validación Multi-tenancy**: El backend DEBE validar que el `empresa_id` de los recursos coincida con el `empresa_id` codificado en el token del usuario.
3. **Paginación**: Todos los listados (`GET`) deben incluir:
   - Parámetros: `pag` (página actual) y `por_página` (default 10).
   - Respuesta: Objeto `paginacion` con `total`, `paginas`, `pagina_actual` y `por_pagina`.
4. **Respuesta de Error**: Siempre devolver `{ "message": "Descripción del error" }` con el código HTTP correspondiente (400, 401, 403, 500).

---

## 1. Módulo de Alquileres (Contratos)
**Objetivo:** Gestionar la relación legal entre un inquilino y un inmueble.

### Endpoints Detallados

#### `GET /api/user/alquileres`
- **Query Params**: `buscar`, `estado` (activo/vencido/finalizado), `unidad_id`, `pag`.
- **Respuesta Esperada**:
```json
{
  "datos": [
    { "id": 1, "cliente": "Nombre Inquilino", "unidad": "A-101", "monto": 1200.50, "fecha_inicio": "2026-01-01", "estado": "activo" }
  ],
  "paginacion": { "total": 45, "paginas": 5, "pagina": 1 }
}
```

#### `POST /api/user/alquileres` (Creación de Contrato)
- **Cuerpo (JSON)**:
```json
{
  "cliente_id": "integer (required)",
  "unidad_id": "integer (required)",
  "fecha_inicio": "date (ISO 8601)",
  "fecha_fin": "date (ISO 8601)",
  "vencimiento_dia_pago": "integer (1-31)",
  "monto_renta": "decimal (10,2)",
  "deposito_garantia": "decimal (10,2)",
  "moneda": "string (PEN/USD)"
}
```
- **Lógica de Negocio**: Debe validar que la unidad esté `disponible` antes de crear. Al crear, cambiar estado de la unidad a `ocupada`.

---

## 2. Módulo de Pagos y Tesorería
**Objetivo:** Controlar el flujo de caja proveniente de los alquileres.

#### `POST /api/user/pagos` (Registro de Cobro)
- **Cuerpo (JSON)**:
```json
{
  "alquiler_id": "integer (required)",
  "monto_pagado": "decimal (10,2)",
  "fecha_pago": "date",
  "metodo_pago": "string (transferencia, efectivo, tarjeta)",
  "nota": "string (optional)",
  "mes_correspondiente": "integer (1-12)"
}
```

#### `GET /api/user/pagos/pendientes`
- Debe retornar una lista de contratos que NO tengan un pago registrado para el mes actual, permitiendo al frontend mostrar alertas de morosidad.

---

## 3. Protocolo de Pruebas y Calidad (Instrucciones para Backend)

El desarrollador backend debe certificar que cada endpoint cumple con los siguientes tests antes de la entrega:

1. **Test de Integridad**: Intentar crear un alquiler con un `cliente_id` que no pertenece a la empresa del usuario (debe retornar 403 Forbidden).
2. **Test de Paginación**: Verificar que al pedir la página 2 con límite de 5 registros, los datos no se dupliquen ni falten.
3. **Test de Búsqueda**: El parámetro `buscar` debe realizar un `LIKE %search%` en campos de nombre de cliente y código de unidad.
4. **Pruebas de Concurrencia**: Asegurar que dos contratos no puedan ocupar la misma unidad al mismo tiempo (bloqueo a nivel de base de datos o lógica de servicio).
5. **Validación de Tipos**: Enviar valores nulos en campos obligatorios y verificar que las respuestas de error sean claras y no colapsen el servidor (Error 500 es inaceptable).

---

## 4. Estado del Módulo "Inmuebles" (Checklist Final)
A día de hoy, el frontend ya consume `GET`, `POST`, `PUT` y `DELETE` de inmuebles y unidades. El backend debe verificar que:
- El borrado de un inmueble sea en cascada (borrar unidades asociadas) o bloqueado si tiene unidades ocupadas.
- La suma de `total_unidades` en la tabla de inmuebles coincida con los registros reales de la tabla unidades.
