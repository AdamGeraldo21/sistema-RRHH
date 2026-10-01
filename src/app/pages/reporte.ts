import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DEPARTAMENTOS } from '../core/models';
import { Store } from '../core/store';
import { downloadCsv, fecha, today } from '../core/util';
import { BarChart, BarDatum } from '../shared/bar-chart';
import { Icon } from '../shared/icon';
import { FechaPipe, InitialsPipe, MoneyPipe } from '../shared/pipes';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-reporte',
  imports: [FormsModule, Icon, BarChart, MoneyPipe, FechaPipe, InitialsPipe],
  templateUrl: './reporte.html',
  styles: `
    .filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .filters .field {
      min-width: 160px;
    }
    .filters .input,
    .filters .select {
      background-color: var(--surface);
    }
    .presets {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .print-head {
      margin-bottom: 12px;
    }
    .print-head h2 {
      font-size: 20px;
    }
  `,
})
export class ReportePage {
  protected readonly store = inject(Store);
  protected readonly departamentos = DEPARTAMENTOS;

  readonly desde = signal(`${new Date().getFullYear()}-01-01`);
  readonly hasta = signal(today());
  readonly depto = signal('');
  readonly soloActivos = signal(false);
  readonly preset = signal('anio');
  protected readonly generado = new Date().toLocaleString('es-DO');

  protected setPreset(p: string): void {
    const now = new Date();
    this.preset.set(p);
    this.hasta.set(iso(now));
    if (p === 'mes') this.desde.set(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
    if (p === 'trimestre') this.desde.set(iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
    if (p === 'anio') this.desde.set(`${now.getFullYear()}-01-01`);
    if (p === '12m') this.desde.set(iso(new Date(now.getFullYear(), now.getMonth() - 11, 1)));
  }

  protected readonly rangoInvalido = computed(() => !!this.desde() && !!this.hasta() && this.hasta() < this.desde());

  protected readonly rows = computed(() => {
    const d = this.desde();
    const h = this.hasta();
    return this.store.empleados
      .items()
      .filter(
        (e) =>
          (!d || e.fechaIngreso >= d) &&
          (!h || e.fechaIngreso <= h) &&
          (!this.depto() || e.departamento === this.depto()) &&
          (!this.soloActivos() || e.estado === 'Activo'),
      )
      .sort((a, b) => a.fechaIngreso.localeCompare(b.fechaIngreso));
  });

  protected readonly total = computed(() => this.rows().reduce((s, e) => s + e.salario, 0));
  protected readonly deptos = computed(() => new Set(this.rows().map((e) => e.departamento)).size);
  protected readonly viaSeleccion = computed(() => this.rows().filter((e) => e.candidatoId).length);

  protected readonly porMes = computed<BarDatum[]>(() => {
    const d = this.desde();
    const h = this.hasta();
    if (!d || !h || h < d) return [];
    const out: BarDatum[] = [];
    let y = Number(d.slice(0, 4));
    let m = Number(d.slice(5, 7)) - 1;
    const endKey = h.slice(0, 7);
    for (let guard = 0; guard < 36; guard++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (key > endKey) break;
      const list = this.rows().filter((e) => e.fechaIngreso.startsWith(key));
      out.push({ label: `${MESES[m]} ${String(y).slice(2)}`, value: list.length, detail: list.map((e) => e.nombre.split(' ')[0]).join(', ') });
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return out;
  });

  protected imprimir(): void {
    window.print();
  }

  protected exportar(): void {
    const rows: (string | number)[][] = [['ID', 'Cédula', 'Nombre', 'Fecha de ingreso', 'Departamento', 'Puesto', 'Salario mensual', 'Estado']];
    for (const e of this.rows()) {
      rows.push([e.id, e.cedula, e.nombre, e.fechaIngreso, e.departamento, this.store.puestoNombre(e.puestoId), e.salario, e.estado]);
    }
    rows.push([]);
    rows.push(['', '', 'Total', '', '', '', this.total(), '']);
    downloadCsv(`reporte-nuevo-ingreso_${this.desde()}_${this.hasta()}.csv`, rows);
  }

  protected fechaLarga(d: string): string {
    return fecha(d);
  }
}
