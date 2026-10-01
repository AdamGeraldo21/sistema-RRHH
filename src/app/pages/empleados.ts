import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEPARTAMENTOS, Empleado } from '../core/models';
import { cedulaValida, formatCedula, matches, today } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { FechaPipe, InitialsPipe, MoneyPipe } from '../shared/pipes';

@Component({
  selector: 'app-empleados',
  imports: [FormsModule, Icon, Modal, MoneyPipe, FechaPipe, InitialsPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Personal</div>
          <h1>Empleados</h1>
          <p>Colaboradores de la organización, incluidos los contratados desde el proceso de selección.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="plus" /> Nuevo empleado</button>
      </div>

      <div class="grid grid-3">
        <div class="card kpi">
          <div class="kpi-icon"><app-icon name="usercheck" /></div>
          <div class="label">Empleados activos</div>
          <div class="value num">{{ activos() }}</div>
          <div class="foot">de {{ col.items().length }} registrados</div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon cool"><app-icon name="wallet" /></div>
          <div class="label">Nómina mensual (activos)</div>
          <div class="value num">{{ nomina() | money }}</div>
          <div class="foot">Promedio {{ (activos() ? nomina() / activos() : 0) | money }}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-icon"><app-icon name="kanban" /></div>
          <div class="label">Vía proceso de selección</div>
          <div class="value num">{{ desdeSeleccion() }}</div>
          <div class="foot">contratados desde candidatos</div>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Nombre, cédula o puesto…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <select class="select" [ngModel]="depto()" (ngModelChange)="depto.set($event)" aria-label="Departamento">
            <option value="">Todos los departamentos</option>
            @for (d of departamentos; track d) {
              <option [value]="d">{{ d }}</option>
            }
          </select>
          <div class="seg">
            @for (s of ['Todos', 'Activo', 'Inactivo']; track s) {
              <button type="button" [class.on]="estado() === s" (click)="estado.set(s)">{{ s }}</button>
            }
          </div>
          <span class="spacer"></span>
          <span class="count-badge">{{ rows().length }} empleados</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Puesto</th>
                <th>Departamento</th>
                <th>Fecha de ingreso</th>
                <th class="right">Salario mensual</th>
                <th>Estado</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (e of rows(); track e.id) {
                <tr>
                  <td>
                    <div class="person">
                      <span class="avatar">{{ e.nombre | initials }}</span>
                      <div>
                        <div class="name">
                          {{ e.nombre }}
                          @if (e.candidatoId) {
                            <span class="tag brand plain" style="height: 20px; font-size: 10.5px; margin-left: 4px">Selección</span>
                          }
                        </div>
                        <div class="meta num">#{{ e.id }} · {{ e.cedula }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ store.puestoNombre(e.puestoId) }}</td>
                  <td>{{ e.departamento }}</td>
                  <td class="num">{{ e.fechaIngreso | fecha }}</td>
                  <td class="right num">{{ e.salario | money }}</td>
                  <td>
                    <label class="switch" [attr.aria-label]="'Estado de ' + e.nombre">
                      <input type="checkbox" [checked]="e.estado === 'Activo'" (change)="toggleEstado(e)" />
                      <span class="track"></span>
                      <span class="tag" [class.ok]="e.estado === 'Activo'" [class.bad]="e.estado !== 'Activo'">{{ e.estado }}</span>
                    </label>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" type="button" (click)="edit(e)" aria-label="Editar"><app-icon name="pencil" [size]="16" /></button>
                      <button class="icon-btn danger" type="button" (click)="remove(e, e.nombre)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty">
                      <div class="empty-icon"><app-icon name="idcard" [size]="24" /></div>
                      <h4>Sin empleados</h4>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (formOpen()) {
      <app-modal [title]="isNew ? 'Nuevo empleado' : 'Editar empleado'" eyebrow="Personal" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field">
            <label for="ced">Cédula *</label>
            <input id="ced" class="input num" name="cedula" placeholder="000-0000000-0" inputmode="numeric" [ngModel]="draft.cedula" (ngModelChange)="draft.cedula = fmt($event)" [class.invalid]="!!cedulaError" />
            @if (cedulaError) {
              <span class="hint err">{{ cedulaError }}</span>
            }
          </div>
          <div class="field">
            <label for="nombre">Nombre completo *</label>
            <input id="nombre" class="input" name="nombre" [(ngModel)]="draft.nombre" [class.invalid]="submitted && !draft.nombre.trim()" />
          </div>
          <div class="field">
            <label for="puesto">Puesto *</label>
            <select id="puesto" class="select" name="puesto" [ngModel]="draft.puestoId" (ngModelChange)="onPuesto($event)" [class.invalid]="submitted && !draft.puestoId">
              <option [value]="0" disabled>Selecciona un puesto</option>
              @for (p of store.puestos.items(); track p.id) {
                <option [value]="p.id">{{ p.nombre }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="depto">Departamento</label>
            <select id="depto" class="select" name="depto" [(ngModel)]="draft.departamento">
              @for (d of departamentos; track d) {
                <option [value]="d">{{ d }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="fi">Fecha de ingreso *</label>
            <input id="fi" type="date" class="input" name="fi" [(ngModel)]="draft.fechaIngreso" [class.invalid]="submitted && !draft.fechaIngreso" />
          </div>
          <div class="field">
            <label for="sal">Salario mensual (RD$) *</label>
            <input id="sal" type="number" min="0" step="1000" class="input" name="sal" [(ngModel)]="draft.salario" [class.invalid]="submitted && !(draft.salario > 0)" />
            @if (store.puestos.get(draft.puestoId); as p) {
              <span class="hint" [class.warn]="draft.salario > 0 && (draft.salario < p.salarioMin || draft.salario > p.salarioMax)">
                Banda: {{ p.salarioMin | money }} – {{ p.salarioMax | money }}
              </span>
            }
          </div>
          <div class="field span-2">
            <span class="label">Estado</span>
            <label class="switch">
              <input type="checkbox" [checked]="draft.estado === 'Activo'" (change)="draft.estado = $any($event.target).checked ? 'Activo' : 'Inactivo'" />
              <span class="track"></span>
              {{ draft.estado }}
            </label>
          </div>
        </form>
        <ng-container footer>
          <button class="btn" type="button" (click)="close()">Cancelar</button>
          <button class="btn btn-primary" type="submit" form="f"><app-icon name="check" [size]="16" /> Guardar</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class EmpleadosPage extends CrudPage<Empleado> {
  protected readonly col = this.store.empleados;
  protected readonly noun = 'Empleado';
  protected readonly departamentos = DEPARTAMENTOS;
  protected readonly fmt = formatCedula;
  readonly depto = signal('');
  readonly estado = signal('Todos');

  protected readonly activos = computed(() => this.col.items().filter((e) => e.estado === 'Activo').length);
  protected readonly nomina = computed(() =>
    this.col
      .items()
      .filter((e) => e.estado === 'Activo')
      .reduce((s, e) => s + e.salario, 0),
  );
  protected readonly desdeSeleccion = computed(() => this.col.items().filter((e) => e.candidatoId).length);

  protected readonly rows = computed(() =>
    this.col
      .items()
      .filter(
        (e) =>
          (!this.depto() || e.departamento === this.depto()) &&
          (this.estado() === 'Todos' || e.estado === this.estado()) &&
          matches(this.q(), e.nombre, e.cedula, e.departamento, this.store.puestoNombre(e.puestoId)),
      )
      .sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso)),
  );

  protected get cedulaError(): string | null {
    const ced = this.draft.cedula;
    if (!ced) return this.submitted ? 'La cédula es obligatoria.' : null;
    if (ced.replace(/\D/g, '').length < 11) return this.submitted ? 'La cédula debe tener 11 dígitos.' : null;
    if (!cedulaValida(ced)) return 'Cédula inválida (dígito verificador incorrecto).';
    if (this.col.items().some((e) => e.id !== this.draft.id && e.cedula === ced)) return 'Ya existe un empleado con esta cédula.';
    return null;
  }

  protected onPuesto(id: number): void {
    this.draft.puestoId = Number(id);
    const p = this.store.puestos.get(this.draft.puestoId);
    if (p) this.draft.departamento = p.departamento;
  }

  protected toggleEstado(e: Empleado): void {
    const estado = e.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.col.patch(e.id, { estado });
    this.ui.info(`${e.nombre}`, `Estado cambiado a ${estado}.`);
  }

  protected blank(): Empleado {
    return { id: 0, cedula: '', nombre: '', fechaIngreso: today(), departamento: DEPARTAMENTOS[0], puestoId: 0, salario: 0, estado: 'Activo' };
  }

  protected override validate(d: Empleado): string | null {
    if (!d.nombre.trim()) return 'El nombre es obligatorio.';
    const ced = this.cedulaError;
    if (ced) return ced;
    if (!d.puestoId) return 'Selecciona el puesto.';
    if (!d.fechaIngreso) return 'Indica la fecha de ingreso.';
    if (!(d.salario > 0)) return 'Indica el salario mensual.';
    return null;
  }
}
