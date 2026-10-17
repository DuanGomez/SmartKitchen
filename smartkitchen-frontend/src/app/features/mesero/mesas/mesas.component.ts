import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { Mesa } from '../../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, ToastComponent, IconComponent],
  animations: [
    trigger('mesaEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(.85)' }),
        animate('300ms cubic-bezier(.34,1.4,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('mesaChange', [
      transition('DISPONIBLE => OCUPADA', [
        style({ transform: 'scale(1.06)' }),
        animate('250ms cubic-bezier(.34,1.4,.64,1)', style({ transform: 'scale(1)' }))
      ]),
      transition('OCUPADA => DISPONIBLE', [
        style({ transform: 'scale(.94)' }),
        animate('250ms ease', style({ transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <sk-toast></sk-toast>
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="Mesas" [subtitle]="subtitleMsg" [alerts]="ocupadas()"></sk-topbar>
        <div class="sk-content">

          <!-- Banner del salón -->
          <section class="salon">
            <img src="photos/salon.webp" alt="" />
            <div class="salon__copy">
              <h1>Salón</h1>
              <p>Toca una mesa para abrir o continuar su pedido.</p>
            </div>
            <div class="salon__stats">
              <div><strong>{{ libres() }}</strong><span>Libres</span></div>
              <div><strong>{{ ocupadas() }}</strong><span>Ocupadas</span></div>
            </div>
          </section>

          <div class="mesas-toolbar">
            <div class="filter-tabs">
              @for (f of filtros; track f.key) {
                <button class="filter-tab" [class.active]="filtroActivo === f.key" (click)="filtroActivo = f.key">{{ f.label }}</button>
              }
            </div>
            <button class="sk-btn sk-btn-ghost sk-btn-sm" (click)="cargar()" [disabled]="loading()"><sk-icon name="refresh" [size]="16" /> Actualizar</button>
          </div>

          <!-- Grid de mesas -->
          @if (loading()) {
            <div class="flex justify-center" style="padding:4rem"><div class="sk-spinner"></div></div>
          } @else {
            <div class="mesas-grid">
              @for (m of mesasFiltradas(); track m.id) {
                <div class="mesa-card" [class.ocupada]="m.estado === 'OCUPADA'" [class.disponible]="m.estado === 'DISPONIBLE'"
                     @mesaEnter [@mesaChange]="m.estado" (click)="seleccionar(m)">
                  <div class="mesa-top">
                    <span class="mesa-badge" [class.ocupada-badge]="m.estado === 'OCUPADA'" [class.libre-badge]="m.estado !== 'OCUPADA'">
                      {{ m.estado === 'OCUPADA' ? 'Ocupada' : 'Libre' }}
                    </span>
                  </div>
                  <div class="mesa-numero">{{ m.numero }}</div>
                  <div class="mesa-nombre">{{ m.nombre }}</div>
                  <div class="mesa-foot">
                    @if (m.estado === 'OCUPADA') {
                      <sk-icon name="user" [size]="14" /><span class="truncate">{{ m.meseroNombre }}</span>
                    } @else {
                      <sk-icon name="users" [size]="14" /><span>{{ m.capacidad }} personas</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Selección de mesa -->
    @if (mesaSel()) {
      <div class="sk-overlay" (click)="mesaSel.set(null)">
        <div class="sk-modal" (click)="$event.stopPropagation()" style="max-width:400px">
          <div class="sk-modal-header">
            <h3>Mesa {{ mesaSel()!.numero }}</h3>
            <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="mesaSel.set(null)" aria-label="Cerrar"><sk-icon name="close" [size]="18" /></button>
          </div>

          @if (mesaSel()!.estado === 'DISPONIBLE') {
            <p class="text-muted text-sm mb-2">Esta mesa está disponible. ¿Abrir nuevo pedido?</p>
            <div class="mesa-sel-info">
              <div class="info-row"><span>Capacidad</span><span>{{ mesaSel()!.capacidad }} personas</span></div>
              <div class="info-row"><span>Estado</span><span class="sk-badge badge-success">Libre</span></div>
            </div>
            <div class="sk-modal-footer">
              <button class="sk-btn sk-btn-ghost" (click)="mesaSel.set(null)">Cancelar</button>
              <button class="sk-btn sk-btn-primary" (click)="abrirMesa()" [disabled]="actionLoading()">
                @if (actionLoading()) { <span class="sk-spinner sk-spinner-sm"></span> } Abrir mesa
              </button>
            </div>
          } @else {
            <p class="text-muted text-sm mb-2">Mesa ocupada. Puedes ver o gestionar el pedido.</p>
            <div class="mesa-sel-info">
              <div class="info-row"><span>Mesero</span><span class="fw-600">{{ mesaSel()!.meseroNombre }}</span></div>
            </div>
            <div class="sk-modal-footer">
              <button class="sk-btn sk-btn-ghost" (click)="mesaSel.set(null)">Cancelar</button>
              <button class="sk-btn sk-btn-primary" (click)="irAPedido(mesaSel()!.id)">Ver pedido <sk-icon name="arrow-right" [size]="16" /></button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .salon { position:relative; height:190px; border-radius:28px; overflow:hidden; margin-bottom:1.5rem; color:#fff; background:var(--bg-soft-2); }
    .salon img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .salon::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg, rgba(19,19,22,.75) 0%, rgba(19,19,22,.15) 75%); }
    .salon__copy { position:absolute; z-index:1; left:2rem; bottom:1.6rem; h1 { color:#fff; font-size:clamp(2rem,4vw,2.6rem); letter-spacing:-.045em; line-height:1; } p { margin-top:.45rem; color:rgba(255,255,255,.82); } }
    .salon__stats { position:absolute; z-index:1; right:2rem; bottom:1.6rem; display:flex; gap:2rem; text-align:right; div { display:flex; flex-direction:column; } strong { font-family:var(--display); font-size:2.1rem; font-weight:700; letter-spacing:-.04em; line-height:1; } span { font-size:.8rem; color:rgba(255,255,255,.75); margin-top:.3rem; } }

    .mesas-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .filter-tabs { display:flex; gap:.2rem; background:var(--bg-soft-2); padding:.25rem; border-radius:999px; }
    .filter-tab { padding:.45rem 1rem; border-radius:999px; font-size:.84rem; font-weight:600; background:none; border:none; color:var(--text-secondary); cursor:pointer; font-family:inherit; transition:all var(--transition-fast); &:hover{color:var(--text-primary);} &.active{background:#fff;color:var(--text-primary);box-shadow:0 1px 3px rgba(19,19,22,.12);} }

    .mesas-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(168px,1fr)); gap:.9rem; }
    .mesa-card {
      border-radius:22px; border:1px solid var(--border); background:#fff; padding:1rem 1.1rem;
      display:flex; flex-direction:column; gap:.15rem; cursor:pointer; min-height:160px;
      transition:transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
      &:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
    }
    .mesa-card.ocupada { background:var(--ink); border-color:var(--ink); color:#fff; .mesa-nombre, .mesa-foot { color:rgba(255,255,255,.65); } }
    .mesa-top { display:flex; justify-content:flex-end; margin-bottom:.4rem; }
    .mesa-numero { font-family:var(--display); font-size:2.4rem; font-weight:700; letter-spacing:-.05em; line-height:1; }
    .mesa-nombre { font-size:.8rem; color:var(--text-muted); font-weight:500; }
    .mesa-foot { margin-top:auto; padding-top:.7rem; display:flex; align-items:center; gap:.35rem; font-size:.78rem; color:var(--text-secondary); min-width:0; }
    .mesa-badge { font-size:.7rem; font-weight:600; padding:.2rem .6rem; border-radius:999px; }
    .libre-badge   { background:var(--success-bg); color:var(--success); }
    .ocupada-badge { background:var(--primary); color:#fff; }

    .mesa-sel-info { background:var(--bg-base); border:1px solid var(--border); border-radius:var(--radius-md); padding:.85rem 1rem; display:flex; flex-direction:column; gap:.5rem; margin-bottom:.5rem; }
    .info-row { display:flex; justify-content:space-between; align-items:center; font-size:.875rem; span:first-child{color:var(--text-muted);} }

    @media (max-width: 600px) {
      .salon { height:auto; min-height:210px; display:flex; flex-direction:column; justify-content:flex-end; gap:1rem; padding:1.25rem; }
      .salon__copy, .salon__stats { position:relative; left:auto; right:auto; bottom:auto; top:auto; }
      .salon__stats { justify-content:flex-start; text-align:left; gap:1.75rem; padding-top:.9rem; border-top:1px solid rgba(255,255,255,.2); }
      .salon__stats strong { font-size:1.6rem; }
      .salon::after { background:linear-gradient(180deg, rgba(19,19,22,.25) 0%, rgba(19,19,22,.8) 100%); }
      .mesas-grid { grid-template-columns:repeat(2,1fr); }
    }
  `]
})
export class MesasComponent implements OnInit, OnDestroy {
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  loading      = signal(true);
  actionLoading= signal(false);
  mesas        = signal<Mesa[]>([]);
  mesaSel      = signal<Mesa | null>(null);
  filtroActivo = 'TODAS';

  filtros = [{ key: 'TODAS', label: 'Todas' }, { key: 'DISPONIBLE', label: 'Disponibles' }, { key: 'OCUPADA', label: 'Ocupadas' }];

  private interval: any;

  get subtitleMsg() { return `${this.ocupadas()} ocupadas · ${this.libres()} libres`; }
  libres()  { return this.mesas().filter(m => m.estado === 'DISPONIBLE').length; }
  ocupadas(){ return this.mesas().filter(m => m.estado === 'OCUPADA').length; }

  mesasFiltradas() {
    const f = this.filtroActivo;
    return f === 'TODAS' ? this.mesas() : this.mesas().filter(m => m.estado === f);
  }

  ngOnInit() { this.cargar(); this.interval = setInterval(() => this.cargar(), 15000); }
  ngOnDestroy() { clearInterval(this.interval); }

  cargar() {
    this.api.getMesas().subscribe({ next: m => { this.mesas.set(m); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  seleccionar(m: Mesa) { this.mesaSel.set(m); }

  abrirMesa() {
    const meseroId = this.auth.user()!.id;
    const mesaId   = this.mesaSel()!.id;
    const numero   = this.mesaSel()!.numero;
    this.actionLoading.set(true);
    this.api.abrirPedido(mesaId, meseroId).subscribe({
      next: (p) => {
        this.actionLoading.set(false);
        this.mesaSel.set(null);
        this.toast.success(`Mesa ${numero} abierta`);
        this.router.navigate(['/mesero/pedido', p.id]);
      },
      error: e => {
        this.actionLoading.set(false);
        // puede que ya exista un pedido
        if (e.status === 409) this.irAPedidoPorMesa(mesaId);
        else this.toast.error(e.error?.mensaje ?? 'Error al abrir mesa');
      }
    });
  }

  irAPedido(mesaId: number) {
    this.mesaSel.set(null);
    this.irAPedidoPorMesa(mesaId);
  }

  private irAPedidoPorMesa(mesaId: number) {
    this.api.getPedidoMesa(mesaId).subscribe({
      next: p  => this.router.navigate(['/mesero/pedido', p.id]),
      error: () => this.toast.error('No se pudo cargar el pedido')
    });
  }
}
