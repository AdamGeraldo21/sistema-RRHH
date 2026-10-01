# Talenta RH · Sistema de Reclutamiento y Selección

PWA desarrollada en **Angular 22** para el proyecto final de la asignatura de RH (Universidad APEC).
Usa datos simulados (mock) que se guardan en el `localStorage` del navegador, así que se puede agregar, editar y eliminar información sin backend.

## Acceso

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@talenta.do | admin123 |
| Reclutador | reclutador@talenta.do | demo123 |

También puedes crear una cuenta desde **Crear cuenta** en la pantalla de inicio (rol Reclutador), o un administrador puede crear usuarios con cualquier rol en **Administración → Usuarios**. Las sesiones y cuentas se guardan en el navegador (demo sin backend; las contraseñas se almacenan como hash SHA-256).

## Módulos

| Módulo | Qué permite |
|---|---|
| Panel principal | KPIs, ingresos por mes, embudo de selección, empleados por departamento |
| Competencias | CRUD (descripción, tipo, estado) |
| Idiomas | CRUD (nombre, estado) |
| Capacitaciones | CRUD (descripción, nivel, fechas desde/hasta, institución) |
| Puestos | CRUD (nombre, nivel de riesgo, salario mínimo/máximo, estado) |
| Candidatos | CRUD con cédula validada, puesto, departamento, salario, competencias, capacitaciones, idiomas, experiencia laboral y recomendado por |
| Experiencia laboral | CRUD (empresa, puesto ocupado, fechas, salario) |
| Proceso de selección | Tablero kanban (arrastrar y soltar) que **convierte al candidato en empleado** |
| Empleados | CRUD (cédula, nombre, fecha de ingreso, departamento, puesto, salario, estado) |
| Consulta por criterios | Candidatos por puesto, competencias, capacitaciones, idiomas, etapa, salario… y exportación a CSV |
| Reporte de nuevo ingreso | Empleados por rango de fechas, totales, gráfico mensual, impresión/PDF y CSV |

## Desarrollo

```bash
npm install
npm start        # http://localhost:4200
npm run build    # dist/syshhrr/browser (incluye service worker)
```

Para volver a los datos iniciales, usa **Restaurar datos** en la barra lateral.
