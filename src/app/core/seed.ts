import { Candidato, Capacitacion, Competencia, Empleado, Experiencia, Idioma, Puesto } from './models';
import { makeCedula } from './util';

export const SEED_COMPETENCIAS: Competencia[] = [
  { id: 1, descripcion: 'Trabajo en equipo', tipo: 'Organizacional', estado: 'Activo' },
  { id: 2, descripcion: 'Liderazgo de equipos', tipo: 'Gerencial', estado: 'Activo' },
  { id: 3, descripcion: 'Comunicación efectiva', tipo: 'Organizacional', estado: 'Activo' },
  { id: 4, descripcion: 'Angular / TypeScript', tipo: 'Técnica', estado: 'Activo' },
  { id: 5, descripcion: 'Node.js y APIs REST', tipo: 'Técnica', estado: 'Activo' },
  { id: 6, descripcion: 'SQL y modelado de datos', tipo: 'Técnica', estado: 'Activo' },
  { id: 7, descripcion: 'Análisis financiero', tipo: 'Técnica', estado: 'Activo' },
  { id: 8, descripcion: 'Negociación', tipo: 'Gerencial', estado: 'Activo' },
  { id: 9, descripcion: 'Operación de montacargas', tipo: 'Operativa', estado: 'Activo' },
  { id: 10, descripcion: 'Atención al cliente', tipo: 'Operativa', estado: 'Activo' },
  { id: 11, descripcion: 'Pensamiento crítico', tipo: 'Organizacional', estado: 'Activo' },
  { id: 12, descripcion: 'Power BI', tipo: 'Técnica', estado: 'Activo' },
  { id: 13, descripcion: 'Normas NIIF', tipo: 'Técnica', estado: 'Activo' },
  { id: 14, descripcion: 'Gestión del tiempo', tipo: 'Organizacional', estado: 'Activo' },
  { id: 15, descripcion: 'Seguridad industrial', tipo: 'Operativa', estado: 'Inactivo' },
];

export const SEED_IDIOMAS: Idioma[] = [
  { id: 1, nombre: 'Español', estado: 'Activo' },
  { id: 2, nombre: 'Inglés', estado: 'Activo' },
  { id: 3, nombre: 'Francés', estado: 'Activo' },
  { id: 4, nombre: 'Portugués', estado: 'Activo' },
  { id: 5, nombre: 'Italiano', estado: 'Activo' },
  { id: 6, nombre: 'Alemán', estado: 'Inactivo' },
  { id: 7, nombre: 'Mandarín', estado: 'Inactivo' },
];

export const SEED_CAPACITACIONES: Capacitacion[] = [
  { id: 1, descripcion: 'Ingeniería de Software', nivel: 'Grado', fechaDesde: '2014-09-01', fechaHasta: '2019-07-15', institucion: 'Universidad APEC' },
  { id: 2, descripcion: 'Maestría en Ciencia de Datos', nivel: 'Maestría', fechaDesde: '2021-01-10', fechaHasta: '2022-12-15', institucion: 'PUCMM' },
  { id: 3, descripcion: 'Licenciatura en Contabilidad', nivel: 'Grado', fechaDesde: '2012-08-01', fechaHasta: '2016-06-30', institucion: 'UASD' },
  { id: 4, descripcion: 'Diplomado en Normas NIIF', nivel: 'Gestión', fechaDesde: '2023-03-01', fechaHasta: '2023-06-30', institucion: 'INTEC' },
  { id: 5, descripcion: 'Técnico en Redes (CCNA)', nivel: 'Técnico', fechaDesde: '2020-02-01', fechaHasta: '2020-08-30', institucion: 'ITLA' },
  { id: 6, descripcion: 'Especialidad en Gestión Humana', nivel: 'Post-grado', fechaDesde: '2019-01-15', fechaHasta: '2019-12-15', institucion: 'UNIBE' },
  { id: 7, descripcion: 'Licenciatura en Mercadeo', nivel: 'Grado', fechaDesde: '2013-09-01', fechaHasta: '2017-07-20', institucion: 'Universidad APEC' },
  { id: 8, descripcion: 'Doctorado en Derecho Empresarial', nivel: 'Doctorado', fechaDesde: '2016-09-01', fechaHasta: '2020-06-30', institucion: 'Universidad Complutense de Madrid' },
  { id: 9, descripcion: 'Certificación Scrum Master', nivel: 'Gestión', fechaDesde: '2024-04-01', fechaHasta: '2024-04-30', institucion: 'Scrum.org' },
  { id: 10, descripcion: 'Técnico en Seguridad Industrial', nivel: 'Técnico', fechaDesde: '2018-05-01', fechaHasta: '2018-11-30', institucion: 'INFOTEP' },
  { id: 11, descripcion: 'Maestría en Administración (MBA)', nivel: 'Maestría', fechaDesde: '2018-01-15', fechaHasta: '2019-12-10', institucion: 'Barna Management School' },
  { id: 12, descripcion: 'Licenciatura en Derecho', nivel: 'Grado', fechaDesde: '2010-08-01', fechaHasta: '2015-06-30', institucion: 'PUCMM' },
];

