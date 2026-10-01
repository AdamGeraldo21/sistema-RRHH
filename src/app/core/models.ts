export type Estado = 'Activo' | 'Inactivo';

export interface Entity {
  id: number;
}

export type TipoCompetencia = 'Organizacional' | 'Técnica' | 'Operativa' | 'Gerencial';

export interface Competencia extends Entity {
  descripcion: string;
  tipo: TipoCompetencia;
  estado: Estado;
}

export interface Idioma extends Entity {
  nombre: string;
  estado: Estado;
}

export type NivelCapacitacion = 'Grado' | 'Post-grado' | 'Maestría' | 'Doctorado' | 'Técnico' | 'Gestión';

export interface Capacitacion extends Entity {
  descripcion: string;
  nivel: NivelCapacitacion;
  fechaDesde: string;
  fechaHasta: string;
  institucion: string;
}

export type NivelRiesgo = 'Alto' | 'Medio' | 'Bajo';

export interface Puesto extends Entity {
  nombre: string;
  departamento: string;
  riesgo: NivelRiesgo;
  salarioMin: number;
  salarioMax: number;
  estado: Estado;
}

export type Etapa = 'Postulado' | 'Entrevista' | 'Evaluación' | 'Oferta' | 'Contratado' | 'Descartado';

export interface Candidato extends Entity {
  cedula: string;
  nombre: string;
  email: string;
  telefono: string;
  puestoId: number;
  departamento: string;
  salarioAspira: number;
  competencias: number[];
  capacitaciones: number[];
  idiomas: number[];
  recomendadoPor: string;
  etapa: Etapa;
  fechaPostulacion: string;
}

export interface Experiencia extends Entity {
  candidatoId: number;
  empresa: string;
  puesto: string;
  fechaDesde: string;
  fechaHasta: string;
  salario: number;
}

export interface Empleado extends Entity {
  cedula: string;
  nombre: string;
  fechaIngreso: string;
  departamento: string;
  puestoId: number;
  salario: number;
  estado: Estado;
  candidatoId?: number;
}

export const DEPARTAMENTOS = [
  'Tecnología',
  'Finanzas',
  'Recursos Humanos',
  'Operaciones',
  'Comercial',
  'Mercadeo',
  'Legal',
  'Servicio al Cliente',
] as const;

export const TIPOS_COMPETENCIA: TipoCompetencia[] = ['Organizacional', 'Técnica', 'Operativa', 'Gerencial'];
export const NIVELES_CAPACITACION: NivelCapacitacion[] = ['Grado', 'Post-grado', 'Maestría', 'Doctorado', 'Técnico', 'Gestión'];
export const NIVELES_RIESGO: NivelRiesgo[] = ['Alto', 'Medio', 'Bajo'];
export const ETAPAS: Etapa[] = ['Postulado', 'Entrevista', 'Evaluación', 'Oferta', 'Contratado', 'Descartado'];
