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
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, ToastComponent],
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

          <!-- Legend + filter -->
          <div class="mesas-toolbar">
            <div class="legend">
              <div class="legend-item"><div class="legend-dot dot-libre"></div><span>Disponible ({{ libres() }})</span></div>
              <div class="legend-item"><div class="legend-dot dot-ocupada"></div><span>Ocupada ({{ ocupadas() }})</span></div>
            </div>
            <div class="filter-tabs">
              @for (f of filtros; track f.key) {
                <button class="filter-tab" [class.active]="filtroActivo === f.key" (click)="filtroActivo = f.key">{{ f.label }}</button>
              }
            </div>
            <button class="sk-btn sk-btn-ghost sk-btn-sm" (click)="cargar()" [disabled]="loading()">↻ Actualizar</button>
          </div>

          <!-- Grid de mesas -->
          @if (loading()) {
            <div class="flex justify-center" style="padding:4rem"><div class="sk-spinner"></div></div>
          } @else {
            <div class="mesas-grid">
              @for (m of mesasFiltradas(); track m.id) {
                <div class="mesa-card" [class.ocupada]="m.estado === 'OCUPADA'" [class.disponible]="m.estado === 'DISPONIBLE'"
                     @mesaEnter [@mesaChange]="m.estado" (click)="seleccionar(m)">
                  <div class="mesa-numero">{{ m.numero }}</div>
                  <div class="mesa-nombre">{{ m.nombre }}</div>
                  @if (m.estado === 'OCUPADA') {
                    <div class="mesa-mesero">{{ m.meseroNombre }}</div>
                    <div class="mesa-badge ocupada-badge">OCUPADA</div>
                  } @else {
                    <div class="mesa-cap">{{ m.capacidad }} personas</div>
                    <div class="mesa-badge libre-badge">LIBRE</div>
                  }
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
            <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="mesaSel.set(null)">✕</button>
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
              <button class="sk-btn sk-btn-primary" (click)="irAPedido(mesaSel()!.id)">Ver pedido →</button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .mesas-toolbar { display:flex; align-items:center; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap; }
    .legend { display:flex; gap:1rem; }
    .legend-item { display:flex; align-items:center; gap:.4rem; font-size:.8rem; color:var(--text-secondary); }
    .legend-dot { width:10px; height:10px; border-radius:50%; }
    .dot-libre   { background:var(--success); }
    .dot-ocupada { background:var(--danger); animation: pulse 2s infinite; }

    .filter-tabs { display:flex; gap:.25rem; background:var(--bg-surface); padding:.3rem; border-radius:var(--radius-md); }
    .filter-tab { padding:.35rem .85rem; border-radius:var(--radius-sm); font-size:.8rem; font-weight:600; background:none; border:none; color:var(--text-muted); cursor:pointer; font-family:inherit; transition:all var(--transition-fast); &:hover{color:var(--text-primary);} &.active{background:var(--bg-card);color:var(--text-primary);box-shadow:var(--shadow-sm);} }

    .mesas-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:1rem; }

    .mesa-card {
      aspect-ratio:1; border-radius:var(--radius-lg); border:2px solid var(--border);
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.35rem;
      cursor:pointer; position:relative; overflow:hidden;
      transition:transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
      &:hover { transform: scale(1.04); }
    }
    .mesa-card.disponible {
      background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
      border-color: rgba(0,184,148,.25);
      &:hover { border-color: var(--success); box-shadow: 0 0 24px rgba(0,184,148,.15); }
    }
    .mesa-card.ocupada {
      background: linear-gradient(145deg, rgba(225,112,85,.1), rgba(225,112,85,.05));
      border-color: rgba(225,112,85,.4);
      box-shadow: 0 0 20px rgba(225,112,85,.08);
      &:hover { border-color: var(--danger); box-shadow: 0 0 24px rgba(225,112,85,.2); }
    }
    .mesa-numero { font-size:2rem; font-weight:800; line-height:1; }
    .mesa-nombre { font-size:.72rem; color:var(--text-muted); font-weight:500; }
    .mesa-mesero { font-size:.72rem; color:var(--text-secondary); max-width:90%; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .mesa-cap { font-size:.72rem; color:var(--text-muted); }
    .mesa-badge { position:absolute; bottom:.5rem; right:.5rem; font-size:.62rem; font-weight:700; padding:.2rem .5rem; border-radius:var(--radius-full); }
    .libre-badge   { background:rgba(0,184,148,.15); color:var(--success); }
    .ocupada-badge { background:rgba(225,112,85,.2); color:var(--danger); }

    .mesa-sel-info { background:var(--bg-input); border-radius:var(--radius-md); padding:.75rem 1rem; display:flex; flex-direction:column; gap:.5rem; margin-bottom:.5rem; }
    .info-row { display:flex; justify-content:space-between; align-items:center; font-size:.875rem; span:first-child{color:var(--text-muted);} }
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