export const SEED_PUESTOS: Puesto[] = [
  { id: 1, nombre: 'Desarrollador Frontend', departamento: 'Tecnología', riesgo: 'Bajo', salarioMin: 60000, salarioMax: 110000, estado: 'Activo' },
  { id: 2, nombre: 'Desarrollador Backend', departamento: 'Tecnología', riesgo: 'Bajo', salarioMin: 65000, salarioMax: 120000, estado: 'Activo' },
  { id: 3, nombre: 'Analista de Datos', departamento: 'Tecnología', riesgo: 'Bajo', salarioMin: 55000, salarioMax: 95000, estado: 'Activo' },
  { id: 4, nombre: 'Contador Senior', departamento: 'Finanzas', riesgo: 'Medio', salarioMin: 70000, salarioMax: 115000, estado: 'Activo' },
  { id: 5, nombre: 'Analista Financiero', departamento: 'Finanzas', riesgo: 'Medio', salarioMin: 50000, salarioMax: 85000, estado: 'Activo' },
  { id: 6, nombre: 'Especialista en Reclutamiento', departamento: 'Recursos Humanos', riesgo: 'Bajo', salarioMin: 45000, salarioMax: 75000, estado: 'Activo' },
  { id: 7, nombre: 'Supervisor de Almacén', departamento: 'Operaciones', riesgo: 'Alto', salarioMin: 40000, salarioMax: 65000, estado: 'Activo' },
  { id: 8, nombre: 'Ejecutivo de Ventas', departamento: 'Comercial', riesgo: 'Medio', salarioMin: 35000, salarioMax: 70000, estado: 'Activo' },
  { id: 9, nombre: 'Coordinador de Mercadeo Digital', departamento: 'Mercadeo', riesgo: 'Bajo', salarioMin: 50000, salarioMax: 85000, estado: 'Activo' },
  { id: 10, nombre: 'Abogado Corporativo', departamento: 'Legal', riesgo: 'Medio', salarioMin: 80000, salarioMax: 140000, estado: 'Activo' },
  { id: 11, nombre: 'Agente de Servicio al Cliente', departamento: 'Servicio al Cliente', riesgo: 'Bajo', salarioMin: 28000, salarioMax: 42000, estado: 'Activo' },
  { id: 12, nombre: 'Gerente de Proyectos TI', departamento: 'Tecnología', riesgo: 'Medio', salarioMin: 120000, salarioMax: 180000, estado: 'Activo' },
  { id: 13, nombre: 'Mensajero', departamento: 'Operaciones', riesgo: 'Alto', salarioMin: 22000, salarioMax: 30000, estado: 'Inactivo' },
];

const c = makeCedula;

