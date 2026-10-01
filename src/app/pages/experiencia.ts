import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Experiencia } from '../core/models';
import { matches } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { FechaPipe, InitialsPipe, MoneyPipe } from '../shared/pipes';

@Component({
  selector: 'app-experiencia',
  imports: [FormsModule, Icon, Modal, MoneyPipe, FechaPipe, InitialsPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Reclutamiento</div>
          <h1>Experiencia laboral</h1>
          <p>Historial de empleos de los candidatos: empresa, puesto ocupado, período y salario.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="plus" /> Nueva experiencia</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Empresa, puesto o candidato…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <select class="select" [ngModel]="cand()" (ngModelChange)="cand.set(+$event)" aria-label="Candidato">
            <option [value]="0">Todos los candidatos</option>
            @for (c of store.candidatos.items(); track c.id) {
              <option [value]="c.id">{{ c.nombre }}</option>
            }
          </select>
          <span class="spacer"></span>
          <span class="count-badge">{{ rows().length }} registros</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Empresa</th>
                <th>Puesto ocupado</th>
                <th>Período</th>
                <th class="right">Salario</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (e of rows(); track e.id) {
                <tr>
                  <td>
                    <div class="person">
                      <span class="avatar">{{ candName(e.candidatoId) | initials }}</span>
                      <span class="name">{{ candName(e.candidatoId) }}</span>
                    </div>
                  </td>
                  <td><strong>{{ e.empresa }}</strong></td>
                  <td>{{ e.puesto }}</td>
                  <td class="num">
                    {{ e.fechaDesde | fecha }} – {{ e.fechaHasta ? (e.fechaHasta | fecha) : 'Actualidad' }}
                    @if (!e.fechaHasta) {
                      <span class="tag ok" style="margin-left: 6px">Actual</span>
                    }
                  </td>
                  <td class="right num">{{ e.salario | money }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" type="button" (click)="edit(e)" aria-label="Editar"><app-icon name="pencil" [size]="16" /></button>
                      <button class="icon-btn danger" type="button" (click)="remove(e, e.empresa)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <div class="empty-icon"><app-icon name="history" [size]="24" /></div>
                      <h4>Sin registros</h4>
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
      <app-modal [title]="isNew ? 'Nueva experiencia laboral' : 'Editar experiencia laboral'" eyebrow="Reclutamiento" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field span-2">
            <label for="cand">Candidato *</label>
            <select id="cand" class="select" name="cand" [ngModel]="draft.candidatoId" (ngModelChange)="draft.candidatoId = +$event" [class.invalid]="submitted && !draft.candidatoId">
              <option [value]="0" disabled>Selecciona un candidato</option>
              @for (c of store.candidatos.items(); track c.id) {
                <option [value]="c.id">{{ c.nombre }} · {{ c.cedula }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="emp">Empresa *</label>
            <input id="emp" class="input" name="empresa" [(ngModel)]="draft.empresa" [class.invalid]="submitted && !draft.empresa.trim()" />
          </div>
          <div class="field">
            <label for="pue">Puesto ocupado *</label>
            <input id="pue" class="input" name="puesto" [(ngModel)]="draft.puesto" [class.invalid]="submitted && !draft.puesto.trim()" />
          </div>
          <div class="field">
            <label for="desde">Fecha desde *</label>
            <input id="desde" type="date" class="input" name="desde" [(ngModel)]="draft.fechaDesde" [class.invalid]="submitted && !draft.fechaDesde" />
          </div>
          <div class="field">
            <label for="hasta">Fecha hasta</label>
            <input id="hasta" type="date" class="input" name="hasta" [(ngModel)]="draft.fechaHasta" />
            <span class="hint">Déjalo vacío si es el empleo actual.</span>
          </div>
          <div class="field span-2">
            <label for="sal">Salario (RD$)</label>
            <input id="sal" type="number" min="0" step="1000" class="input" name="salario" [(ngModel)]="draft.salario" />
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
export class ExperienciaPage extends CrudPage<Experiencia> {
  protected readonly col = this.store.experiencias;
  protected readonly noun = 'Experiencia';
  protected override readonly femenino = true;
  readonly cand = signal(0);

  protected candName(id: number): string {
    return this.store.candidatos.get(id)?.nombre ?? '—';
  }

  protected readonly rows = computed(() =>
    this.col
      .items()
      .filter((e) => (!this.cand() || e.candidatoId === this.cand()) && matches(this.q(), e.empresa, e.puesto, this.candName(e.candidatoId)))
      .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde)),
  );

  protected blank(): Experiencia {
    return { id: 0, candidatoId: this.cand() || 0, empresa: '', puesto: '', fechaDesde: '', fechaHasta: '', salario: 0 };
  }

  protected override validate(d: Experiencia): string | null {
    if (!d.candidatoId) return 'Selecciona el candidato.';
    if (!d.empresa.trim() || !d.puesto.trim()) return 'Empresa y puesto son obligatorios.';
    if (!d.fechaDesde) return 'Indica la fecha de inicio.';
    if (d.fechaHasta && d.fechaHasta < d.fechaDesde) return 'La fecha hasta no puede ser anterior a la fecha desde.';
    if (d.salario < 0) return 'El salario no puede ser negativo.';
    return null;
  }
}
