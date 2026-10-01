import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
  /** Texto detallado para el tooltip. */
  detail?: string;
}

/** Columnas verticales de una sola serie con tooltip al pasar el cursor. */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart" [style.height.px]="height()" role="img" [attr.aria-label]="ariaLabel()">
      <div class="grid">
        @for (t of ticks(); track t) {
          <div class="gl" [style.bottom.%]="(t / scaleMax()) * 100">
            <span>{{ t }}</span>
          </div>
        }
      </div>
      <div class="cols">
        @for (d of data(); track d.label; let i = $index) {
          <div class="col" (mouseenter)="hover.set(i)" (mouseleave)="hover.set(-1)" (focus)="hover.set(i)" (blur)="hover.set(-1)" tabindex="0">
            <div class="bar-area">
              <div class="bar" [class.dim]="hover() !== -1 && hover() !== i" [style.height.%]="(d.value / scaleMax()) * 100"></div>
              @if (hover() === i) {
                <div class="tip" [style.bottom.%]="(d.value / scaleMax()) * 100">
                  <b>{{ d.value }}</b> {{ unit() }}
                  @if (d.detail) {
                    <div class="d">{{ d.detail }}</div>
                  }
                </div>
              }
            </div>
            <span class="lbl">{{ d.label }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .chart {
      position: relative;
      padding: 8px 0 0 28px;
    }
    .grid {
      position: absolute;
      left: 28px;
      right: 0;
      top: 8px;
      bottom: 26px;
    }
    .gl {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--border);
    }
    .gl span {
      position: absolute;
      left: -28px;
      top: -8px;
      width: 22px;
      text-align: right;
      font-size: 11px;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .cols {
      position: relative;
      display: flex;
      gap: 6px;
      height: 100%;
    }
    .col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      outline: none;
      cursor: default;
    }
    .bar-area {
      position: relative;
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .bar {
      width: min(28px, 70%);
      min-height: 2px;
      border-radius: 4px 4px 0 0;
      background: var(--series-1);
      transition:
        height 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
        opacity 0.15s ease;
    }
    .bar.dim {
      opacity: 0.45;
    }
    .tip {
      left: 50%;
      opacity: 1;
      margin-bottom: 8px;
      text-align: center;
    }
    .tip .d {
      opacity: 0.75;
      font-size: 11px;
    }
    .lbl {
      height: 26px;
      line-height: 26px;
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class BarChart {
  readonly data = input.required<BarDatum[]>();
  readonly height = input(220);
  readonly unit = input('');
  readonly ariaLabel = input('Gráfico de barras');
  protected readonly hover = signal(-1);

  protected readonly scaleMax = computed(() => {
    const max = Math.max(1, ...this.data().map((d) => d.value));
    const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4);
    return Math.ceil(max / step) * step;
  });

  protected readonly ticks = computed(() => {
    const m = this.scaleMax();
    const step = m <= 4 ? 1 : m / 4;
    const out: number[] = [];
    for (let v = 0; v <= m + 0.001; v += step) out.push(Math.round(v));
    return out;
  });
}