export const SEED_CANDIDATOS: Candidato[] = [
  { id: 1, cedula: c('4022381745'), nombre: 'Valeria Méndez Santos', email: 'valeria.mendez@mail.com', telefono: '809-555-0141', puestoId: 1, departamento: 'Tecnología', salarioAspira: 95000, competencias: [1, 4, 5, 11], capacitaciones: [1, 9], idiomas: [1, 2], recomendadoPor: 'Luis Ortega', etapa: 'Entrevista', fechaPostulacion: '2026-09-02' },
  { id: 2, cedula: c('0011456723'), nombre: 'José Miguel Peña', email: 'jmpena@mail.com', telefono: '829-555-0198', puestoId: 4, departamento: 'Finanzas', salarioAspira: 105000, competencias: [7, 13, 6, 14], capacitaciones: [3, 4, 11], idiomas: [1, 2], recomendadoPor: '', etapa: 'Oferta', fechaPostulacion: '2026-08-21' },
  { id: 3, cedula: c('2230098341'), nombre: 'Camila Rosario Díaz', email: 'camila.rosario@mail.com', telefono: '849-555-0112', puestoId: 6, departamento: 'Recursos Humanos', salarioAspira: 62000, competencias: [1, 3, 8, 14], capacitaciones: [6], idiomas: [1, 2, 3], recomendadoPor: 'Ana Taveras', etapa: 'Evaluación', fechaPostulacion: '2026-09-08' },
  { id: 4, cedula: c('0310567812'), nombre: 'Andrés Felipe Guzmán', email: 'andres.guzman@mail.com', telefono: '809-555-0177', puestoId: 2, departamento: 'Tecnología', salarioAspira: 115000, competencias: [5, 6, 11, 1], capacitaciones: [1, 5], idiomas: [1, 2], recomendadoPor: '', etapa: 'Postulado', fechaPostulacion: '2026-09-25' },
  { id: 5, cedula: c('4021198734'), nombre: 'Daniela Herrera Cruz', email: 'dherrera@mail.com', telefono: '829-555-0133', puestoId: 3, departamento: 'Tecnología', salarioAspira: 80000, competencias: [6, 12, 11], capacitaciones: [2], idiomas: [1, 2, 4], recomendadoPor: 'Pedro Almonte', etapa: 'Oferta', fechaPostulacion: '2026-08-30' },
  { id: 6, cedula: c('0012984560'), nombre: 'Ramón Antonio Báez', email: 'ramon.baez@mail.com', telefono: '809-555-0164', puestoId: 7, departamento: 'Operaciones', salarioAspira: 55000, competencias: [9, 2, 14], capacitaciones: [10], idiomas: [1], recomendadoPor: '', etapa: 'Entrevista', fechaPostulacion: '2026-09-11' },
  { id: 7, cedula: c('4023345619'), nombre: 'Gabriela Núñez Polanco', email: 'gnunez@mail.com', telefono: '849-555-0186', puestoId: 9, departamento: 'Mercadeo', salarioAspira: 72000, competencias: [3, 12, 1, 11], capacitaciones: [7], idiomas: [1, 2, 5], recomendadoPor: 'María Fernández', etapa: 'Postulado', fechaPostulacion: '2026-09-27' },
  { id: 8, cedula: c('0018873421'), nombre: 'Héctor Luis Familia', email: 'hfamilia@mail.com', telefono: '809-555-0120', puestoId: 10, departamento: 'Legal', salarioAspira: 130000, competencias: [8, 3, 11], capacitaciones: [12, 8], idiomas: [1, 2, 3], recomendadoPor: '', etapa: 'Evaluación', fechaPostulacion: '2026-09-04' },
  { id: 9, cedula: c('2234418806'), nombre: 'Paola Jiménez Vargas', email: 'pjimenez@mail.com', telefono: '829-555-0159', puestoId: 8, departamento: 'Comercial', salarioAspira: 50000, competencias: [8, 10, 3], capacitaciones: [7], idiomas: [1, 2], recomendadoPor: 'Carlos Medina', etapa: 'Postulado', fechaPostulacion: '2026-09-28' },
  { id: 10, cedula: c('4029901273'), nombre: 'Kevin Alexander Tejada', email: 'ktejada@mail.com', telefono: '809-555-0105', puestoId: 11, departamento: 'Servicio al Cliente', salarioAspira: 35000, competencias: [10, 3, 1], capacitaciones: [], idiomas: [1, 2], recomendadoPor: '', etapa: 'Descartado', fechaPostulacion: '2026-08-12' },
  { id: 11, cedula: c('0016652398'), nombre: 'Laura Marte Espinal', email: 'lmarte@mail.com', telefono: '849-555-0150', puestoId: 5, departamento: 'Finanzas', salarioAspira: 68000, competencias: [7, 12, 6], capacitaciones: [3, 11], idiomas: [1, 2], recomendadoPor: '', etapa: 'Entrevista', fechaPostulacion: '2026-09-15' },
  { id: 12, cedula: c('4027712054'), nombre: 'Samuel Ortiz Reyes', email: 'sortiz@mail.com', telefono: '829-555-0172', puestoId: 12, departamento: 'Tecnología', salarioAspira: 165000, competencias: [2, 4, 5, 8, 14], capacitaciones: [1, 9, 11], idiomas: [1, 2], recomendadoPor: 'Valeria Méndez', etapa: 'Evaluación', fechaPostulacion: '2026-09-06' },
  { id: 13, cedula: c('0310984417'), nombre: 'Yohanna Cabrera Lora', email: 'ycabrera@mail.com', telefono: '809-555-0193', puestoId: 1, departamento: 'Tecnología', salarioAspira: 78000, competencias: [4, 1, 3], capacitaciones: [1], idiomas: [1, 2], recomendadoPor: '', etapa: 'Postulado', fechaPostulacion: '2026-09-29' },
  { id: 14, cedula: c('4025563328'), nombre: 'Miguel Ángel Rosado', email: 'mrosado@mail.com', telefono: '829-555-0110', puestoId: 2, departamento: 'Tecnología', salarioAspira: 98000, competencias: [5, 6, 1], capacitaciones: [1, 5], idiomas: [1, 2], recomendadoPor: 'Samuel Ortiz', etapa: 'Contratado', fechaPostulacion: '2026-07-20' },
  { id: 15, cedula: c('0014430982'), nombre: 'Patricia Almonte Gil', email: 'palmonte@mail.com', telefono: '849-555-0138', puestoId: 6, departamento: 'Recursos Humanos', salarioAspira: 58000, competencias: [1, 3, 14], capacitaciones: [6], idiomas: [1, 2], recomendadoPor: '', etapa: 'Contratado', fechaPostulacion: '2026-07-02' },
  { id: 16, cedula: c('2231127645'), nombre: 'Fernando Castillo Ureña', email: 'fcastillo@mail.com', telefono: '809-555-0181', puestoId: 8, departamento: 'Comercial', salarioAspira: 48000, competencias: [8, 10], capacitaciones: [], idiomas: [1], recomendadoPor: '', etapa: 'Contratado', fechaPostulacion: '2026-06-10' },
];

