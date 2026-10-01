import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmText: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/** Notificaciones (toasts) y diálogos de confirmación globales. */
@Injectable({ providedIn: 'root' })
export class Ui {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmReq = signal<ConfirmRequest | null>(null);
  private seq = 0;

  success(title: string, message?: string): void {
    this.push('success', title, message);
  }
  error(title: string, message?: string): void {
    this.push('error', title, message);
  }
  info(title: string, message?: string): void {
    this.push('info', title, message);
  }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  confirm(opts: { title: string; message: string; confirmText?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmReq.set({
        title: opts.title,
        message: opts.message,
        confirmText: opts.confirmText ?? 'Confirmar',
        danger: opts.danger ?? true,
        resolve: (ok) => {
          this.confirmReq.set(null);
          resolve(ok);
        },
      });
    });
  }

  private push(kind: ToastKind, title: string, message?: string): void {
    const id = ++this.seq;
    this.toasts.update((t) => [...t.slice(-3), { id, kind, title, message }]);
    setTimeout(() => this.dismiss(id), 4200);
  }
}

/** Tema claro/oscuro, persistido por usuario. */
@Injectable({ providedIn: 'root' })
export class Theme {
  readonly mode = signal<'light' | 'dark'>(this.initial());

  constructor() {
    this.apply();
  }

  toggle(): void {
    this.mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
    try {
      localStorage.setItem('talenta.theme', this.mode());
    } catch {
      /* ignorar */
    }
    this.apply();
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this.mode());
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', this.mode() === 'dark' ? '#0a0c16' : '#f5f6fb');
  }

  private initial(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem('talenta.theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignorar */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
