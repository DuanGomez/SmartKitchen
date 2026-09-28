import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Usuario, UsuarioRequest, Rol } from '../../../core/models/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, TopbarComponent, ToastComponent, ConfirmDialogComponent],
  template: `
    <sk-toast></sk-toast>
    @if (showConfirm()) {
      <sk-confirm-dialog title="Eliminar usuario" [message]="'¿Eliminar a «' + (delTarget()?.nombre ?? '') + '»?'"
        (confirm)="confirmDelete()" (cancel)="showConfirm.set(false)"></sk-confirm-dialog>
    }
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="Usuarios" subtitle="Gestiona el equipo del restaurante"></sk-topbar>
        <div class="sk-content">
          <div class="sk-page-header">
            <div class="page-title"><h2>Equipo</h2><p>{{ usuarios().length }} usuarios registrados</p></div>
            <button class="sk-btn sk-btn-primary" (click)="abrirModal()">+ Nuevo usuario</button>
          </div>

          <div class="sk-card" style="padding:0;overflow:hidden">
            <table class="sk-table">
              <thead><tr><th>Usuario</th><th>Nombre de acceso</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                @for (u of usuarios(); track u.id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-1">
                        <div class="u-avatar">{{ initials(u.nombre) }}</div>
                        <span class="fw-600 text-sm">{{ u.nombre }}</span>
                      </div>
                    </td>
                    <td><span class="mono text-sm text-muted">@{{ u.username }}</span></td>
                    <td><span class="sk-badge" [style.background]="rolColor(u.rol) + '22'" [style.color]="rolColor(u.rol)">{{ u.rol }}</span></td>
                    <td><span class="sk-badge" [class]="u.activo ? 'badge-success' : 'badge-muted'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td>
                      <div class="flex gap-1">
                        <button class="sk-btn sk-btn-ghost sk-btn-sm" (click)="abrirModal(u)">✏️ Editar</button>
                        <button class="sk-btn sk-btn-danger sk-btn-sm" (click)="pedirEliminar(u)">🗑</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    @if (modal()) {
      <div class="sk-overlay" (click)="cerrarModal()">
        <div class="sk-modal" (click)="$event.stopPropagation()">
          <div class="sk-modal-header">
            <h3>{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
            <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="cerrarModal()">✕</button>
          </div>
          <form (ngSubmit)="guardar()" style="display:flex;flex-direction:column;gap:1rem">
            <div class="grid-2">
              <div class="sk-input-group"><label>Nombre completo *</label><input class="sk-input" [(ngModel)]="form.nombre" name="nombre" required placeholder="Juan García"></div>
              <div class="sk-input-group"><label>Usuario (login) *</label><input class="sk-input" [(ngModel)]="form.username" name="username" required placeholder="jgarcia" [disabled]="editando()"></div>
            </div>
            <div class="grid-2">
              <div class="sk-input-group">
                <label>{{ editando() ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña *' }}</label>
                <input class="sk-input" type="password" [(ngModel)]="form.password" name="password" [required]="!editando()" placeholder="••••••••">
              </div>
              <div class="sk-input-group">
                <label>Rol *</label>
                <select class="sk-select" [(ngModel)]="form.rol" name="rol" required>
                  <option value="">Seleccionar...</option>
                  @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
                </select>
              </div>
            </div>
            <div class="sk-input-group">
              <label>Estado</label>
              <select class="sk-select" [(ngModel)]="form.activo" name="activo">
                <option [ngValue]="true">Activo</option><option [ngValue]="false">Inactivo</option>
              </select>
            </div>
            <div class="sk-modal-footer">
              <button type="button" class="sk-btn sk-btn-ghost" (click)="cerrarModal()">Cancelar</button>
              <button type="submit" class="sk-btn sk-btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="sk-spinner sk-spinner-sm"></span> } Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .u-avatar { width:36px; height:36px; border-radius:50%; background:var(--primary-glow); border:2px solid var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.8rem; color:var(--primary); flex-shrink:0; }
    .mono { font-family:'JetBrains Mono',monospace; }
  `]
})
export class UsuariosComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  usuarios    = signal<Usuario[]>([]);
  saving      = signal(false);
  modal       = signal(false);
  editando    = signal(false);
  showConfirm = signal(false);
  delTarget   = signal<Usuario | null>(null);
  editId: number | null = null;

  roles: Rol[] = ['ADMIN','MESERO','CAJA','COCINA','BARRA','MEXICO'];
  form: UsuarioRequest = { nombre:'', username:'', password:'', rol:'MESERO', activo:true };

  rolColors: Record<Rol, string> = { ADMIN:'var(--primary)', MESERO:'var(--info)', CAJA:'var(--warning)', COCINA:'var(--danger)', BARRA:'var(--accent-blue)', MEXICO:'var(--success)' };

  ngOnInit() { this.cargar(); }
  cargar()   { this.api.getUsuarios().subscribe(u => this.usuarios.set(u)); }
  initials(nombre: string) { return nombre.split(' ').map(w => w[0]).slice(0,2).join(''); }
  rolColor(rol: Rol) { return this.rolColors[rol] ?? 'var(--text-muted)'; }

  abrirModal(u?: Usuario) {
    this.editando.set(!!u);
    this.editId = u?.id ?? null;
    this.form = { nombre: u?.nombre ?? '', username: u?.username ?? '', password: '', rol: u?.rol ?? 'MESERO', activo: u?.activo ?? true };
    this.modal.set(true);
  }
  cerrarModal() { this.modal.set(false); }

  guardar() {
    this.saving.set(true);
    const obs = this.editId ? this.api.updateUsuario(this.editId, this.form) : this.api.createUsuario(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.cerrarModal(); this.cargar(); this.toast.success('Usuario guardado'); },
      error: e  => { this.saving.set(false); this.toast.error(e.error?.mensaje ?? 'Error'); }
    });
  }

  pedirEliminar(u: Usuario) { this.delTarget.set(u); this.showConfirm.set(true); }
  confirmDelete() {
    this.api.deleteUsuario(this.delTarget()!.id).subscribe({
      next: () => { this.showConfirm.set(false); this.cargar(); this.toast.success('Usuario eliminado'); },
      error: e  => { this.showConfirm.set(false); this.toast.error(e.error?.mensaje ?? 'Error'); }
    });
  }
}
