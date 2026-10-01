import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Capacitacion, NIVELES_CAPACITACION } from '../core/models';
import { matches } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { FechaPipe } from '../shared/pipes';

@Component({
  selector: 'app-capacitaciones',
  imports: [FormsModule, Icon, Modal, FechaPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Catálogos</div>
          <h1>Capacitaciones</h1>
          <p>Formación académica y técnica: grados, post-grados, maestrías, doctorados, técnicos y gestión.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="plus" /> Nueva capacitación</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Buscar por descripción o institución…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <select class="select" [ngModel]="nivel()" (ngModelChange)="nivel.set($event)" aria-label="Nivel">
            <option value="">Todos los niveles</option>
            @for (n of niveles; track n) {
              <option [value]="n">{{ n }}</option>
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
                <th>Descripción</th>
                <th>Nivel</th>
                <th>Institución</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of rows(); track c.id) {
                <tr>
                  <td class="muted num">#{{ c.id }}</td>
                  <td><strong>{{ c.descripcion }}</strong></td>
                  <td><span class="tag brand plain">{{ c.nivel }}</span></td>
                  <td>{{ c.institucion }}</td>
                  <td class="num">{{ c.fechaDesde | fecha }}</td>
                  <td class="num">{{ c.fechaHasta | fecha }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" type="button" (click)="edit(c)" aria-label="Editar"><app-icon name="pencil" [size]="16" /></button>
                      <button class="icon-btn danger" type="button" (click)="remove(c, c.descripcion)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7">
                    <div class="empty">
                      <div class="empty-icon"><app-icon name="cap" [size]="24" /></div>
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
      <app-modal [title]="isNew ? 'Nueva capacitación' : 'Editar capacitación'" eyebrow="Catálogo" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field span-2">
            <label for="desc">Descripción *</label>
            <input id="desc" class="input" name="descripcion" [(ngModel)]="draft.descripcion" [class.invalid]="submitted && !draft.descripcion.trim()" />
          </div>
          <div class="field">
            <label for="nivel">Nivel</label>
            <select id="nivel" class="select" name="nivel" [(ngModel)]="draft.nivel">
              @for (n of niveles; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="inst">Institución *</label>
            <input id="inst" class="input" name="institucion" [(ngModel)]="draft.institucion" [class.invalid]="submitted && !draft.institucion.trim()" />
          </div>
          <div class="field">
            <label for="desde">Fecha desde *</label>
            <input id="desde" type="date" class="input" name="desde" [(ngModel)]="draft.fechaDesde" [class.invalid]="submitted && !draft.fechaDesde" />
          </div>
          <div class="field">
            <label for="hasta">Fecha hasta *</label>
            <input id="hasta" type="date" class="input" name="hasta" [(ngModel)]="draft.fechaHasta" [class.invalid]="submitted && (!draft.fechaHasta || draft.fechaHasta < draft.fechaDesde)" />
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
export class CapacitacionesPage extends CrudPage<Capacitacion> {
  protected readonly col = this.store.capacitaciones;
  protected readonly noun = 'Capacitación';
  protected override readonly femenino = true;
  protected readonly niveles = NIVELES_CAPACITACION;
  readonly nivel = signal('');

  protected readonly rows = computed(() =>
    this.col
      .items()
      .filter((c) => (!this.nivel() || c.nivel === this.nivel()) && matches(this.q(), c.descripcion, c.institucion, c.nivel)),
  );

  protected blank(): Capacitacion {
    return { id: 0, descripcion: '', nivel: 'Grado', fechaDesde: '', fechaHasta: '', institucion: '' };
  }

  protected override validate(d: Capacitacion): string | null {
    if (!d.descripcion.trim() || !d.institucion.trim()) return 'Descripción e institución son obligatorias.';
    if (!d.fechaDesde || !d.fechaHasta) return 'Indica el rango de fechas.';
    if (d.fechaHasta < d.fechaDesde) return 'La fecha hasta no puede ser anterior a la fecha desde.';
    return null;
  }

  protected override blockRemove(c: Capacitacion): string | null {
    const n = this.store.candidatos.items().filter((x) => x.capacitaciones.includes(c.id)).length;
    return n ? `Está asignada a ${n} candidato(s).` : null;
  }
}
