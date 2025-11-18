# Dashboard IETQ

Sistema de gestión y análisis de membresía eclesiástica con métricas en tiempo real.

## Tecnologías

Este proyecto está construido con:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Instalación

```sh
# Instalar dependencias
npm i

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Características

- Dashboard con métricas en tiempo real
- Gestión de miembros y ministerios
- Análisis de asistencia y participación
- Búsqueda y filtrado avanzado con paginación
- Visualización de datos con gráficos

## Página oficial de asistencia (`/asistencia`)

La ruta `/asistencia` centraliza el registro diario de hermanos y visitas. Entre sus características destacan:

- Detección automática del culto correcto según la zona horaria `America/Santiago` y la regla definida por la directiva.
- Listado alfabético solo con miembros activos, buscador instantáneo y selección masiva con checkboxes amplios.
- Guardado tipo *upsert* en Supabase (`rut + fecha_culto`) para impedir duplicados y registrar IP + navegador.
- Edición directa de la frecuencia declarada, historial por persona, contador de presentes y notificaciones *toast*.
- Botones persistentes para “Guardar asistencia”, “Agregar visita” y exportación CSV de los últimos 60 días.
- Alertas automáticas basadas en la vista `faltas_consecutivas` para detectar ausencias críticas.

### Seguridad

- El acceso está restringido a usuarios con el rol `admin` en Supabase (`app_metadata.roles` o `user_metadata.role`).
- Para entornos locales se puede habilitar una excepción configurando `VITE_BYPASS_ADMIN=true`.
- Los RUT nunca se incluyen en rutas ni parámetros y las respuestas de error están controladas para evitar fugas de datos sensibles.

### Integración con n8n y análisis avanzado

En `supabase/views.sql` se incluyen las vistas:

1. `asistencias_por_persona`
2. `asistencias_ultimos_60_dias`
3. `asistencias_mensuales`
4. `faltas_consecutivas`

Estas vistas pueden ser consumidas directamente mediante la API REST de Supabase o por n8n para automatizar reportes, alertas de faltas y paneles históricos.
