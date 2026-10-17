import { DcodeaBadgeComponent } from '../dcodea-badge.component';
import { IconComponent } from '../icon.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

interface NavItem { label: string; icon: string; route: string; roles: string[]; badge?: number; }
interface NavSection { title: string; items: NavItem[]; }

@Component({
  selector: 'sk-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, DcodeaBadgeComponent, IconComponent],
  template: `
    <!-- Overlay móvil -->
    @if (layout.sidebarOpen()) {
      <div class="sidebar-mob-overlay" (click)="layout.close()"></div>
    }

    <aside class="sk-sidebar" [class.sidebar-open]="layout.sidebarOpen()">
      <!-- Logo -->
      <div class="sk-logo">
        <div class="logo-mark">SK</div>
        <div>
          <div class="logo-text">SmartKitchen</div>
          <div class="logo-sub">Punto de venta</div>
        </div>
      </div>

      <!-- User pill -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user()?.nombre }}</div>
          <div class="user-role">{{ rolLabel }}</div>
        </div>
      </div>

      <!-- Nav sections -->
      @for (section of visibleSections; track section.title) {
        <div class="sk-nav-section">{{ section.title }}</div>
        @for (item of section.items; track item.route) {
          <a class="sk-nav-item" [routerLink]="item.route" routerLinkActive="active"
             (click)="layout.close()">
            <span class="nav-icon"><sk-icon [name]="item.icon" [size]="19" /></span>
            <span>{{ item.label }}</span>
            @if (item.badge) { <span class="nav-badge">{{ item.badge }}</span> }
          </a>
        }
      }

      <!-- Spacer + logout -->
      <div style="flex:1"></div>
      <div class="signature"><app-dcodea-badge /></div>
      <button class="sk-nav-item logout-btn" style="margin-bottom:1rem" (click)="auth.logout()">
        <span class="nav-icon"><sk-icon name="logout" [size]="19" /></span>
        <span>Cerrar sesión</span>
      </button>
    </aside>
  `,
  styles: [`
    .signature { padding: .5rem 1rem; }
    :host { display: contents; }

    .sidebar-mob-overlay {
      position: fixed; inset: 0; background: rgba(19,19,22,.35);
      backdrop-filter: blur(2px); z-index: 799;
    }

    .sidebar-user { display:flex; align-items:center; gap:.75rem; margin:.25rem 1rem .5rem; padding:.75rem; border-radius:14px; background:rgba(255,255,255,.06); }
    .user-avatar { width:36px; height:36px; border-radius:50%; background:#2a2a2f; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:.82rem; color:#fff; flex-shrink:0; }
    .user-info { min-width:0; }
    .user-name { font-size:.86rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .user-role { font-size:.76rem; color:#8b8b91; }
    .logout-btn { background:transparent; border:none; font:inherit; font-size:.9rem; font-weight:500; cursor:pointer; text-align:left; width:calc(100% - 1.8rem); }
  `]
})
export class SidebarComponent {
  auth   = inject(AuthService);
  layout = inject(LayoutService);

  get initials() {
    return this.auth.user()?.nombre?.split(' ').filter(w => /^\p{L}/u.test(w)).map(w => w[0]).slice(0, 2).join('') ?? 'SK';
  }

  private static ROLES: Record<string, string> = {
    ADMIN: 'Administrador', MESERO: 'Mesero', COCINA: 'Cocina', BARRA: 'Barra', MEXICO: 'Estación México', CAJA: 'Caja',
  };
  get rolLabel() { return SidebarComponent.ROLES[this.auth.rol() ?? ''] ?? this.auth.rol(); }

  private nav: NavSection[] = [
    {
      title: 'Administración', items: [
        { label: 'Dashboard',    icon: 'dashboard', route: '/admin/dashboard', roles: ['ADMIN'] },
        { label: 'Productos',    icon: 'box', route: '/admin/productos',  roles: ['ADMIN'] },
        { label: 'Categorías',   icon: 'folder', route: '/admin/categorias', roles: ['ADMIN'] },
        { label: 'Usuarios',     icon: 'users', route: '/admin/usuarios',   roles: ['ADMIN'] },
      ]
    },
    {
      title: 'Servicio', items: [
        { label: 'Mesas',     icon: 'table', route: '/mesero/mesas',  roles: ['ADMIN', 'MESERO'] },
      ]
    },
    {
      title: 'Caja', items: [
        { label: 'Caja',      icon: 'receipt', route: '/caja',          roles: ['ADMIN', 'CAJA'] },
      ]
    },
    {
      title: 'Estaciones', items: [
        { label: 'Cocina',    icon: 'chef', route: '/estacion/cocina',  roles: ['ADMIN', 'COCINA'] },
        { label: 'Barra',     icon: 'glass', route: '/estacion/barra',   roles: ['ADMIN', 'BARRA'] },
        { label: 'México',    icon: 'taco', route: '/estacion/mexico',  roles: ['ADMIN', 'MEXICO'] },
      ]
    }
  ];

  get visibleSections(): NavSection[] {
    const rol = this.auth.rol();
    return this.nav
      .map(s => ({ ...s, items: s.items.filter(i => i.roles.includes(rol ?? '')) }))
      .filter(s => s.items.length > 0);
  }
}
