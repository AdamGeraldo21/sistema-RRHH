import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Candidato, DEPARTAMENTOS, ETAPAS, Etapa } from '../core/models';
import { HireData, Store } from '../core/store';
import { matches, today } from '../core/util';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { InitialsPipe, MoneyPipe } from '../shared/pipes';
import { Ui } from '../shared/ui.service';

const FLOW: Etapa[] = ['Postulado', 'Entrevista', 'Evaluación', 'Oferta'];

@Component({
  selector: 'app-seleccion',
  imports: [FormsModule, Icon, Modal, MoneyPipe, InitialsPipe],
  templateUrl: './seleccion.html',
  styleUrl: './seleccion.scss',
})
export class SeleccionPage {
  protected readonly store = inject(Store);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);

  protected readonly etapas = ETAPAS;
  protected readonly departamentos = DEPARTAMENTOS;
  readonly q = signal('');
  readonly dragId = signal<number | null>(null);
  readonly overCol = signal<Etapa | null>(null);

  readonly hiring = signal<Candidato | null>(null);
  hire: HireData = { fechaIngreso: '', puestoId: 0, departamento: '', salario: 0 };

  protected readonly columns = computed(() => {
    const list = this.store.candidatos.items().filter((c) => matches(this.q(), c.nombre, this.store.puestoNombre(c.puestoId), c.departamento));
    return ETAPAS.map((etapa) => ({
      etapa,
      items: list.filter((c) => c.etapa === etapa).sort((a, b) => b.fechaPostulacion.localeCompare(a.fechaPostulacion)),
    }));
  });

  protected readonly stats = computed(() => {
    const all = this.store.candidatos.items();
    const activos = all.filter((c) => FLOW.includes(c.etapa)).length;
    const contratados = all.filter((c) => c.etapa === 'Contratado').length;
    const cerrados = contratados + all.filter((c) => c.etapa === 'Descartado').length;
    return { activos, contratados, tasa: cerrados ? Math.round((contratados / cerrados) * 100) : 0 };
  });

  protected next(e: Etapa): Etapa | null {
    const i = FLOW.indexOf(e);
    return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1]! : null;
  }

  protected prev(e: Etapa): Etapa | null {
    const i = FLOW.indexOf(e);
    if (e === 'Descartado') return 'Postulado';
    return i > 0 ? FLOW[i - 1]! : null;
  }

  protected comps(c: Candidato): string[] {
    return c.competencias.slice(0, 3).map((id) => this.store.competencias.get(id)?.descripcion ?? '');
  }

  protected move(c: Candidato, etapa: Etapa): void {
    if (c.etapa === etapa) return;
    if (c.etapa === 'Contratado') {
      this.ui.error('Movimiento no permitido', 'El candidato ya fue contratado como empleado.');
      return;
    }
    if (etapa === 'Contratado') {
      this.openHire(c);
      return;
    }
    this.store.candidatos.patch(c.id, { etapa });
    this.ui.info(c.nombre, `Movido a ${etapa}.`);
  }

  protected editar(c: Candidato): void {
    this.router.navigate(['/candidatos'], { queryParams: { editar: c.id } });
  }

  // ---- Drag & drop ----
  protected onDragStart(ev: DragEvent, c: Candidato): void {
    if (c.etapa === 'Contratado') {
      ev.preventDefault();
      return;
    }
    this.dragId.set(c.id);
    ev.dataTransfer?.setData('text/plain', String(c.id));
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }

  protected onDragOver(ev: DragEvent, etapa: Etapa): void {
    if (this.dragId() == null) return;
    ev.preventDefault();
    this.overCol.set(etapa);
  }

  protected onDrop(ev: DragEvent, etapa: Etapa): void {
    ev.preventDefault();
    const c = this.store.candidatos.get(this.dragId());
    this.dragId.set(null);
    this.overCol.set(null);
    if (c) this.move(c, etapa);
  }

  protected onDragEnd(): void {
    this.dragId.set(null);
    this.overCol.set(null);
  }

  // ---- Contratación ----
  protected openHire(c: Candidato): void {
    this.hire = { fechaIngreso: today(), puestoId: c.puestoId, departamento: c.departamento, salario: c.salarioAspira };
    this.hiring.set(c);
  }

  protected onHirePuesto(id: number): void {
    this.hire.puestoId = Number(id);
    const p = this.store.puestos.get(this.hire.puestoId);
    if (p) this.hire.departamento = p.departamento;
  }

  protected get hireError(): string | null {
    const c = this.hiring();
    if (!c) return null;
    const p = this.store.puestos.get(this.hire.puestoId);
    if (!p) return 'Selecciona el puesto.';
    if (!this.hire.fechaIngreso) return 'Indica la fecha de ingreso.';
    if (!(this.hire.salario > 0)) return 'Indica el salario mensual.';
    if (this.hire.salario < p.salarioMin || this.hire.salario > p.salarioMax) return 'El salario debe estar dentro de la banda del puesto.';
    if (this.store.empleados.items().some((e) => e.cedula === c.cedula && e.estado === 'Activo')) return 'Ya existe un empleado activo con esta cédula.';
    return null;
  }

  protected confirmHire(): void {
    const c = this.hiring();
    if (!c) return;
    const err = this.hireError;
    if (err) {
      this.ui.error('No se puede contratar', err);
      return;
    }
    const emp = this.store.contratar(c.id, this.hire);
    this.hiring.set(null);
    this.ui.success('¡Candidato contratado!', `${emp.nombre} ahora es empleado (#${emp.id}).`);
  }
}
