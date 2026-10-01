import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from './store';
import { today } from './util';

const SESSION_KEY = 'talenta.session';

/** Hash SHA-256 de `email:contraseña`. Es una demo sin backend: no sustituye una autenticación real. */
export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.trim().toLowerCase()}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly store = inject(Store);
  private readonly sessionId = signal<number | null>(this.readSession());

  /** Usuario con sesión iniciada (null si no hay sesión o la cuenta ya no está activa). */
  readonly user = computed(() => {
    const u = this.store.usuarios.get(this.sessionId());
    return u && u.estado === 'Activo' ? u : null;
  });
  readonly isAdmin = computed(() => this.user()?.rol === 'Administrador');

  async login(email: string, password: string, remember: boolean): Promise<string | null> {
    const correo = email.trim().toLowerCase();
    const u = this.store.usuarios.items().find((x) => x.email.toLowerCase() === correo);
    if (!u || u.passwordHash !== (await hashPassword(correo, password))) return 'Correo o contraseña incorrectos.';
    if (u.estado !== 'Activo') return 'Esta cuenta está inactiva. Contacta a un administrador.';
    this.store.usuarios.patch(u.id, { ultimoAcceso: new Date().toISOString() });
    this.startSession(u.id, remember);
    return null;
  }

  /** Registro público: crea una cuenta con rol Reclutador e inicia sesión. */
  async register(nombre: string, email: string, password: string): Promise<string | null> {
    const correo = email.trim().toLowerCase();
    const err = this.validar({ nombre, email: correo, password, id: 0 });
    if (err) return err;
    const u = this.store.usuarios.save({
      id: 0,
      nombre: nombre.trim(),
      email: correo,
      passwordHash: await hashPassword(correo, password),
      rol: 'Reclutador',
      estado: 'Activo',
      creado: today(),
      ultimoAcceso: new Date().toISOString(),
    });
    this.startSession(u.id, true);
    return null;
  }

  /** Validaciones comunes de cuenta. `password` vacío se permite al editar (se conserva la actual). */
  validar(d: { id: number; nombre: string; email: string; password: string }): string | null {
    if (!d.nombre.trim()) return 'El nombre es obligatorio.';
    if (!emailValido(d.email)) return 'El correo electrónico no es válido.';
    const correo = d.email.trim().toLowerCase();
    if (this.store.usuarios.items().some((u) => u.id !== d.id && u.email.toLowerCase() === correo)) {
      return 'Ya existe una cuenta con ese correo.';
    }
    if ((!d.id || d.password) && d.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  }

  logout(): void {
    this.sessionId.set(null);
    for (const s of [localStorage, sessionStorage]) {
      try {
        s.removeItem(SESSION_KEY);
      } catch {
        /* ignorar */
      }
    }
  }

  private startSession(id: number, remember: boolean): void {
    this.logout();
    this.sessionId.set(id);
    try {
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, String(id));
    } catch {
      /* sesión solo en memoria */
    }
  }

  private readSession(): number | null {
    try {
      const v = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  }
}

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  return auth.user() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { volver: state.url } });
};

export const guestGuard: CanActivateFn = () => (inject(Auth).user() ? inject(Router).createUrlTree(['/dashboard']) : true);

export const adminGuard: CanActivateFn = () => (inject(Auth).isAdmin() ? true : inject(Router).createUrlTree(['/dashboard']));
