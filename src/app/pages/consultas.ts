import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DEPARTAMENTOS, ETAPAS, NIVELES_CAPACITACION } from '../core/models';
import { Store } from '../core/store';
import { downloadCsv, etapaTone, matches } from '../core/util';
import { Icon } from '../shared/icon';
import { InitialsPipe, MoneyPipe } from '../shared/pipes';

@Component({
  selector: 'app-consultas',
  imports: [FormsModule, RouterLink, Icon, MoneyPipe, InitialsPipe],
  templateUrl: './consultas.html',
  styles: `
    .layout {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    .filters {
      position: sticky;
      top: 84px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .filters .select,
    .filters .input {
      background-color: var(--surface);
    }
    .f-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .f-head h3 {
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chips .chip {
      height: 28px;
      font-size: 12px;
      padding: 0 10px;
    }
    .res-head {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    .res-head h3 {
      font-size: 15px;
    }
    .active-filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .results {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
      padding: 16px;
    }
    .rcard {
      padding: 16px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;
    }
    .rcard:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }
    .rcard dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 12px;
      margin: 0;
      font-size: 12.5px;
    }
    .rcard dt {
      color: var(--muted);
    }
    .rcard dd {
      margin: 0;
      font-weight: 600;
      text-align: right;
    }
    .score {
      margin-left: auto;
      font-size: 12px;
      font-weight: 700;
      color: var(--brand-ink);
      background: var(--brand-soft);
      padding: 3px 9px;
      border-radius: 99px;
      white-space: nowrap;
    }
    @media (max-width: 960px) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
      }
      .filters {
        position: static;
      }
    }
  `,
})
export class ConsultasPage {
  protected readonly store = inject(Store);
  protected readonly departamentos = DEPARTAMENTOS;
  protected readonly niveles = NIVELES_CAPACITACION;
  protected readonly etapas = ETAPAS;
  protected readonly tone = etapaTone;

  readonly texto = signal('');
  readonly puesto = signal(0);
  readonly depto = signal('');
  readonly etapa = signal('');
  readonly idioma = signal(0);
  readonly nivel = signal('');
  readonly capacitacion = signal(0);
  readonly salarioMax = signal<number | null>(null);
  readonly comps = signal<number[]>([]);
  readonly modo = signal<'todas' | 'alguna'>('alguna');

  protected toggleComp(id: number): void {
    this.comps.update((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  protected readonly activeCount = computed(
    () =>
      [this.texto(), this.puesto(), this.depto(), this.etapa(), this.idioma(), this.nivel(), this.capacitacion(), this.salarioMax()].filter(Boolean)
        .length + (this.comps().length ? 1 : 0),
  );

  protected clear(): void {
    this.texto.set('');
    this.puesto.set(0);
    this.depto.set('');
    this.etapa.set('');
    this.idioma.set(0);
    this.nivel.set('');
    this.capacitacion.set(0);
    this.salarioMax.set(null);
    this.comps.set([]);
  }

  protected readonly results = computed(() => {
    const comps = this.comps();
    const nivel = this.nivel();
    const caps = this.store.capacitaciones.byId();
    return this.store.candidatos
      .items()
      .filter((c) => {
        if (this.puesto() && c.puestoId !== this.puesto()) return false;
        if (this.depto() && c.departamento !== this.depto()) return false;
        if (this.etapa() && c.etapa !== this.etapa()) return false;
        if (this.idioma() && !c.idiomas.includes(this.idioma())) return false;
        if (this.capacitacion() && !c.capacitaciones.includes(this.capacitacion())) return false;
        if (nivel && !c.capacitaciones.some((id) => caps.get(id)?.nivel === nivel)) return false;
        const max = this.salarioMax();
        if (max && c.salarioAspira > max) return false;
        if (comps.length) {
          const ok = this.modo() === 'todas' ? comps.every((id) => c.competencias.includes(id)) : comps.some((id) => c.competencias.includes(id));
          if (!ok) return false;
        }
        return matches(this.texto(), c.nombre, c.cedula, c.recomendadoPor, this.store.puestoNombre(c.puestoId));
      })
      .map((c) => ({ c, match: comps.length ? comps.filter((id) => c.competencias.includes(id)).length : 0 }))
      .sort((a, b) => b.match - a.match || a.c.nombre.localeCompare(b.c.nombre));
  });

  protected names(ids: number[], kind: 'competencias' | 'capacitaciones' | 'idiomas'): string[] {
    return ids.map((id) => {
      if (kind === 'competencias') return this.store.competencias.get(id)?.descripcion ?? '';
      if (kind === 'capacitaciones') return this.store.capacitaciones.get(id)?.descripcion ?? '';
      return this.store.idiomas.get(id)?.nombre ?? '';
    });
  }

  protected exportar(): void {
    const rows: (string | number)[][] = [
      ['Cédula', 'Nombre', 'Puesto', 'Departamento', 'Salario aspirado', 'Etapa', 'Competencias', 'Capacitaciones', 'Idiomas', 'Recomendado por'],
    ];
    for (const { c } of this.results()) {
      rows.push([
        c.cedula,
        c.nombre,
        this.store.puestoNombre(c.puestoId),
        c.departamento,
        c.salarioAspira,
        c.etapa,
        this.names(c.competencias, 'competencias').join('; '),
        this.names(c.capacitaciones, 'capacitaciones').join('; '),
        this.names(c.idiomas, 'idiomas').join('; '),
        c.recomendadoPor,
      ]);
    }
    downloadCsv('consulta-candidatos.csv', rows);
  }
}
