import { Injectable, computed, signal } from '@angular/core';
import { Candidato, Capacitacion, Competencia, Empleado, Entity, Experiencia, Idioma, Puesto, Usuario } from './models';
import {
  SEED_USUARIOS,
  SEED_CANDIDATOS,
  SEED_CAPACITACIONES,
  SEED_COMPETENCIAS,
  SEED_EMPLEADOS,
  SEED_EXPERIENCIAS,
  SEED_IDIOMAS,
  SEED_PUESTOS,
} from './seed';

const PREFIX = 'talenta.v1.';

/** Colección en memoria respaldada por localStorage (datos de demostración). */
export class Collection<T extends Entity> {
  private readonly _items = signal<T[]>([]);
  readonly items = this._items.asReadonly();
  readonly byId = computed(() => new Map(this._items().map((i) => [i.id, i])));

  constructor(
    private readonly key: string,
    private readonly seed: T[],
  ) {
    this._items.set(this.load() ?? structuredClone(seed));
  }

  get(id: number | null | undefined): T | undefined {
    return id == null ? undefined : this.byId().get(id);
  }

  /** Crea (id = 0) o actualiza. Devuelve el registro guardado. */
  save(item: T): T {
    const copy = structuredClone(item);
    if (!copy.id) {
      copy.id = this._items().reduce((m, i) => Math.max(m, i.id), 0) + 1;
      this._items.update((list) => [...list, copy]);
    } else {
      this._items.update((list) => list.map((i) => (i.id === copy.id ? copy : i)));
    }
    this.persist();
    return copy;
  }

  patch(id: number, changes: Partial<T>): void {
    this._items.update((list) => list.map((i) => (i.id === id ? { ...i, ...changes } : i)));
    this.persist();
  }

  remove(id: number): void {
    this._items.update((list) => list.filter((i) => i.id !== id));
    this.persist();
  }

  removeWhere(pred: (i: T) => boolean): void {
    this._items.update((list) => list.filter((i) => !pred(i)));
    this.persist();
  }

  reset(): void {
    this._items.set(structuredClone(this.seed));
    this.persist();
  }

  private load(): T[] | null {
    try {
      const raw = localStorage.getItem(PREFIX + this.key);
      return raw ? (JSON.parse(raw) as T[]) : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(PREFIX + this.key, JSON.stringify(this._items()));
    } catch {
      /* almacenamiento no disponible: se mantiene en memoria */
    }
  }
}

export interface HireData {
  fechaIngreso: string;
  puestoId: number;
  departamento: string;
  salario: number;
}

@Injectable({ providedIn: 'root' })
export class Store {
  readonly competencias = new Collection<Competencia>('competencias', SEED_COMPETENCIAS);
  readonly idiomas = new Collection<Idioma>('idiomas', SEED_IDIOMAS);
  readonly capacitaciones = new Collection<Capacitacion>('capacitaciones', SEED_CAPACITACIONES);
  readonly puestos = new Collection<Puesto>('puestos', SEED_PUESTOS);
  readonly candidatos = new Collection<Candidato>('candidatos', SEED_CANDIDATOS);
  readonly experiencias = new Collection<Experiencia>('experiencias', SEED_EXPERIENCIAS);
  readonly empleados = new Collection<Empleado>('empleados', SEED_EMPLEADOS);
  /** No se incluye en resetAll(): restaurar datos no borra las cuentas creadas. */
  readonly usuarios = new Collection<Usuario>('usuarios', SEED_USUARIOS);

  readonly puestosActivos = computed(() => this.puestos.items().filter((p) => p.estado === 'Activo'));
  readonly competenciasActivas = computed(() => this.competencias.items().filter((c) => c.estado === 'Activo'));
  readonly idiomasActivos = computed(() => this.idiomas.items().filter((i) => i.estado === 'Activo'));

  puestoNombre(id: number | null | undefined): string {
    return this.puestos.get(id)?.nombre ?? '—';
  }

  experienciasDe(candidatoId: number): Experiencia[] {
    return this.experiencias
      .items()
      .filter((e) => e.candidatoId === candidatoId)
      .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde));
  }

  /** Reemplaza la experiencia laboral de un candidato. */
  setExperiencias(candidatoId: number, list: Experiencia[]): void {
    this.experiencias.removeWhere((e) => e.candidatoId === candidatoId);
    for (const e of list) this.experiencias.save({ ...e, id: 0, candidatoId });
  }

  removeCandidato(id: number): void {
    this.candidatos.remove(id);
    this.experiencias.removeWhere((e) => e.candidatoId === id);
  }

  /** Proceso de selección: convierte un candidato en empleado. */
  contratar(candidatoId: number, data: HireData): Empleado {
    const c = this.candidatos.get(candidatoId);
    if (!c) throw new Error('Candidato no encontrado');
    const emp = this.empleados.save({
      id: 0,
      cedula: c.cedula,
      nombre: c.nombre,
      fechaIngreso: data.fechaIngreso,
      departamento: data.departamento,
      puestoId: data.puestoId,
      salario: data.salario,
      estado: 'Activo',
      candidatoId: c.id,
    });
    this.candidatos.patch(c.id, { etapa: 'Contratado', puestoId: data.puestoId, departamento: data.departamento });
    return emp;
  }

  resetAll(): void {
    const cols: Collection<Entity>[] = [
      this.competencias,
      this.idiomas,
      this.capacitaciones,
      this.puestos,
      this.candidatos,
      this.experiencias,
      this.empleados,
    ];
    cols.forEach((col) => col.reset());
  }
}
