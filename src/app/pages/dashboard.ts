import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ETAPAS } from '../core/models';
import { Store } from '../core/store';
import { etapaTone, moneyShort } from '../core/util';
import { BarChart, BarDatum } from '../shared/bar-chart';
import { Icon } from '../shared/icon';
import { FechaPipe, InitialsPipe, MoneyPipe } from '../shared/pipes';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface HBar {
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon, BarChart, MoneyPipe, FechaPipe, InitialsPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  protected readonly store = inject(Store);
  protected readonly tone = etapaTone;
  protected readonly short = moneyShort;

  protected readonly saludo = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();
  protected readonly hoy = (() => {
    const s = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  private readonly activos = computed(() => this.store.empleados.items().filter((e) => e.estado === 'Activo'));

  protected readonly kpis = computed(() => {
    const cands = this.store.candidatos.items();
    const enProceso = cands.filter((c) => !['Contratado', 'Descartado'].includes(c.etapa)).length;
    const ofertas = cands.filter((c) => c.etapa === 'Oferta').length;
    const nomina = this.activos().reduce((s, e) => s + e.salario, 0);
    const now = new Date();
    const mesKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nuevosMes = this.store.empleados.items().filter((e) => e.fechaIngreso.startsWith(mesKey)).length;
    return {
      empleados: this.activos().length,
      nuevosMes,
      enProceso,
      ofertas,
      puestos: this.store.puestosActivos().length,
      nomina,
    };
  });

  protected readonly ingresos = computed<BarDatum[]>(() => {
    const now = new Date();
    const out: BarDatum[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const list = this.store.empleados.items().filter((e) => e.fechaIngreso.startsWith(key));
      out.push({ label: MESES[d.getMonth()]!, value: list.length, detail: `${MESES[d.getMonth()]} ${d.getFullYear()}` });
    }
    return out;
  });

  protected readonly embudo = computed<HBar[]>(() =>
    ETAPAS.map((e) => ({ label: e, value: this.store.candidatos.items().filter((c) => c.etapa === e).length })),
  );

  protected readonly porDepto = computed<HBar[]>(() => {
    const m = new Map<string, number>();
    for (const e of this.activos()) m.set(e.departamento, (m.get(e.departamento) ?? 0) + 1);
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  });

  protected readonly topComp = computed<HBar[]>(() => {
    const m = new Map<number, number>();
    for (const c of this.store.candidatos.items()) for (const id of c.competencias) m.set(id, (m.get(id) ?? 0) + 1);
    return [...m]
      .map(([id, value]) => ({ label: this.store.competencias.get(id)?.descripcion ?? '', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  });

  protected readonly recientes = computed(() =>
    [...this.store.candidatos.items()].sort((a, b) => b.fechaPostulacion.localeCompare(a.fechaPostulacion)).slice(0, 5),
  );

  protected max(list: HBar[]): number {
    return Math.max(1, ...list.map((x) => x.value));
  }
}