export const SEED_EXPERIENCIAS: Experiencia[] = [
  { id: 1, candidatoId: 1, empresa: 'Banco Popular Dominicano', puesto: 'Desarrolladora Web', fechaDesde: '2021-03-01', fechaHasta: '2024-05-31', salario: 70000 },
  { id: 2, candidatoId: 1, empresa: 'Gbh Software', puesto: 'Frontend Engineer', fechaDesde: '2024-06-01', fechaHasta: '', salario: 88000 },
  { id: 3, candidatoId: 2, empresa: 'Grupo Ramos', puesto: 'Contador', fechaDesde: '2016-09-01', fechaHasta: '2021-12-31', salario: 65000 },
  { id: 4, candidatoId: 2, empresa: 'Deloitte RD', puesto: 'Auditor Senior', fechaDesde: '2022-01-10', fechaHasta: '', salario: 95000 },
  { id: 5, candidatoId: 3, empresa: 'Claro Dominicana', puesto: 'Analista de Reclutamiento', fechaDesde: '2020-02-01', fechaHasta: '', salario: 52000 },
  { id: 6, candidatoId: 4, empresa: 'Altice Dominicana', puesto: 'Desarrollador Java', fechaDesde: '2019-08-01', fechaHasta: '2023-03-31', salario: 75000 },
  { id: 7, candidatoId: 4, empresa: 'Banreservas', puesto: 'Ingeniero Backend', fechaDesde: '2023-04-15', fechaHasta: '', salario: 102000 },
  { id: 8, candidatoId: 5, empresa: 'Cervecería Nacional Dominicana', puesto: 'Analista BI', fechaDesde: '2022-01-15', fechaHasta: '', salario: 68000 },
  { id: 9, candidatoId: 6, empresa: 'Grupo Ramos', puesto: 'Encargado de Almacén', fechaDesde: '2017-05-01', fechaHasta: '', salario: 45000 },
  { id: 10, candidatoId: 7, empresa: 'Agencia Pagés BBDO', puesto: 'Community Manager', fechaDesde: '2018-03-01', fechaHasta: '', salario: 58000 },
  { id: 11, candidatoId: 8, empresa: 'Pellerano & Herrera', puesto: 'Abogado Asociado', fechaDesde: '2015-09-01', fechaHasta: '', salario: 115000 },
  { id: 12, candidatoId: 9, empresa: 'Supermercados Nacional', puesto: 'Vendedora', fechaDesde: '2019-01-01', fechaHasta: '2025-12-31', salario: 38000 },
  { id: 13, candidatoId: 11, empresa: 'Banco BHD', puesto: 'Analista de Crédito', fechaDesde: '2020-07-01', fechaHasta: '', salario: 60000 },
  { id: 14, candidatoId: 12, empresa: 'Banco Popular Dominicano', puesto: 'Líder Técnico', fechaDesde: '2016-02-01', fechaHasta: '2022-08-31', salario: 120000 },
  { id: 15, candidatoId: 12, empresa: 'Gbh Software', puesto: 'Engineering Manager', fechaDesde: '2022-09-01', fechaHasta: '', salario: 150000 },
  { id: 16, candidatoId: 14, empresa: 'Altice Dominicana', puesto: 'Desarrollador Node.js', fechaDesde: '2020-01-01', fechaHasta: '2026-07-31', salario: 85000 },
  { id: 17, candidatoId: 15, empresa: 'Universidad APEC', puesto: 'Asistente de Gestión Humana', fechaDesde: '2019-06-01', fechaHasta: '2026-07-15', salario: 45000 },
  { id: 18, candidatoId: 16, empresa: 'Claro Dominicana', puesto: 'Ejecutivo de Cuentas', fechaDesde: '2021-04-01', fechaHasta: '2026-06-01', salario: 42000 },
];

