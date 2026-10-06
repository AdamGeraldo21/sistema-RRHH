import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Idioma } from '../core/models';
import { matches } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';

@Component({
  selector: 'app-idiomas',
  imports: [FormsModule, Icon, Modal],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Catálogos</div>
          <h1>Idiomas</h1>
          <p>Idiomas disponibles para registrar en el perfil de los candidatos.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="plus" /> Nuevo idioma</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Buscar idioma…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <span class="spacer"></span>
          <span class="count-badge">{{ rows().length }} registros</span>
        </div>
        <div class="lang-grid">
          @for (i of rows(); track i.id) {
            <article class="lang">
              <div class="lang-top">
                <span class="lang-code">{{ i.nombre.slice(0, 2).toUpperCase() }}</span>
                <span class="tag" [class.ok]="i.estado === 'Activo'" [class.bad]="i.estado !== 'Activo'">{{ i.estado }}</span>
              </div>
              <h3>{{ i.nombre }}</h3>
              <div class="muted lang-meta">#{{ i.id }} · {{ uso().get(i.id) ?? 0 }} candidato(s)</div>
              <div class="lang-actions">
                <button class="btn btn-sm" type="button" (click)="edit(i)"><app-icon name="pencil" [size]="14" /> Editar</button>
                <button class="icon-btn danger" type="button" (click)="remove(i, i.nombre)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
              </div>
            </article>
          } @empty {
            <div class="empty" style="grid-column:1/-1">
              <div class="empty-icon"><app-icon name="languages" [size]="24" /></div>
              <h4>Sin resultados</h4>
            </div>
          }
        </div>
      </div>
    </div>

    @if (formOpen()) {
      <app-modal [title]="isNew ? 'Nuevo idioma' : 'Editar idioma'" eyebrow="Catálogo" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field span-2">
            <label for="nombre">Nombre *</label>
            <input id="nombre" class="input" name="nombre" [(ngModel)]="draft.nombre" [class.invalid]="submitted && !draft.nombre.trim()" autofocus />
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
    .lang-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 14px;
      padding: 16px;
    }
    .lang {
      padding: 16px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }
    .lang:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }
    .lang-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .lang-code {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-family: var(--font-display);
      color: #fff;
      background: var(--grad-cool);
    }
    h3 {
      font-size: 16px;
      margin-top: 14px;
    }
    .lang-meta {
      font-size: 12px;
    }
    .lang-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
    }
  `,
})
export class IdiomasPage extends CrudPage<Idioma> {
  protected readonly col = this.store.idiomas;
  protected readonly noun = 'Idioma';

  protected readonly uso = computed(() => {
    const m = new Map<number, number>();
    for (const c of this.store.candidatos.items()) for (const id of c.idiomas) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  });

  protected readonly rows = computed(() => this.col.items().filter((i) => matches(this.q(), i.nombre)));

  protected blank(): Idioma {
    return { id: 0, nombre: '', estado: 'Activo' };
  }

  protected override validate(d: Idioma): string | null {
    if (!d.nombre.trim()) return 'El nombre es obligatorio.';
    const dup = this.col.items().some((i) => i.id !== d.id && i.nombre.trim().toLowerCase() === d.nombre.trim().toLowerCase());
    return dup ? 'Ese idioma ya está registrado.' : null;
  }

  protected override blockRemove(i: Idioma): string | null {
    const n = this.uso().get(i.id) ?? 0;
    return n ? `Está asignado a ${n} candidato(s). Puedes marcarlo como Inactivo.` : null;
  }
}
