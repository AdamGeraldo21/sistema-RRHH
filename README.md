# Talenta RH · Sistema de Reclutamiento y Selección

Proyecto final de la asignatura de RH (Universidad APEC).

- **Frontend:** PWA en **Angular 22**, desplegada en Vercel.
- **Backend:** API REST en **Node.js (Express)** en la carpeta [`server/`](server/), desplegada en Render.
- **Base de datos:** **PostgreSQL** en Render. Las tablas y los datos de demostración se crean solos la primera vez que arranca la API.

```
Navegador (Angular, Vercel) ──HTTPS + JWT──▶ API Express (Render) ──▶ PostgreSQL (Render)
```

## Acceso

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@talenta.do | admin123 |
| Reclutador | reclutador@talenta.do | demo123 |

También se puede crear una cuenta desde **Crear cuenta** (rol Reclutador), y un administrador puede crear usuarios con cualquier rol en **Administración → Usuarios**. Las contraseñas se guardan cifradas con bcrypt y la sesión usa tokens JWT.

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
| Usuarios | Gestión de cuentas y roles (solo administradores) |

## Base de datos

El esquema está en [`server/src/schema.sql`](server/src/schema.sql): tablas `usuarios`, `competencias`, `idiomas`, `capacitaciones`, `puestos`, `candidatos` (con las tablas puente `candidato_competencias`, `candidato_capacitaciones` y `candidato_idiomas`), `experiencias` y `empleados`, con llaves foráneas y restricciones `CHECK`.

## Desarrollo local

```bash
# API
cd server
cp .env.example .env      # pon tu DATABASE_URL
npm install
npm run dev               # http://localhost:3000/api

# Frontend (en otra terminal, desde la raíz)
npm install
npm start                 # http://localhost:4200
```

`npm run db:reset` (en `server/`) vuelve a cargar los datos de RH de demostración sin tocar los usuarios.

## Despliegue

1. **Base de datos:** PostgreSQL en Render.
2. **API:** Render → *New → Blueprint* con este repositorio (usa [`render.yaml`](render.yaml)). Pega la *Internal Database URL* en `DATABASE_URL` y usa la misma región que la base de datos.
3. **Frontend:** Vercel despliega solo con cada push a `main`. La URL de la API de producción está en [`src/environments/environment.prod.ts`](src/environments/environment.prod.ts).
