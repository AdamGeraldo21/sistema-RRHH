import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../core/auth';
import { ROLES, Usuario } from '../core/models';
import { matches, today } from '../core/util';
import { CrudPage } from '../shared/crud-page';
import { Icon } from '../shared/icon';
import { Modal } from '../shared/overlays';
import { FechaPipe, InitialsPipe } from '../shared/pipes';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, Icon, Modal, FechaPipe, InitialsPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="eyebrow">Administración</div>
          <h1>Usuarios</h1>
          <p>Cuentas con acceso al sistema. Los administradores pueden gestionar usuarios; los reclutadores no.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="create()"><app-icon name="userplus" /> Nuevo usuario</button>
      </div>

      <div class="card">
        <div class="toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input class="input" placeholder="Nombre o correo…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
          <select class="select" [ngModel]="rol()" (ngModelChange)="rol.set($event)" aria-label="Rol">
            <option value="">Todos los roles</option>
            @for (r of roles; track r) {
              <option [value]="r">{{ r }}</option>
            }
          </select>
          <span class="spacer"></span>
          <span class="count-badge">{{ rows().length }} usuarios</span>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Creado</th>
                <th>Último acceso</th>
                <th>Estado</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (u of rows(); track u.id) {
                <tr>
                  <td>
                    <div class="person">
                      <span class="avatar">{{ u.nombre | initials }}</span>
                      <div>
                        <div class="name">
                          {{ u.nombre }}
                          @if (u.id === auth.user()?.id) {
                            <span class="tag info plain" style="height: 20px; font-size: 10.5px; margin-left: 4px">Tú</span>
                          }
                        </div>
                        <div class="meta">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="tag plain" [class.brand]="u.rol === 'Administrador'">
                      <app-icon [name]="u.rol === 'Administrador' ? 'shield' : 'user'" [size]="13" /> {{ u.rol }}
                    </span>
                  </td>
                  <td class="num">{{ u.creado | fecha }}</td>
                  <td class="num">{{ acceso(u.ultimoAcceso) }}</td>
                  <td>
                    <span class="tag" [class.ok]="u.estado === 'Activo'" [class.bad]="u.estado !== 'Activo'">{{ u.estado }}</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" type="button" (click)="edit(u)" aria-label="Editar"><app-icon name="pencil" [size]="16" /></button>
                      <button class="icon-btn danger" type="button" (click)="remove(u, u.nombre)" aria-label="Eliminar"><app-icon name="trash" [size]="16" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty">
                      <div class="empty-icon"><app-icon name="users" [size]="24" /></div>
                      <h4>Sin usuarios</h4>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    @if (formOpen()) {
      <app-modal [title]="isNew ? 'Nuevo usuario' : 'Editar usuario'" eyebrow="Administración" (closed)="close()">
        <form class="form-grid" id="f" (ngSubmit)="submit()">
          <div class="field span-2">
            <label for="nombre">Nombre completo *</label>
            <input id="nombre" class="input" name="nombre" [(ngModel)]="draft.nombre" [class.invalid]="submitted && !draft.nombre.trim()" />
          </div>
          <div class="field span-2">
            <label for="email">Correo electrónico *</label>
            <input id="email" type="email" class="input" name="email" autocomplete="off" [(ngModel)]="draft.email" />
            @if (!isNew) {
              <span class="hint">Deja la contraseña vacía para mantener la actual.</span>
            }
          </div>
          <div class="field">
            <label for="p1">{{ isNew ? 'Contraseña *' : 'Nueva contraseña' }}</label>
            <input id="p1" type="password" class="input" name="p1" autocomplete="new-password" [placeholder]="isNew ? 'Mínimo 6 caracteres' : 'Dejar vacío para mantenerla'" [(ngModel)]="pass" />
          </div>
          <div class="field">
            <label for="p2">Confirmar contraseña</label>
            <input id="p2" type="password" class="input" name="p2" autocomplete="new-password" [(ngModel)]="pass2" [class.invalid]="!!pass2 && pass !== pass2" />
          </div>
          <div class="field">
            <span class="label">Rol</span>
            <div class="seg">
              @for (r of roles; track r) {
                <button type="button" [class.on]="draft.rol === r" (click)="draft.rol = r" [disabled]="esYo && r !== 'Administrador'">{{ r }}</button>
              }
            </div>
          </div>
          <div class="field">
            <span class="label">Estado</span>
            <label class="switch" style="height: 38px">
              <input type="checkbox" [disabled]="esYo" [checked]="draft.estado === 'Activo'" (change)="draft.estado = $any($event.target).checked ? 'Activo' : 'Inactivo'" />
              <span class="track"></span>
              {{ draft.estado }}
            </label>
          </div>
          @if (esYo) {
            <p class="hint span-2" style="margin: 0">No puedes cambiar tu propio rol ni desactivar tu cuenta.</p>
          }
        </form>
        <ng-container footer>
          <button class="btn" type="button" (click)="close()">Cancelar</button>
          <button class="btn btn-primary" type="submit" form="f" [disabled]="saving()"><app-icon name="check" [size]="16" /> Guardar</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class UsuariosPage extends CrudPage<Usuario> {
  protected readonly auth = inject(Auth);
  protected readonly col = this.store.usuarios;
  protected readonly noun = 'Usuario';
  protected readonly roles = ROLES;
  readonly rol = signal('');
  pass = '';
  pass2 = '';

  protected readonly rows = computed(() =>
    this.col.items().filter((u) => (!this.rol() || u.rol === this.rol()) && matches(this.q(), u.nombre, u.email)),
  );

  protected get esYo(): boolean {
    return !!this.draft?.id && this.draft.id === this.auth.user()?.id;
  }

  protected acceso(iso: string | null): string {
    if (!iso) return 'Nunca';
    return new Date(iso).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  override create(): void {
    super.create();
    this.pass = this.pass2 = '';
  }

  override edit(u: Usuario): void {
    super.edit(u);
    this.pass = this.pass2 = '';
  }

  protected blank(): Usuario {
    return { id: 0, nombre: '', email: '', rol: 'Reclutador', estado: 'Activo', creado: today(), ultimoAcceso: null };
  }

  protected override validate(d: Usuario): string | null {
    const err = this.auth.validar({ id: d.id, nombre: d.nombre, email: d.email, password: this.pass });
    if (err) return err;
    if (this.pass !== this.pass2) return 'Las contraseñas no coinciden.';
    const correo = d.email.trim().toLowerCase();
    if (this.col.items().some((u) => u.id !== d.id && u.email.toLowerCase() === correo)) return 'Ya existe una cuenta con ese correo.';
    const quedanAdmins = this.col
      .items()
      .some((u) => u.id !== d.id && u.rol === 'Administrador' && u.estado === 'Activo');
    if (!quedanAdmins && (d.rol !== 'Administrador' || d.estado !== 'Activo')) return 'Debe quedar al menos un administrador activo.';
    return null;
  }

  /** La contraseña viaja al servidor, que la guarda cifrada con bcrypt. */
  protected override persist(u: Usuario): Promise<Usuario> {
    return this.store.saveUsuario(u, this.pass);
  }

  protected override blockRemove(u: Usuario): string | null {
    if (u.id === this.auth.user()?.id) return 'No puedes eliminar tu propia cuenta.';
    const otrosAdmins = this.col.items().some((x) => x.id !== u.id && x.rol === 'Administrador' && x.estado === 'Activo');
    return u.rol === 'Administrador' && !otrosAdmins ? 'Debe quedar al menos un administrador activo.' : null;
  }
}
