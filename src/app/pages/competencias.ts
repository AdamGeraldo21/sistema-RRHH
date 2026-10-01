import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Competencia, TIPOS_COMPETENCIA } from '../core/models';
import { matches } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';

@Component({
  selector: 'app-competencias',
  imports: [FormsModule, Icon, Modal],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Catálogos</div>
          <h1>Competencias</h1>
          <p>Habilidades organizacionales, técnicas y operativas que se evalúan en los candidatos.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="plus" /> Nueva competencia</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Buscar competencia…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <select class="select" [ngModel]="tipo()" (ngModelChange)="tipo.set($event)" aria-label="Tipo">
            <option value="">Todos los tipos</option>
            @for (t of tipos; track t) {
              <option [value]="t">{{ t }}</option>
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
                <th>Tipo</th>
                <th>Candidatos</th>
                <th>Estado</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of rows(); track c.id) {
                <tr>
                  <td class="muted num">#{{ c.id }}</td>
                  <td><strong>{{ c.descripcion }}</strong></td>
                  <td><span class="tag plain">{{ c.tipo }}</span></td>
                  <td class="num">{{ uso().get(c.id) ?? 0 }}</td>
                  <td>
                    <span class="tag" [class.ok]="c.estado === 'Activo'" [class.bad]="c.estado !== 'Activo'">{{ c.estado }}</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" type="button" (click)="edit(c)" aria-label="Editar"><app-icon name="pencil" [size]="16" /></button>
                      <button class="icon-btn danger" type="button" (click)="remove(c, c.descripcion)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <div class="empty-icon"><app-icon name="sparkles" [size]="24" /></div>
                      <h4>Sin resultados</h4>
                      Ajusta la búsqueda o agrega una nueva competencia.
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
      <app-modal [title]="isNew ? 'Nueva competencia' : 'Editar competencia'" eyebrow="Catálogo" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field span-2">
            <label for="desc">Descripción *</label>
            <input id="desc" class="input" name="descripcion" [(ngModel)]="draft.descripcion" [class.invalid]="submitted && !draft.descripcion.trim()" autofocus />
          </div>
          <div class="field">
            <label for="tipo">Tipo</label>
            <select id="tipo" class="select" name="tipo" [(ngModel)]="draft.tipo">
              @for (t of tipos; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>
          <div class="field">
            <span class="label">Estado</span>
            <label class="switch" style="height:42px">
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
export class CompetenciasPage extends CrudPage<Competencia> {
  protected readonly col = this.store.competencias;
  protected readonly noun = 'Competencia';
  protected override readonly femenino = true;
  protected readonly tipos = TIPOS_COMPETENCIA;
  readonly tipo = signal('');

  protected readonly uso = computed(() => {
    const m = new Map<number, number>();
    for (const c of this.store.candidatos.items()) for (const id of c.competencias) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  });

  protected readonly rows = computed(() =>
    this.col.items().filter((c) => (!this.tipo() || c.tipo === this.tipo()) && matches(this.q(), c.descripcion, c.tipo, c.id)),
  );

  protected blank(): Competencia {
    return { id: 0, descripcion: '', tipo: 'Técnica', estado: 'Activo' };
  }

  protected override validate(d: Competencia): string | null {
    if (!d.descripcion.trim()) return 'La descripción es obligatoria.';
    const dup = this.col.items().some((c) => c.id !== d.id && c.descripcion.trim().toLowerCase() === d.descripcion.trim().toLowerCase());
    return dup ? 'Ya existe una competencia con esa descripción.' : null;
  }

  protected override blockRemove(c: Competencia): string | null {
    const n = this.uso().get(c.id) ?? 0;
    return n ? `Está asignada a ${n} candidato(s). Puedes marcarla como Inactiva.` : null;
  }
}
