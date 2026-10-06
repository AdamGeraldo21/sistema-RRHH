import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Candidato, DEPARTAMENTOS, ETAPAS, Experiencia } from '../core/models';
import { cedulaValida, etapaTone, formatCedula, matches, today } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { FechaPipe, InitialsPipe, MoneyPipe } from '../shared/pipes';

@Component({
  selector: 'app-candidatos',
  imports: [FormsModule, Icon, Modal, MoneyPipe, FechaPipe, InitialsPipe],
  templateUrl: './candidatos.html',
  styles: `
    .exp-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .exp {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface-2);
    }
    .exp .dot {
      flex: none;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: var(--brand-soft);
      color: var(--brand);
    }
    .exp .body {
      flex: 1;
      min-width: 0;
      font-size: 13px;
    }
    .exp .body strong {
      display: block;
    }
    .exp-form {
      padding: 14px;
      border-radius: 14px;
      border: 1px dashed var(--border-strong);
      background: var(--surface-2);
    }
    .exp-form .input {
      background: var(--surface);
    }
    .salary-hint {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .clickable {
      cursor: pointer;
    }
  `,
})
export class CandidatosPage extends CrudPage<Candidato> {
  protected readonly col = this.store.candidatos;
  protected readonly noun = 'Candidato';
  protected readonly etapas = ETAPAS;
  protected readonly departamentos = DEPARTAMENTOS;
  protected readonly tone = etapaTone;
  readonly etapa = signal('');
  readonly puesto = signal(0);

  /** Experiencia laboral en edición dentro del formulario. */
  exps: Experiencia[] = [];
  expDraft: Experiencia | null = null;
  expIndex = -1;

  constructor() {
    super();
    const editId = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('editar'));
    const c = this.col.get(editId);
    if (c) this.edit(c);
  }

  protected readonly rows = computed(() =>
    this.col
      .items()
      .filter(
        (c) =>
          (!this.etapa() || c.etapa === this.etapa()) &&
          (!this.puesto() || c.puestoId === this.puesto()) &&
          matches(this.q(), c.nombre, c.cedula, c.email, c.departamento, this.store.puestoNombre(c.puestoId), c.recomendadoPor),
      )
      .sort((a, b) => b.fechaPostulacion.localeCompare(a.fechaPostulacion)),
  );

  protected compName(id: number): string {
    return this.store.competencias.get(id)?.descripcion ?? '';
  }

  protected toggle(list: number[], id: number): void {
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.push(id);
  }

  protected onCedula(v: string): void {
    this.draft.cedula = formatCedula(v);
  }

  protected get cedulaError(): string | null {
    const ced = this.draft.cedula;
    if (!ced) return this.submitted ? 'La cédula es obligatoria.' : null;
    if (ced.replace(/\D/g, '').length < 11) return this.submitted ? 'La cédula debe tener 11 dígitos.' : null;
    if (!cedulaValida(ced)) return 'Cédula inválida (dígito verificador incorrecto).';
    if (this.col.items().some((c) => c.id !== this.draft.id && c.cedula === ced)) return 'Ya existe un candidato con esta cédula.';
    return null;
  }

  protected onPuesto(id: number): void {
    this.draft.puestoId = Number(id);
    const p = this.store.puestos.get(this.draft.puestoId);
    if (p) this.draft.departamento = p.departamento;
  }

  protected get rango(): { min: number; max: number } | null {
    const p = this.store.puestos.get(this.draft.puestoId);
    return p ? { min: p.salarioMin, max: p.salarioMax } : null;
  }

  // ---- Experiencia laboral ----
  protected newExp(): void {
    this.expDraft = { id: 0, candidatoId: this.draft.id, empresa: '', puesto: '', fechaDesde: '', fechaHasta: '', salario: 0 };
    this.expIndex = -1;
  }

  protected editExp(i: number): void {
    this.expDraft = { ...this.exps[i]! };
    this.expIndex = i;
  }

  protected saveExp(): void {
    const e = this.expDraft;
    if (!e) return;
    if (!e.empresa.trim() || !e.puesto.trim() || !e.fechaDesde) {
      this.ui.error('Experiencia incompleta', 'Empresa, puesto y fecha desde son obligatorios.');
      return;
    }
    if (e.fechaHasta && e.fechaHasta < e.fechaDesde) {
      this.ui.error('Fechas inválidas', 'La fecha hasta no puede ser anterior a la fecha desde.');
      return;
    }
    if (this.expIndex >= 0) this.exps[this.expIndex] = e;
    else this.exps.push(e);
    this.exps.sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde));
    this.expDraft = null;
  }

  protected removeExp(i: number): void {
    this.exps.splice(i, 1);
  }

  // ---- CRUD ----
  override create(): void {
    super.create();
    this.exps = [];
    this.expDraft = null;
  }

  override edit(item: Candidato): void {
    super.edit(item);
    this.exps = this.store.experienciasDe(item.id).map((e) => ({ ...e }));
    this.expDraft = null;
  }

  protected blank(): Candidato {
    return {
      id: 0,
      cedula: '',
      nombre: '',
      email: '',
      telefono: '',
      puestoId: 0,
      departamento: '',
      salarioAspira: 0,
      competencias: [],
      capacitaciones: [],
      idiomas: [],
      recomendadoPor: '',
      etapa: 'Postulado',
      fechaPostulacion: today(),
    };
  }

  protected override validate(d: Candidato): string | null {
    if (!d.nombre.trim()) return 'El nombre es obligatorio.';
    const ced = this.cedulaError;
    if (ced) return ced;
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'El correo electrónico no es válido.';
    if (!d.puestoId) return 'Selecciona el puesto al que aspira.';
    if (!(d.salarioAspira > 0)) return 'Indica el salario al que aspira.';
    if (this.expDraft) return 'Guarda o cancela la experiencia laboral en edición.';
    return null;
  }

  protected override persist(c: Candidato): Promise<Candidato> {
    return this.store.saveCandidato(c, this.exps);
  }

  protected override blockRemove(c: Candidato): string | null {
    return c.etapa === 'Contratado' ? 'El candidato ya fue contratado como empleado.' : null;
  }

  protected override doRemove(c: Candidato): Promise<void> {
    return this.store.removeCandidato(c.id);
  }
}