export const SEED_EMPLEADOS: Empleado[] = [
  { id: 1, cedula: c('0010312276'), nombre: 'María Fernández Lugo', fechaIngreso: '2023-02-13', departamento: 'Recursos Humanos', puestoId: 6, salario: 72000, estado: 'Activo' },
  { id: 2, cedula: c('4020087723'), nombre: 'Luis Ortega Sánchez', fechaIngreso: '2024-05-06', departamento: 'Tecnología', puestoId: 12, salario: 160000, estado: 'Activo' },
  { id: 3, cedula: c('0310045128'), nombre: 'Ana Taveras Morel', fechaIngreso: '2024-11-18', departamento: 'Recursos Humanos', puestoId: 6, salario: 58000, estado: 'Activo' },
  { id: 4, cedula: c('2230765590'), nombre: 'Pedro Almonte Ruiz', fechaIngreso: '2025-01-20', departamento: 'Tecnología', puestoId: 3, salario: 82000, estado: 'Activo' },
  { id: 5, cedula: c('0017764412'), nombre: 'Carlos Medina Abreu', fechaIngreso: '2025-03-03', departamento: 'Comercial', puestoId: 8, salario: 55000, estado: 'Activo' },
  { id: 6, cedula: c('4021145598'), nombre: 'Rosa Elena Paulino', fechaIngreso: '2025-06-16', departamento: 'Finanzas', puestoId: 5, salario: 64000, estado: 'Inactivo' },
  { id: 7, cedula: c('0019937701'), nombre: 'Julio César Batista', fechaIngreso: '2025-08-11', departamento: 'Operaciones', puestoId: 7, salario: 52000, estado: 'Activo' },
  { id: 8, cedula: c('4026678210'), nombre: 'Natalia Brito Acosta', fechaIngreso: '2025-10-01', departamento: 'Mercadeo', puestoId: 9, salario: 70000, estado: 'Activo' },
  { id: 9, cedula: c('0310662094'), nombre: 'Esteban Liriano Pérez', fechaIngreso: '2025-12-08', departamento: 'Servicio al Cliente', puestoId: 11, salario: 36000, estado: 'Activo' },
  { id: 10, cedula: c('2235510983'), nombre: 'Isabel Cristina Rojas', fechaIngreso: '2026-01-12', departamento: 'Legal', puestoId: 10, salario: 118000, estado: 'Activo' },
  { id: 11, cedula: c('4028823341'), nombre: 'Diego Hernández Sosa', fechaIngreso: '2026-02-23', departamento: 'Tecnología', puestoId: 1, salario: 92000, estado: 'Activo' },
  { id: 12, cedula: c('0015580267'), nombre: 'Carolina Vásquez Mena', fechaIngreso: '2026-04-06', departamento: 'Finanzas', puestoId: 4, salario: 98000, estado: 'Activo' },
  { id: 13, cedula: c('0012209873'), nombre: 'Wilson Arias Tavárez', fechaIngreso: '2026-05-18', departamento: 'Servicio al Cliente', puestoId: 11, salario: 34000, estado: 'Activo' },
  { id: 14, cedula: c('2231127645'), nombre: 'Fernando Castillo Ureña', fechaIngreso: '2026-07-01', departamento: 'Comercial', puestoId: 8, salario: 48000, estado: 'Activo', candidatoId: 16 },
  { id: 15, cedula: c('0014430982'), nombre: 'Patricia Almonte Gil', fechaIngreso: '2026-08-03', departamento: 'Recursos Humanos', puestoId: 6, salario: 58000, estado: 'Activo', candidatoId: 15 },
  { id: 16, cedula: c('4025563328'), nombre: 'Miguel Ángel Rosado', fechaIngreso: '2026-09-01', departamento: 'Tecnología', puestoId: 2, salario: 98000, estado: 'Activo', candidatoId: 14 },
  { id: 17, cedula: c('0013348812'), nombre: 'Lucía Montero Féliz', fechaIngreso: '2026-02-09', departamento: 'Servicio al Cliente', puestoId: 11, salario: 33000, estado: 'Activo' },
  { id: 18, cedula: c('4024471190'), nombre: 'Rafael Encarnación Vidal', fechaIngreso: '2026-07-20', departamento: 'Operaciones', puestoId: 7, salario: 48000, estado: 'Activo' },
  { id: 19, cedula: c('2236620174'), nombre: 'Mariela Santana Cruz', fechaIngreso: '2026-07-27', departamento: 'Tecnología', puestoId: 1, salario: 75000, estado: 'Activo' },
  { id: 20, cedula: c('0310228865'), nombre: 'Jorge Luis Polanco', fechaIngreso: '2026-09-14', departamento: 'Comercial', puestoId: 8, salario: 45000, estado: 'Activo' },
  { id: 21, cedula: c('4029015532'), nombre: 'Elena Guerrero Pichardo', fechaIngreso: '2026-09-21', departamento: 'Finanzas', puestoId: 5, salario: 62000, estado: 'Activo' },
  { id: 22, cedula: c('0011193347'), nombre: 'Tomás Ventura Hidalgo', fechaIngreso: '2025-11-03', departamento: 'Tecnología', puestoId: 3, salario: 70000, estado: 'Inactivo' },
];
