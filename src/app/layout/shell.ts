import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Auth } from '../core/auth';
import { Store } from '../core/store';
import { Icon } from '../shared/icon';
import { Overlays } from '../shared/overlays';
import { InitialsPipe } from '../shared/pipes';
import { Theme, Ui } from '../shared/ui.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: () => number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Overlays, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeinstallprompt)': 'onInstallPrompt($event)' },
  template: `
    <aside class="sidebar" [class.open]="menuOpen()">
      <a class="brand" routerLink="/dashboard" (click)="menuOpen.set(false)">
        <span class="logo">
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
            <circle cx="16" cy="10" r="5" fill="#fff" />
            <path d="M6 27c0-5.5 4.5-9 10-9s10 3.5 10 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-text">
          <strong>Talenta RH</strong>
          <small>Reclutamiento &amp; Selección</small>
        </span>
      </a>

      <nav>
        @for (group of navGroups(); track group.title) {
          <div class="nav-group">
            <div class="nav-title">{{ group.title }}</div>
            @for (item of group.items; track item.path) {
              <a class="nav-item" [routerLink]="item.path" routerLinkActive="active" (click)="menuOpen.set(false)">
                <app-icon [name]="item.icon" [size]="18" />
                <span>{{ item.label }}</span>
                @if (item.badge && item.badge() > 0) {
                  <em class="badge">{{ item.badge() }}</em>
                }
              </a>
            }
          </div>
        }
      </nav>

      <div class="side-card">
        <div class="sc-title"><app-icon name="shield" [size]="16" /> Modo demostración</div>
        <p>Los datos son simulados y se guardan en este navegador.</p>
        <button class="btn btn-sm" type="button" (click)="resetData()"><app-icon name="refresh" [size]="14" /> Restaurar datos</button>
      </div>
    </aside>
    @if (menuOpen()) {
      <div class="scrim" (click)="menuOpen.set(false)"></div>
    }

    <div class="shell-main">
      <header class="topbar">
        <button class="icon-btn menu-btn" type="button" (click)="menuOpen.set(true)" aria-label="Abrir menú"><app-icon name="menu" /></button>
        <div class="crumbs">
          <span class="muted">Talenta RH</span>
          <app-icon name="chevron-right" [size]="14" />
          <strong>{{ section() }}</strong>
        </div>
        <div class="top-actions">
          @if (installEvt()) {
            <button class="btn btn-sm install" type="button" (click)="install()"><app-icon name="install" [size]="15" /> Instalar app</button>
          }
          <button class="icon-btn" type="button" (click)="theme.toggle()" [attr.aria-label]="theme.mode() === 'dark' ? 'Modo claro' : 'Modo oscuro'">
            <app-icon [name]="theme.mode() === 'dark' ? 'sun' : 'moon'" />
          </button>
          @if (auth.user(); as u) {
            <div class="me-wrap">
              <button class="me" type="button" (click)="userMenu.set(!userMenu())" [attr.aria-expanded]="userMenu()" aria-haspopup="menu">
                <span class="avatar">{{ u.nombre | initials }}</span>
                <span class="me-text">
                  <strong>{{ u.nombre }}</strong>
                  <small>{{ u.rol }}</small>
                </span>
                <app-icon name="chevron-down" [size]="15" />
              </button>
              @if (userMenu()) {
                <div class="menu-scrim" (click)="userMenu.set(false)"></div>
                <div class="menu" role="menu">
                  <div class="menu-head">
                    <span class="avatar lg">{{ u.nombre | initials }}</span>
                    <div>
                      <strong>{{ u.nombre }}</strong>
                      <small>{{ u.email }}</small>
                      <span class="tag brand plain">{{ u.rol }}</span>
                    </div>
                  </div>
                  @if (auth.isAdmin()) {
                    <a class="menu-item" role="menuitem" routerLink="/usuarios" (click)="userMenu.set(false)"><app-icon name="users" [size]="16" /> Gestionar usuarios</a>
                  }
                  <button class="menu-item danger" role="menuitem" type="button" (click)="logout()"><app-icon name="logout" [size]="16" /> Cerrar sesión</button>
                </div>
              }
            </div>
          }
        </div>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
    <app-overlays />
  `,
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly theme = inject(Theme);
  private readonly ui = inject(Ui);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly auth = inject(Auth);
  protected readonly menuOpen = signal(false);
  protected readonly userMenu = signal(false);
  protected readonly installEvt = signal<BeforeInstallPromptEvent | null>(null);

  private readonly enProceso = computed(
    () => this.store.candidatos.items().filter((c) => c.etapa !== 'Contratado' && c.etapa !== 'Descartado').length,
  );

  protected readonly nav: { title: string; items: NavItem[] }[] = [
    { title: 'General', items: [{ path: '/dashboard', label: 'Panel principal', icon: 'dashboard' }] },
    {
      title: 'Catálogos',
      items: [
        { path: '/competencias', label: 'Competencias', icon: 'sparkles' },
        { path: '/idiomas', label: 'Idiomas', icon: 'languages' },
        { path: '/capacitaciones', label: 'Capacitaciones', icon: 'cap' },
        { path: '/puestos', label: 'Puestos', icon: 'briefcase' },
      ],
    },
    {
      title: 'Reclutamiento',
      items: [
        { path: '/candidatos', label: 'Candidatos', icon: 'users' },
        { path: '/experiencia', label: 'Experiencia laboral', icon: 'history' },
        { path: '/seleccion', label: 'Proceso de selección', icon: 'kanban', badge: () => this.enProceso() },
      ],
    },
    { title: 'Personal', items: [{ path: '/empleados', label: 'Empleados', icon: 'idcard' }] },
    {
      title: 'Análisis',
      items: [
        { path: '/consultas', label: 'Consulta por criterios', icon: 'search' },
        { path: '/reporte', label: 'Reporte de ingresos', icon: 'report' },
      ],
    },
  ];

  protected readonly navGroups = computed(() =>
    this.auth.isAdmin()
      ? [...this.nav, { title: 'Administración', items: [{ path: '/usuarios', label: 'Usuarios', icon: 'shield' }] }]
      : this.nav,
  );

  protected async logout(): Promise<void> {
    this.userMenu.set(false);
    const ok = await this.ui.confirm({
      title: 'Cerrar sesión',
      message: '¿Deseas cerrar tu sesión en Talenta RH?',
      confirmText: 'Cerrar sesión',
      danger: false,
    });
    if (!ok) return;
    const nombre = this.auth.user()?.nombre.split(' ')[0] ?? '';
    this.auth.logout();
    await this.router.navigateByUrl('/login');
    this.ui.info('Sesión cerrada', `Hasta pronto, ${nombre}.`);
  }

  protected readonly section = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.currentTitle()),
    ),
    { initialValue: this.currentTitle() },
  );

  private currentTitle(): string {
    let r = this.route.snapshot;
    while (r.firstChild) r = r.firstChild;
    return (r.data['title'] as string) ?? '';
  }

  protected onInstallPrompt(e: Event): void {
    e.preventDefault();
    this.installEvt.set(e as BeforeInstallPromptEvent);
  }

  protected async install(): Promise<void> {
    await this.installEvt()?.prompt();
    this.installEvt.set(null);
  }

  protected async resetData(): Promise<void> {
    const ok = await this.ui.confirm({
      title: 'Restaurar datos de demostración',
      message: 'Se perderán todos los cambios realizados y se cargarán los datos iniciales.',
      confirmText: 'Restaurar',
    });
    if (!ok) return;
    this.store.resetAll();
    this.menuOpen.set(false);
    this.ui.success('Datos restaurados', 'Se cargaron nuevamente los datos de demostración.');
  }
}
