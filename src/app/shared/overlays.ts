import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Icon } from './icon';
import { Ui } from './ui.service';

/** Panel modal (centrado) o lateral (drawer) con proyección de contenido. */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="ov-backdrop" (click)="closed.emit()"></div>
    <section class="ov-panel" [class.drawer]="drawer()" [class.wide]="wide()" role="dialog" aria-modal="true" [attr.aria-label]="title()">
      <header class="ov-head">
        <div>
          @if (eyebrow()) {
            <div class="eyebrow">{{ eyebrow() }}</div>
          }
          <h2>{{ title() }}</h2>
        </div>
        <button class="icon-btn" type="button" (click)="closed.emit()" aria-label="Cerrar"><app-icon name="x" /></button>
      </header>
      <div class="ov-body"><ng-content /></div>
      <footer class="ov-foot"><ng-content select="[footer]" /></footer>
    </section>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-items: center;
      padding: 16px;
    }
    .ov-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(8, 10, 24, 0.55);
      backdrop-filter: blur(6px);
      animation: fade 0.2s ease both;
    }
    .ov-panel {
      position: relative;
      width: min(560px, 100%);
      max-height: calc(100dvh - 32px);
      display: flex;
      flex-direction: column;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: var(--shadow-lg);
      animation: pop 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
    }
    .ov-panel.wide {
      width: min(760px, 100%);
    }
    .ov-panel.drawer {
      position: absolute;
      right: 12px;
      top: 12px;
      bottom: 12px;
      max-height: none;
      animation: slide 0.3s cubic-bezier(0.2, 0.9, 0.3, 1) both;
    }
    .ov-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 22px 14px;
      border-bottom: 1px solid var(--border);
    }
    .ov-head h2 {
      font-size: 19px;
      font-weight: 800;
    }
    .ov-body {
      padding: 20px 22px;
      overflow-y: auto;
      flex: 1;
    }
    .ov-foot {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 14px 22px;
      border-top: 1px solid var(--border);
      background: var(--surface-2);
      border-radius: 0 0 20px 20px;
    }
    .ov-foot:empty {
      display: none;
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.97);
      }
    }
    @keyframes slide {
      from {
        opacity: 0;
        transform: translateX(40px);
      }
    }
    @media (max-width: 600px) {
      :host {
        padding: 0;
        place-items: end stretch;
      }
      .ov-panel,
      .ov-panel.drawer,
      .ov-panel.wide {
        position: relative;
        inset: auto;
        width: 100%;
        max-height: 92dvh;
        border-radius: 20px 20px 0 0;
        animation: up 0.3s cubic-bezier(0.2, 0.9, 0.3, 1) both;
      }
      .ov-foot {
        border-radius: 0;
      }
      @keyframes up {
        from {
          transform: translateY(40px);
          opacity: 0;
        }
      }
    }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly drawer = input(false);
  readonly wide = input(false);
  readonly closed = output<void>();
}

@Component({
  selector: 'app-overlays',
  imports: [Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of ui.toasts(); track t.id) {
        <div class="toast" [class]="t.kind">
          <span class="t-icon"><app-icon [name]="t.kind === 'success' ? 'check' : t.kind === 'error' ? 'alert' : 'info'" [size]="16" /></span>
          <div class="t-text">
            <strong>{{ t.title }}</strong>
            @if (t.message) {
              <span>{{ t.message }}</span>
            }
          </div>
          <button class="icon-btn" type="button" (click)="ui.dismiss(t.id)" aria-label="Cerrar"><app-icon name="x" [size]="14" /></button>
        </div>
      }
    </div>

    @if (ui.confirmReq(); as req) {
      <app-modal [title]="req.title" (closed)="req.resolve(false)">
        <div class="confirm">
          <span class="c-icon" [class.danger]="req.danger"><app-icon [name]="req.danger ? 'alert' : 'info'" [size]="22" /></span>
          <p>{{ req.message }}</p>
        </div>
        <ng-container footer>
          <button class="btn" type="button" (click)="req.resolve(false)">Cancelar</button>
          <button class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger" type="button" (click)="req.resolve(true)">
            {{ req.confirmText }}
          </button>
        </ng-container>
      </app-modal>
    }
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(380px, calc(100vw - 32px));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 10px 12px 14px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      animation: rise 0.25s ease both;
    }
    .t-icon {
      flex: none;
      width: 28px;
      height: 28px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      color: var(--info);
      background: var(--info-soft);
    }
    .success .t-icon {
      color: var(--success);
      background: var(--success-soft);
    }
    .error .t-icon {
      color: var(--danger);
      background: var(--danger-soft);
    }
    .t-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 13px;
      padding-top: 3px;
    }
    .t-text span {
      color: var(--text-2);
    }
    .confirm {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }
    .confirm p {
      margin: 6px 0 0;
      color: var(--text-2);
    }
    .c-icon {
      flex: none;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: var(--info-soft);
      color: var(--info);
    }
    .c-icon.danger {
      background: var(--danger-soft);
      color: var(--danger);
    }
    @media (max-width: 600px) {
      .toasts {
        right: 16px;
        bottom: 16px;
      }
    }
  `,
})
export class Overlays {
  protected readonly ui = inject(Ui);
}
