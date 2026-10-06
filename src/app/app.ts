import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './core/auth';
import { Theme } from './shared/ui.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (auth.restoring()) {
      <div class="boot">
        <span class="boot-logo">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <circle cx="16" cy="10" r="5" fill="#fff" />
            <path d="M6 27c0-5.5 4.5-9 10-9s10 3.5 10 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" />
          </svg>
        </span>
        <strong>Talenta RH</strong>
        <span class="muted">Verificando tu sesión…</span>
      </div>
    }
    <router-outlet />
  `,
  styles: `
    .boot {
      position: fixed;
      inset: 0;
      z-index: 300;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: var(--bg);
      font-family: var(--font-display);
    }
    .boot strong {
      font-size: 20px;
    }
    .boot .muted {
      font-family: var(--font);
      font-size: 13px;
    }
    .boot-logo {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      display: grid;
      place-items: center;
      background: var(--grad);
      box-shadow: 0 16px 32px -12px rgba(124, 92, 255, 0.9);
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      50% {
        transform: scale(0.92);
        opacity: 0.8;
      }
    }
  `,
})
export class App {
  protected readonly auth = inject(Auth);

  constructor() {
    inject(Theme);
  }
}
