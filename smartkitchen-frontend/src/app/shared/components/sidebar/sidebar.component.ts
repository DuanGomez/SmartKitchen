import { DcodeaBadgeComponent } from '../dcodea-badge.component';
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
  imports: [CommonModule, RouterModule, DcodeaBadgeComponent],
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
          <div class="logo-sub">POS SYSTEM</div>
        </div>
      </div>

      <!-- User pill -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user()?.nombre }}</div>
          <div class="user-role">{{ auth.rol() }}</div>
        </div>
        <div class="user-dot"><div class="status-dot dot-success"></div></div>
      </div>

      <div class="sk-divider" style="margin: .75rem 1rem;"></div>

      <!-- Nav sections -->
      @for (section of visibleSections; track section.title) {
        <div class="sk-nav-section">{{ section.title }}</div>
        @for (item of section.items; track item.route) {
          <a class="sk-nav-item" [routerLink]="item.route" routerLinkActive="active"
             (click)="layout.close()">
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
            @if (item.badge) { <span class="nav-badge">{{ item.badge }}</span> }
          </a>
        }
      }

      <!-- Spacer + logout -->
      <div style="flex:1"></div>
      <div class="signature"><app-dcodea-badge /></div>
      <div class="sk-divider" style="margin: .5rem 1rem;"></div>
      <button class="sk-nav-item logout-btn" style="margin-bottom:.75rem" (click)="auth.logout()">
        <span class="nav-icon">⏻</span>
        <span>Cerrar sesión</span>
      </button>
    </aside>
  `,
  styles: [`
    .signature { padding: .5rem 1rem; }
    :host { display: contents; }

    .sidebar-mob-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.55);
      backdrop-filter: blur(2px); z-index: 799;
    }

    .sidebar-user { display:flex; align-items:center; gap:.75rem; padding:.75rem 1.25rem; }
    .user-avatar { width:36px; height:36px; border-radius:50%; background:var(--primary-glow); border:2px solid var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.875rem; color:var(--primary); flex-shrink:0; }
    .user-name { font-size:.825rem; font-weight:600; color:var(--text-primary); }
    .user-role { font-size:.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
    .user-dot { margin-left:auto; }
    .logout-btn { background:transparent; border:none; font:inherit; cursor:pointer; text-align:left; width:calc(100% - 1.5rem); color:var(--danger) !important; &:hover { background:var(--danger-bg) !important; } }
  `]
})
export class SidebarComponent {
  auth   = inject(AuthService);
  layout = inject(LayoutService);

  get initials() {
    return this.auth.user()?.nombre?.split(' ').map(w => w[0]).slice(0, 2).join('') ?? 'SK';
  }

  private nav: NavSection[] = [
    {
      title: 'Administración', items: [
        { label: 'Dashboard',    icon: '◈', route: '/admin/dashboard', roles: ['ADMIN'] },
        { label: 'Productos',    icon: '☰', route: '/admin/productos',  roles: ['ADMIN'] },
        { label: 'Categorías',   icon: '⊞', route: '/admin/categorias', roles: ['ADMIN'] },
        { label: 'Usuarios',     icon: '◉', route: '/admin/usuarios',   roles: ['ADMIN'] },
      ]
    },
    {
      title: 'Servicio', items: [
        { label: 'Mesas',     icon: '⊡', route: '/mesero/mesas',  roles: ['ADMIN', 'MESERO'] },
      ]
    },
    {
      title: 'Caja', items: [
        { label: 'Caja',      icon: '◰', route: '/caja',          roles: ['ADMIN', 'CAJA'] },
      ]
    },
    {
      title: 'Estaciones', items: [
        { label: 'Cocina',    icon: '◑', route: '/estacion/cocina',  roles: ['ADMIN', 'COCINA'] },
        { label: 'Barra',     icon: '◐', route: '/estacion/barra',   roles: ['ADMIN', 'BARRA'] },
        { label: 'México',    icon: '◒', route: '/estacion/mexico',  roles: ['ADMIN', 'MEXICO'] },
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
