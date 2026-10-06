import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../core/auth';
import { Icon } from '../shared/icon';
import { Overlays } from '../shared/overlays';
import { Theme, Ui } from '../shared/ui.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Icon, Overlays],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  private readonly auth = inject(Auth);
  private readonly ui = inject(Ui);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly theme = inject(Theme);

  readonly modo = signal<'login' | 'registro'>('login');
  readonly verPass = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  email = '';
  password = '';
  remember = true;

  nombre = '';
  regEmail = '';
  regPass = '';
  regPass2 = '';

  protected readonly demos = [
    { rol: 'Administrador', email: 'admin@talenta.do', pass: 'admin123' },
    { rol: 'Reclutador', email: 'reclutador@talenta.do', pass: 'demo123' },
  ];

  /** true si la petición tarda (p. ej. el servidor gratuito de Render está despertando). */
  readonly lento = signal(false);
  private lentoTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (this.route.snapshot.queryParamMap.has('expirada')) this.error.set('Tu sesión expiró. Inicia sesión nuevamente.');
  }

  private empezar(): void {
    this.cargando.set(true);
    this.lentoTimer = setTimeout(() => this.lento.set(true), 4000);
  }

  private terminar(): void {
    clearTimeout(this.lentoTimer);
    this.cargando.set(false);
    this.lento.set(false);
  }

  protected cambiar(m: 'login' | 'registro'): void {
    this.modo.set(m);
    this.error.set(null);
  }

  protected usarDemo(d: { email: string; pass: string }): void {
    this.cambiar('login');
    this.email = d.email;
    this.password = d.pass;
  }

  protected async entrar(): Promise<void> {
    if (!this.email.trim() || !this.password) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }
    this.empezar();
    const err = await this.auth.login(this.email, this.password, this.remember);
    this.terminar();
    if (err) {
      this.error.set(err);
      return;
    }
    this.ui.success(`¡Bienvenido, ${this.auth.user()!.nombre.split(' ')[0]}!`, 'Sesión iniciada correctamente.');
    this.irAdentro();
  }

  protected async registrar(): Promise<void> {
    if (this.regPass !== this.regPass2) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.empezar();
    const err = await this.auth.register(this.nombre, this.regEmail, this.regPass);
    this.terminar();
    if (err) {
      this.error.set(err);
      return;
    }
    this.ui.success('Cuenta creada', 'Tu usuario se registró con el rol Reclutador.');
    this.irAdentro();
  }

  private irAdentro(): void {
    const volver = this.route.snapshot.queryParamMap.get('volver');
    this.router.navigateByUrl(volver && volver.startsWith('/') && !volver.startsWith('/login') ? volver : '/dashboard');
  }
}
