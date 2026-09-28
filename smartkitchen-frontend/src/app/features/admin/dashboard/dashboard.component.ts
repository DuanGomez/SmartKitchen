import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, SidebarComponent, TopbarComponent, ToastComponent],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('350ms {{delay}}ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ], { params: { delay: 0 } })
    ])
  ],
  template: `
    <sk-toast></sk-toast>
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="Dashboard" subtitle="Resumen del día en tiempo real"></sk-topbar>
        <div class="sk-content">

          <!-- Stats row -->
          <div class="grid-4 mb-3" style="animation: slideInLeft .4s ease both;">
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:rgba(255,107,53,.15);color:var(--primary)">💰</div>
              <div class="stat-value">{{ totalDia() | currency:'COP':'$':'1.0-0' }}</div>
              <div class="stat-label">Ventas hoy</div>
              <div class="stat-delta up">▲ Activo</div>
            </div>
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:rgba(0,184,148,.15);color:var(--success)">🍽</div>
              <div class="stat-value">{{ pedidosAbiertos().length }}</div>
              <div class="stat-label">Mesas activas</div>
              <div class="stat-delta" [class.up]="mesasDisponibles() > 0">{{ mesasDisponibles() }} disponibles</div>
            </div>
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:rgba(116,185,255,.15);color:var(--info)">📦</div>
              <div class="stat-value">{{ totalProductos() }}</div>
              <div class="stat-label">Productos activos</div>
            </div>
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:rgba(124,92,230,.15);color:var(--accent-purple)">👥</div>
              <div class="stat-value">{{ totalUsuarios() }}</div>
              <div class="stat-label">Usuarios activos</div>
            </div>
          </div>

          <div class="grid-2 gap-2" style="align-items:start">

            <!-- Pedidos abiertos -->
            <div class="sk-card">
              <div class="flex items-center justify-between mb-2">
                <h4>Pedidos abiertos</h4>
                <span class="sk-badge badge-primary">{{ pedidosAbiertos().length }}</span>
              </div>
              @if (loading()) {
                <div class="flex justify-center" style="padding:2rem"><div class="sk-spinner"></div></div>
              } @else if (pedidosAbiertos().length === 0) {
                <div class="empty-state"><div class="empty-icon">🍽</div><p>Sin pedidos activos</p></div>
              } @else {
                <div class="pedidos-list">
                  @for (p of pedidosAbiertos(); track p.id) {
                    <div class="pedido-row">
                      <div class="mesa-num">{{ p.mesaNumero }}</div>
                      <div>
                        <div class="fw-600 text-sm">Mesa {{ p.mesaNumero }}</div>
                        <div class="text-xs text-muted">{{ p.meseroNombre }} · {{ p.items.length }} items</div>
                      </div>
                      <div class="ml-auto text-right">
                        <div class="fw-600">{{ p.total | currency:'COP':'$':'1.0-0' }}</div>
                        <div class="text-xs text-muted">{{ p.fechaCreacion | date:'HH:mm' }}</div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Accesos rápidos -->
            <div class="sk-card">
              <h4 class="mb-2">Accesos rápidos</h4>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:.75rem;">
                @for (a of quickAccess; track a.label) {
                  <a [routerLink]="a.route" class="quick-card" [style.background]="a.bg">
                    <span class="quick-icon">{{ a.icon }}</span>
                    <span class="quick-label">{{ a.label }}</span>
                  </a>
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pedidos-list { display:flex; flex-direction:column; gap:.5rem; max-height:360px; overflow-y:auto; }
    .pedido-row { display:flex; align-items:center; gap:.75rem; padding:.75rem; border-radius:var(--radius-md); background:var(--bg-input); transition:background var(--transition-fast); &:hover{background:var(--bg-hover);} }
    .mesa-num { width:36px; height:36px; border-radius:var(--radius-md); background:var(--primary-glow); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.9rem; flex-shrink:0; }
    .ml-auto { margin-left:auto; }
    .quick-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; padding:1.25rem; border-radius:var(--radius-lg); text-decoration:none; transition:transform var(--transition-base),opacity var(--transition-base); cursor:pointer; &:hover{transform:translateY(-2px);opacity:.9;} }
    .quick-icon { font-size:1.75rem; }
    .quick-label { font-size:.8rem; font-weight:600; color:var(--text-primary); }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  loading         = signal(true);
  pedidosAbiertos = signal<any[]>([]);
  mesasDisponibles= signal(0);
  totalDia        = signal(0);
  totalProductos  = signal(0);
  totalUsuarios   = signal(0);

  quickAccess = [
    { label: 'Productos',  icon: '🍖', route: '/admin/productos',  bg: 'rgba(255,107,53,.1)' },
    { label: 'Categorías', icon: '📂', route: '/admin/categorias', bg: 'rgba(124,92,230,.1)' },
    { label: 'Usuarios',   icon: '👤', route: '/admin/usuarios',   bg: 'rgba(0,184,148,.1)' },
    { label: 'Mesas',      icon: '🪑', route: '/mesero/mesas',     bg: 'rgba(116,185,255,.1)' },
    { label: 'Caja',       icon: '💳', route: '/caja',             bg: 'rgba(253,203,110,.1)' },
    { label: 'Cocina',     icon: '🍳', route: '/estacion/cocina',  bg: 'rgba(225,112,85,.1)' },
  ];

  ngOnInit() {
    Promise.all([
      this.api.getPedidosAbiertos().toPromise(),
      this.api.getMesas().toPromise(),
      this.api.getTodosProductos().toPromise(),
      this.api.getUsuarios().toPromise(),
      this.api.getFacturasHoy().toPromise(),
    ]).then(([pedidos, mesas, productos, usuarios, ventas]) => {
      this.pedidosAbiertos.set(pedidos ?? []);
      this.mesasDisponibles.set((mesas ?? []).filter((m: any) => m.estado === 'DISPONIBLE').length);
      this.totalProductos.set((productos ?? []).filter((p: any) => p.activo).length);
      this.totalUsuarios.set((usuarios ?? []).filter((u: any) => u.activo).length);
      this.totalDia.set((ventas as any)?.total ?? 0);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }
}
