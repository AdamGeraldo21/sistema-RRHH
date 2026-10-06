import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Candidato, Capacitacion, Competencia, Empleado, Entity, Etapa, Experiencia, Idioma, Puesto, Usuario } from './models';

export const API = environment.apiUrl;

/** Mensaje legible a partir de un error HTTP de la API. */
export function apiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    return (err.error as { error?: string } | null)?.error ?? `Error del servidor (${err.status}).`;
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
}

/** Colección respaldada por la API REST; la señal local se actualiza cuando el servidor confirma. */
export class Collection<T extends Entity> {
  private readonly _items = signal<T[]>([]);
  readonly items = this._items.asReadonly();
  readonly byId = computed(() => new Map(this._items().map((i) => [i.id, i])));

  constructor(
    private readonly http: HttpClient,
    readonly path: string,
  ) {}

  private get url(): string {
    return `${API}/${this.path}`;
  }

  get(id: number | null | undefined): T | undefined {
    return id == null ? undefined : this.byId().get(id);
  }

  async load(): Promise<void> {
    this._items.set(await firstValueFrom(this.http.get<T[]>(this.url)));
  }

  /** Crea (id = 0) o actualiza. Devuelve el registro guardado por el servidor. */
  async save(item: T, extra: Record<string, unknown> = {}): Promise<T> {
    const body = { ...item, ...extra };
    const saved = item.id
      ? await firstValueFrom(this.http.put<T>(`${this.url}/${item.id}`, body))
      : await firstValueFrom(this.http.post<T>(this.url, body));
    this.upsert(saved);
    return saved;
  }

  async patch(id: number, changes: Partial<T>, subpath = ''): Promise<T> {
    const saved = await firstValueFrom(this.http.patch<T>(`${this.url}/${id}${subpath}`, changes));
    this.upsert(saved);
    return saved;
  }

  async remove(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.url}/${id}`));
    this.removeLocal((i) => i.id === id);
  }

  upsert(item: T): void {
    this._items.update((list) => (list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item]));
  }

  removeLocal(pred: (i: T) => boolean): void {
    this._items.update((list) => list.filter((i) => !pred(i)));
  }

  clear(): void {
    this._items.set([]);
  }
}

export interface HireData {
  fechaIngreso: string;
  puestoId: number;
  departamento: string;
  salario: number;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly http = inject(HttpClient);

  readonly competencias = new Collection<Competencia>(this.http, 'competencias');
  readonly idiomas = new Collection<Idioma>(this.http, 'idiomas');
  readonly capacitaciones = new Collection<Capacitacion>(this.http, 'capacitaciones');
  readonly puestos = new Collection<Puesto>(this.http, 'puestos');
  readonly candidatos = new Collection<Candidato>(this.http, 'candidatos');
  readonly experiencias = new Collection<Experiencia>(this.http, 'experiencias');
  readonly empleados = new Collection<Empleado>(this.http, 'empleados');
  readonly usuarios = new Collection<Usuario>(this.http, 'usuarios');

  readonly status = signal<LoadStatus>('idle');
  readonly loadError = signal('');

  readonly puestosActivos = computed(() => this.puestos.items().filter((p) => p.estado === 'Activo'));
  readonly competenciasActivas = computed(() => this.competencias.items().filter((c) => c.estado === 'Activo'));
  readonly idiomasActivos = computed(() => this.idiomas.items().filter((i) => i.estado === 'Activo'));

  private readonly hr = [this.competencias, this.idiomas, this.capacitaciones, this.puestos, this.candidatos, this.experiencias, this.empleados];

  /** Carga todos los datos de RH (y los usuarios si es administrador). */
  async loadAll(incluirUsuarios: boolean): Promise<void> {
    this.status.set('loading');
    this.loadError.set('');
    try {
      const cols: Collection<Entity>[] = incluirUsuarios ? [...this.hr, this.usuarios] : this.hr;
      await Promise.all(cols.map((c) => c.load()));
      this.status.set('ready');
    } catch (err) {
      this.loadError.set(apiError(err));
      this.status.set('error');
    }
  }

  clear(): void {
    [...this.hr, this.usuarios].forEach((c: Collection<Entity>) => c.clear());
    this.status.set('idle');
  }

  puestoNombre(id: number | null | undefined): string {
    return this.puestos.get(id)?.nombre ?? '—';
  }

  experienciasDe(candidatoId: number): Experiencia[] {
    return this.experiencias
      .items()
      .filter((e) => e.candidatoId === candidatoId)
      .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde));
  }

  /** Guarda el candidato junto con su experiencia laboral (una sola transacción en el servidor). */
  async saveCandidato(c: Candidato, experiencias: Experiencia[]): Promise<Candidato> {
    const saved = await this.candidatos.save(c, {
      experiencias: experiencias.map(({ empresa, puesto, fechaDesde, fechaHasta, salario }) => ({ empresa, puesto, fechaDesde, fechaHasta, salario })),
    });
    await this.experiencias.load();
    return saved;
  }

  async removeCandidato(id: number): Promise<void> {
    await this.candidatos.remove(id);
    this.experiencias.removeLocal((e) => e.candidatoId === id);
  }

  moverEtapa(id: number, etapa: Etapa): Promise<Candidato> {
    return this.candidatos.patch(id, { etapa }, '/etapa');
  }

  /** Proceso de selección: convierte un candidato en empleado. */
  async contratar(candidatoId: number, data: HireData): Promise<Empleado> {
    const r = await firstValueFrom(
      this.http.post<{ empleado: Empleado; candidato: Candidato }>(`${API}/candidatos/${candidatoId}/contratar`, data),
    );
    this.empleados.upsert(r.empleado);
    this.candidatos.upsert(r.candidato);
    return r.empleado;
  }

  saveUsuario(u: Usuario, password: string): Promise<Usuario> {
    const { nombre, email, rol, estado } = u;
    return this.usuarios.save({ id: u.id, nombre, email, rol, estado } as Usuario, { password });
  }

  /** Restaura los datos de RH de demostración en la base de datos (solo administradores). */
  async resetAll(): Promise<void> {
    await firstValueFrom(this.http.post(`${API}/admin/reset`, {}));
    await this.loadAll(true);
  }
}
