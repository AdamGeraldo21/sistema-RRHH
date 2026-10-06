import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { Usuario } from './models';
import { API, Store, apiError } from './store';

const TOKEN_KEY = 'talenta.token';

interface AuthResponse {
  token: string;
  user: Usuario;
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);

  private readonly _user = signal<Usuario | null>(null);
  /** Usuario con sesión iniciada. */
  readonly user = this._user.asReadonly();
  readonly isAdmin = computed(() => this.user()?.rol === 'Administrador');
  /** true mientras se valida un token guardado al abrir la app. */
  readonly restoring = signal(false);
  private restored: Promise<void> | null = null;

  get token(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** Recupera la sesión guardada (una sola vez por carga de la app). */
  restore(): Promise<void> {
    if (!this.restored) {
      this.restored = (async () => {
        if (!this.token) return;
        this.restoring.set(true);
        try {
          this._user.set(await firstValueFrom(this.http.get<Usuario>(`${API}/auth/me`)));
        } catch (err) {
          // Un error de red no debe cerrar la sesión; un 401 sí.
          if (err instanceof HttpErrorResponse && err.status === 401) this.clearToken();
          else this.restored = null;
        } finally {
          this.restoring.set(false);
        }
      })();
    }
    return this.restored;
  }

  async login(email: string, password: string, remember: boolean): Promise<string | null> {
    try {
      const r = await firstValueFrom(this.http.post<AuthResponse>(`${API}/auth/login`, { email: email.trim(), password, remember }));
      this.startSession(r, remember);
      return null;
    } catch (err) {
      return apiError(err);
    }
  }

  /** Registro público: crea una cuenta con rol Reclutador e inicia sesión. */
  async register(nombre: string, email: string, password: string): Promise<string | null> {
    const err = this.validar({ id: 0, nombre, email, password });
    if (err) return err;
    try {
      const r = await firstValueFrom(this.http.post<AuthResponse>(`${API}/auth/register`, { nombre: nombre.trim(), email: email.trim(), password }));
      this.startSession(r, true);
      return null;
    } catch (e) {
      return apiError(e);
    }
  }

  /** Validaciones rápidas en el cliente (el servidor vuelve a validar). `password` vacío se permite al editar. */
  validar(d: { id: number; nombre: string; email: string; password: string }): string | null {
    if (!d.nombre.trim()) return 'El nombre es obligatorio.';
    if (!emailValido(d.email)) return 'El correo electrónico no es válido.';
    if ((!d.id || d.password) && d.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
  }

  logout(): void {
    this.clearToken();
    this._user.set(null);
    this.store.clear();
  }

  private startSession(r: AuthResponse, remember: boolean): void {
    this.clearToken();
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, r.token);
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
    this.memToken = r.token;
    this._user.set(r.user);
    this.restored = Promise.resolve();
  }

  /** Respaldo si el navegador bloquea el almacenamiento. */
  memToken: string | null = null;

  private clearToken(): void {
    this.memToken = null;
    for (const s of [localStorage, sessionStorage]) {
      try {
        s.removeItem(TOKEN_KEY);
      } catch {
        /* ignorar */
      }
    }
  }
}

/** Agrega el token a las peticiones de la API y cierra la sesión si el servidor la rechaza. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API)) return next(req);
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.token ?? auth.memToken;
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authReq).pipe(
    catchError((err: unknown) => {
      const esAuth = req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/me');
      if (err instanceof HttpErrorResponse && err.status === 401 && !esAuth && auth.user()) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { expirada: 1 } });
      }
      return throwError(() => err);
    }),
  );
};

// inject() solo funciona antes del primer await, por eso se resuelven las dependencias al inicio.
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.restore();
  return auth.user() ? true : router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.restore();
  return auth.user() ? router.createUrlTree(['/dashboard']) : true;
};

export const adminGuard: CanActivateFn = () => (inject(Auth).isAdmin() ? true : inject(Router).createUrlTree(['/dashboard']));
