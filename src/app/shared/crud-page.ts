import { Directive, inject, signal } from '@angular/core';
import { Entity } from '../core/models';
import { Collection, Store, apiError } from '../core/store';
import { Ui } from './ui.service';

/** Comportamiento común de las pantallas de mantenimiento (agregar / editar / eliminar). */
@Directive()
export abstract class CrudPage<T extends Entity> {
  protected readonly store = inject(Store);
  protected readonly ui = inject(Ui);

  protected abstract readonly col: Collection<T>;
  /** Nombre de la entidad en singular, p. ej. "Competencia". */
  protected abstract readonly noun: string;
  protected readonly femenino: boolean = false;

  readonly q = signal('');
  readonly formOpen = signal(false);
  /** true mientras se envía el formulario al servidor. */
  readonly saving = signal(false);
  draft!: T;
  submitted = false;

  protected abstract blank(): T;

  /** Validación rápida en el cliente: devuelve un mensaje de error o null. El servidor vuelve a validar. */
  protected validate(_draft: T): string | null {
    return null;
  }

  /** Devuelve un motivo si el registro no se puede eliminar. */
  protected blockRemove(_item: T): string | null {
    return null;
  }

  /** Envía el borrador a la API. */
  protected persist(draft: T): Promise<T> {
    return this.col.save(draft);
  }

  get isNew(): boolean {
    return !this.draft?.id;
  }

  create(): void {
    this.draft = this.blank();
    this.submitted = false;
    this.formOpen.set(true);
  }

  edit(item: T): void {
    this.draft = structuredClone(item);
    this.submitted = false;
    this.formOpen.set(true);
  }

  close(): void {
    this.formOpen.set(false);
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted = true;
    const error = this.validate(this.draft);
    if (error) {
      this.ui.error('Revisa el formulario', error);
      return;
    }
    const isNew = this.isNew;
    this.saving.set(true);
    try {
      await this.persist(this.draft);
      const a = this.femenino ? 'a' : 'o';
      this.ui.success(`${this.noun} ${isNew ? 'cread' + a : 'actualizad' + a}`, 'Los cambios se guardaron en la base de datos.');
      this.formOpen.set(false);
    } catch (err) {
      this.ui.error('No se pudo guardar', apiError(err));
    } finally {
      this.saving.set(false);
    }
  }

  async remove(item: T, label: string): Promise<void> {
    const blocked = this.blockRemove(item);
    if (blocked) {
      this.ui.error('No se puede eliminar', blocked);
      return;
    }
    const ok = await this.ui.confirm({
      title: `Eliminar ${this.noun.toLowerCase()}`,
      message: `¿Seguro que deseas eliminar "${label}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    try {
      await this.doRemove(item);
      const a = this.femenino ? 'a' : 'o';
      this.ui.success(`${this.noun} eliminad${a}`);
    } catch (err) {
      this.ui.error('No se pudo eliminar', apiError(err));
    }
  }

  protected doRemove(item: T): Promise<void> {
    return this.col.remove(item.id);
  }
}
