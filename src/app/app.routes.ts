import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel principal · Talenta RH',
        data: { title: 'Panel principal' },
        loadComponent: () => import('./pages/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'competencias',
        title: 'Competencias · Talenta RH',
        data: { title: 'Competencias' },
        loadComponent: () => import('./pages/competencias').then((m) => m.CompetenciasPage),
      },
      {
        path: 'idiomas',
        title: 'Idiomas · Talenta RH',
        data: { title: 'Idiomas' },
        loadComponent: () => import('./pages/idiomas').then((m) => m.IdiomasPage),
      },
      {
        path: 'capacitaciones',
        title: 'Capacitaciones · Talenta RH',
        data: { title: 'Capacitaciones' },
        loadComponent: () => import('./pages/capacitaciones').then((m) => m.CapacitacionesPage),
      },
      {
        path: 'puestos',
        title: 'Puestos · Talenta RH',
        data: { title: 'Puestos' },
        loadComponent: () => import('./pages/puestos').then((m) => m.PuestosPage),
      },
      {
        path: 'candidatos',
        title: 'Candidatos · Talenta RH',
        data: { title: 'Candidatos' },
        loadComponent: () => import('./pages/candidatos').then((m) => m.CandidatosPage),
      },
      {
        path: 'experiencia',
        title: 'Experiencia laboral · Talenta RH',
        data: { title: 'Experiencia laboral' },
        loadComponent: () => import('./pages/experiencia').then((m) => m.ExperienciaPage),
      },
      {
        path: 'seleccion',
        title: 'Proceso de selección · Talenta RH',
        data: { title: 'Proceso de selección' },
        loadComponent: () => import('./pages/seleccion').then((m) => m.SeleccionPage),
      },
      {
        path: 'empleados',
        title: 'Empleados · Talenta RH',
        data: { title: 'Empleados' },
        loadComponent: () => import('./pages/empleados').then((m) => m.EmpleadosPage),
      },
      {
        path: 'consultas',
        title: 'Consulta por criterios · Talenta RH',
        data: { title: 'Consulta por criterios' },
        loadComponent: () => import('./pages/consultas').then((m) => m.ConsultasPage),
      },
      {
        path: 'reporte',
        title: 'Reporte de nuevo ingreso · Talenta RH',
        data: { title: 'Reporte de nuevo ingreso' },
        loadComponent: () => import('./pages/reporte').then((m) => m.ReportePage),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
