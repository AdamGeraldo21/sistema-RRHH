import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEPARTAMENTOS, NIVELES_RIESGO, Puesto } from '../core/models';
import { matches } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { MoneyPipe } from '../shared/pipes';

@Component({
  selector: 'app-puestos',
  imports: [FormsModule, Icon, Modal, MoneyPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Catálogos</div>
          <h1>Puestos</h1>
          <p>Posiciones de la organización con su nivel de riesgo y banda salarial.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="plus" /> Nuevo puesto</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Buscar puesto…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <select class="select" [ngModel]="riesgo()" (ngModelChange)="riesgo.set($event)" aria-label="Riesgo">
            <option value="">Cualquier riesgo</option>
            @for (r of riesgos; track r) {
              <option [value]="r">Riesgo {{ r }}</option>
            }
          </select>
          <span class="spacer"></span>
          <span class="count-badge">{{ rows().length }} registros</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Puesto</th>
                <th>Riesgo</th>
                <th>Banda salarial</th>
                <th>Ocupación</th>
                <th>Estado</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of rows(); track p.id) {
                <tr>
                  <td class="muted num">#{{ p.id }}</td>
                  <td>
                    <strong>{{ p.nombre }}</strong>
                    <div class="muted" style="font-size:12px">{{ p.departamento }}</div>
                  </td>
                  <td>
                    <span class="tag" [class.bad]="p.riesgo === 'Alto'" [class.warn]="p.riesgo === 'Medio'" [class.ok]="p.riesgo === 'Bajo'">{{ p.riesgo }}</span>
                  </td>
                  <td class="num">
                    <div class="band">
                      <span>{{ p.salarioMin | money }}</span>
                      <span class="band-bar"><i [style.left.%]="(p.salarioMin / maxSalary()) * 100" [style.width.%]="((p.salarioMax - p.salarioMin) / maxSalary()) * 100"></i></span>
                      <span>{{ p.salarioMax | money }}</span>
                    </div>
                  </td>
                  <td class="num">
                    {{ ocupacion().get(p.id) ?? 0 }} emp. ·
                    <span class="muted">{{ postulaciones().get(p.id) ?? 0 }} cand.</span>
                  </td>
                  <td>
                    <span class="tag" [class.ok]="p.estado === 'Activo'" [class.bad]="p.estado !== 'Activo'">{{ p.estado }}</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" type="button" (click)="edit(p)" aria-label="Editar"><app-icon name="pencil" [size]="16" /></button>
                      <button class="icon-btn danger" type="button" (click)="remove(p, p.nombre)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty">
                      <div class="empty-icon"><app-icon name="briefcase" [size]="24" /></div>
                      <h4>Sin resultados</h4>
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
      <app-modal [title]="isNew ? 'Nuevo puesto' : 'Editar puesto'" eyebrow="Catálogo" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field span-2">
            <label for="nombre">Nombre *</label>
            <input id="nombre" class="input" name="nombre" [(ngModel)]="draft.nombre" [class.invalid]="submitted && !draft.nombre.trim()" />
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
            <span class="label">Nivel de riesgo</span>
            <div class="seg">
              @for (r of riesgos; track r) {
                <button type="button" [class.on]="draft.riesgo === r" (click)="draft.riesgo = r">{{ r }}</button>
              }
            </div>
          </div>
          <div class="field">
            <label for="min">Salario mínimo (RD$) *</label>
            <input id="min" type="number" min="0" step="1000" class="input" name="min" [(ngModel)]="draft.salarioMin" [class.invalid]="submitted && !(draft.salarioMin > 0)" />
          </div>
          <div class="field">
            <label for="max">Salario máximo (RD$) *</label>
            <input id="max" type="number" min="0" step="1000" class="input" name="max" [(ngModel)]="draft.salarioMax" [class.invalid]="submitted && !(draft.salarioMax >= draft.salarioMin)" />
            @if (draft.salarioMax && draft.salarioMax < draft.salarioMin) {
              <span class="hint err">Debe ser mayor o igual al mínimo.</span>
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
          <button class="btn btn-primary" type="submit" form="f" [disabled]="saving()"><app-icon name="check" [size]="16" /> Guardar</button>
        </ng-container>
      </app-modal>
    }
  `,
  styles: `
    .band {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12.5px;
      white-space: nowrap;
    }
    .band-bar {
      position: relative;
      width: 90px;
      height: 6px;
      border-radius: 4px;
      background: var(--surface-3);
    }
    .band-bar i {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 4px;
      background: var(--series-1);
    }
  `,
})
export class PuestosPage extends CrudPage<Puesto> {
  protected readonly col = this.store.puestos;
  protected readonly noun = 'Puesto';
  protected readonly riesgos = NIVELES_RIESGO;
  protected readonly departamentos = DEPARTAMENTOS;
  readonly riesgo = signal('');

  protected readonly maxSalary = computed(() => Math.max(1, ...this.col.items().map((p) => p.salarioMax)));

  protected readonly ocupacion = computed(() => {
    const m = new Map<number, number>();
    for (const e of this.store.empleados.items()) if (e.estado === 'Activo') m.set(e.puestoId, (m.get(e.puestoId) ?? 0) + 1);
    return m;
  });

  protected readonly postulaciones = computed(() => {
    const m = new Map<number, number>();
    for (const c of this.store.candidatos.items()) m.set(c.puestoId, (m.get(c.puestoId) ?? 0) + 1);
    return m;
  });

  protected readonly rows = computed(() =>
    this.col.items().filter((p) => (!this.riesgo() || p.riesgo === this.riesgo()) && matches(this.q(), p.nombre, p.departamento)),
  );

  protected blank(): Puesto {
    return { id: 0, nombre: '', departamento: DEPARTAMENTOS[0], riesgo: 'Bajo', salarioMin: 0, salarioMax: 0, estado: 'Activo' };
  }

  protected override validate(d: Puesto): string | null {
    if (!d.nombre.trim()) return 'El nombre del puesto es obligatorio.';
    if (!(d.salarioMin > 0) || !(d.salarioMax > 0)) return 'Indica la banda salarial.';
    if (d.salarioMax < d.salarioMin) return 'El salario máximo debe ser mayor o igual al mínimo.';
    return null;
  }

  protected override blockRemove(p: Puesto): string | null {
    const e = this.store.empleados.items().filter((x) => x.puestoId === p.id).length;
    const c = this.postulaciones().get(p.id) ?? 0;
    return e || c ? `Tiene ${e} empleado(s) y ${c} candidato(s) asociados. Puedes marcarlo como Inactivo.` : null;
  }
}
