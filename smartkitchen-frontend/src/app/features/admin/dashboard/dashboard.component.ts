import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe, SidebarComponent, TopbarComponent, ToastComponent, IconComponent],
  template: `
    <sk-toast></sk-toast>
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="Dashboard" subtitle="Resumen del día"></sk-topbar>
        <div class="sk-content">

          <!-- Banner -->
          <section class="hero">
            <div class="hero__copy">
              <p class="hero__kicker">{{ hoy }}</p>
              <h1>Hola, {{ nombre }}</h1>
              <p class="hero__lead">Así va el servicio de hoy en el restaurante.</p>
              <div class="hero__stats">
                <div><strong>{{ totalDia() | currency:'COP':'$':'1.0-0' }}</strong><span>Ventas de hoy</span></div>
                <div><strong>{{ pedidosAbiertos().length }}</strong><span>Mesas atendiéndose</span></div>
                <div><strong>{{ mesasDisponibles() }}</strong><span>Mesas libres</span></div>
              </div>
            </div>
            <div class="hero__photo"><img src="photos/salon.webp" alt="" /></div>
          </section>

          <!-- Métricas -->
          <div class="grid-4 mb-3">
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:var(--primary-soft);color:var(--primary)"><sk-icon name="flame" /></div>
              <div class="stat-value">{{ enPreparacion() }}</div>
              <div class="stat-label">Platos en preparación</div>
            </div>
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:var(--success-bg);color:var(--success)"><sk-icon name="table" /></div>
              <div class="stat-value">{{ pedidosAbiertos().length }}</div>
              <div class="stat-label">Mesas activas · {{ mesasDisponibles() }} libres</div>
            </div>
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:var(--info-bg);color:var(--info)"><sk-icon name="box" /></div>
              <div class="stat-value">{{ totalProductos() }}</div>
              <div class="stat-label">Productos en carta</div>
            </div>
            <div class="sk-stat-card">
              <div class="stat-icon" style="background:#efedfc;color:var(--accent-purple)"><sk-icon name="users" /></div>
              <div class="stat-value">{{ totalUsuarios() }}</div>
              <div class="stat-label">Usuarios activos</div>
            </div>
          </div>

          <div class="cols">
            <!-- Pedidos abiertos -->
            <section class="sk-card">
              <div class="card-head">
                <div><h3>Pedidos abiertos</h3><p>Mesas con cuenta activa</p></div>
                <span class="sk-badge badge-muted">{{ pedidosAbiertos().length }}</span>
              </div>
              @if (loading()) {
                <div class="flex justify-center" style="padding:2rem"><div class="sk-spinner"></div></div>
              } @else if (pedidosAbiertos().length === 0) {
                <div class="empty-state"><div class="empty-icon"><sk-icon name="utensils" /></div><p>Sin pedidos activos</p></div>
              } @else {
                <div class="pedidos-list">
                  @for (p of pedidosAbiertos(); track p.id) {
                    <div class="pedido-row">
                      <div class="mesa-num">{{ p.mesaNumero }}</div>
                      <div>
                        <div class="fw-600 text-sm">Mesa {{ p.mesaNumero }}</div>
                        <div class="text-xs text-muted">{{ p.meseroNombre }} · {{ p.items.length }} ítems</div>
                      </div>
                      <div class="ml-auto text-right">
                        <div class="fw-600">{{ p.total | currency:'COP':'$':'1.0-0' }}</div>
                        <div class="text-xs text-muted">{{ p.fechaCreacion | date:'HH:mm' }}</div>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>

            <!-- Estaciones -->
            <section>
              <h3 class="section-title">Estaciones</h3>
              <div class="stations">
                @for (s of estaciones; track s.route) {
                  <a class="station" [routerLink]="s.route">
                    <img [src]="s.foto" alt="" loading="lazy" />
                    <span class="station__label"><strong>{{ s.label }}</strong><small>{{ s.hint }}</small></span>
                    <span class="station__go"><sk-icon name="arrow-right" [size]="16" /></span>
                  </a>
                }
              </div>
            </section>
          </div>

          <!-- Accesos rápidos -->
          <h3 class="section-title">Administrar</h3>
          <div class="shortcuts">
            @for (a of quickAccess; track a.label) {
              <a [routerLink]="a.route" class="shortcut">
                <span class="shortcut__icon"><sk-icon [name]="a.icon" /></span>
                <span class="shortcut__text"><strong>{{ a.label }}</strong><small>{{ a.hint }}</small></span>
                <sk-icon class="shortcut__arrow" name="chevron-right" [size]="18" />
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { display: grid; grid-template-columns: 1fr minmax(260px, 38%); gap: 2rem; padding: 2rem; margin-bottom: 1.25rem; border-radius: 28px; background: #fff; border: 1px solid var(--border); }
    .hero__kicker { font-size: .85rem; font-weight: 500; color: var(--text-muted); margin-bottom: .6rem; }
    .hero h1 { font-size: clamp(2rem, 4vw, 2.8rem); letter-spacing: -.045em; line-height: 1.05; }
    .hero__lead { margin-top: .6rem; color: var(--text-secondary); font-size: 1.02rem; }
    .hero__stats { display: flex; flex-wrap: wrap; gap: 2.5rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
    .hero__stats div { display: flex; flex-direction: column; }
    .hero__stats strong { font-family: var(--display); font-size: 1.9rem; font-weight: 700; letter-spacing: -.04em; line-height: 1; }
    .hero__stats span { margin-top: .4rem; font-size: .82rem; color: var(--text-muted); }
    .hero__photo { min-height: 230px; border-radius: 20px; overflow: hidden; background: var(--bg-soft); }
    .hero__photo img { width: 100%; height: 100%; object-fit: cover; }

    .cols { display: grid; grid-template-columns: 1.1fr 1fr; gap: 1rem; align-items: start; margin-bottom: 2rem; }
    .card-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; p { font-size: .82rem; color: var(--text-muted); margin-top: .2rem; } }
    .pedidos-list { display: flex; flex-direction: column; max-height: 380px; overflow-y: auto; }
    .pedido-row { display: flex; align-items: center; gap: .85rem; padding: .8rem .25rem; border-bottom: 1px solid var(--bg-soft); &:last-child { border-bottom: none; } }
    .mesa-num { width: 40px; height: 40px; border-radius: 12px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; font-family: var(--display); font-weight: 700; flex-shrink: 0; }
    .ml-auto { margin-left: auto; }
    .text-right { text-align: right; }

    .section-title { font-size: 1.15rem; margin-bottom: .85rem; }
    .stations { display: grid; gap: .75rem; }
    .station { position: relative; display: block; height: 112px; border-radius: 20px; overflow: hidden; color: #fff; background: var(--bg-soft-2); }
    .station img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s var(--dc-ease-out); }
    .station::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(19,19,22,.72) 0%, rgba(19,19,22,.1) 75%); }
    .station:hover img { transform: scale(1.05); }
    .station__label { position: absolute; z-index: 1; left: 1.25rem; bottom: 1rem; display: flex; flex-direction: column; strong { font-family: var(--display); font-size: 1.15rem; letter-spacing: -.02em; } small { font-size: .8rem; opacity: .8; } }
    .station__go { position: absolute; z-index: 1; right: 1rem; bottom: 1rem; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.2); backdrop-filter: blur(8px); display: grid; place-items: center; }

    .shortcuts { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: .75rem; }
    .shortcut { display: flex; align-items: center; gap: .9rem; padding: 1rem 1.1rem; border-radius: 18px; background: #fff; border: 1px solid var(--border); transition: transform .3s var(--dc-ease), box-shadow .3s ease; }
    .shortcut:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .shortcut__icon { width: 44px; height: 44px; border-radius: 12px; background: var(--bg-soft); display: grid; place-items: center; flex-shrink: 0; }
    .shortcut__text { display: flex; flex-direction: column; flex: 1; min-width: 0; strong { font-size: .95rem; font-weight: 600; } small { font-size: .8rem; color: var(--text-muted); } }
    .shortcut__arrow { color: var(--text-muted); }

    @media (max-width: 1100px) { .cols { grid-template-columns: 1fr; } }
    @media (max-width: 800px) {
      .hero { grid-template-columns: 1fr; padding: 1.25rem; gap: 1.25rem; }
      .hero__photo { order: -1; min-height: 170px; }
      .hero__stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin-top: 1.25rem; }
      .hero__stats strong { font-size: 1.25rem; }
      .hero__stats span { font-size: .74rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  loading         = signal(true);
  pedidosAbiertos = signal<any[]>([]);
  mesasDisponibles= signal(0);
  totalDia        = signal(0);
  totalProductos  = signal(0);
  totalUsuarios   = signal(0);
  enPreparacion   = () => this.pedidosAbiertos().reduce((n, p) => n + p.items.filter((i: any) => i.estado === 'ENVIADO').length, 0);

  nombre = (this.auth.user()?.nombre ?? '').split(' ')[0];
  hoy = ((d: string) => d.charAt(0).toUpperCase() + d.slice(1))(
    new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
  );

  estaciones = [
    { label: 'Cocina',  hint: 'Parrilla y fritos',     foto: 'photos/cocina.webp', route: '/estacion/cocina' },
    { label: 'Barra',   hint: 'Bebidas y cocteles',    foto: 'photos/barra.webp',  route: '/estacion/barra' },
    { label: 'México',  hint: 'Tacos, burritos, nachos', foto: 'photos/mexico.webp', route: '/estacion/mexico' },
  ];

  quickAccess = [
    { label: 'Productos',  hint: 'Carta, precios y fotos', icon: 'box',     route: '/admin/productos' },
    { label: 'Categorías', hint: 'Secciones y estaciones', icon: 'folder',  route: '/admin/categorias' },
    { label: 'Usuarios',   hint: 'Roles del equipo',       icon: 'users',   route: '/admin/usuarios' },
    { label: 'Mesas',      hint: 'Tomar pedidos',          icon: 'table',   route: '/mesero/mesas' },
    { label: 'Caja',       hint: 'Cobros y facturas',      icon: 'receipt', route: '/caja' },
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
