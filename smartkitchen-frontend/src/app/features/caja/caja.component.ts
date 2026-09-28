import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { Pedido, Factura, FacturaRequest, MetodoPago } from '../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, SidebarComponent, TopbarComponent, ToastComponent],
  animations: [
    trigger('ticketIn', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(.92)' }), animate('300ms cubic-bezier(.34,1.4,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))]),
      transition(':leave', [animate('200ms ease', style({ opacity: 0, transform: 'scale(.92)' }))])
    ])
  ],
  template: `
    <sk-toast></sk-toast>
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar title="💰 Caja" [subtitle]="'Ventas hoy: ' + (totalHoy() | currency:'COP':'$':'1.0-0')" [alerts]="pedidos().length"></sk-topbar>
        <div class="sk-content">

          <div class="caja-layout">

            <!-- LEFT: Mesas activas -->
            <div class="caja-left">
              <div class="flex items-center justify-between mb-2">
                <h4>Mesas activas</h4>
                <span class="sk-badge badge-primary">{{ pedidos().length }}</span>
              </div>

              @if (loading()) {
                <div class="flex justify-center" style="padding:2rem"><div class="sk-spinner"></div></div>
              } @else if (pedidos().length === 0) {
                <div class="empty-state" style="padding:2rem"><div class="empty-icon">🍽</div><p>Sin mesas activas</p></div>
              } @else {
                <div class="mesas-list">
                  @for (p of pedidos(); track p.id) {
                    <div class="mesa-item" [class.selected]="pedidoSel()?.id === p.id" (click)="seleccionar(p)">
                      <div class="mesa-num-small" [class.active-num]="pedidoSel()?.id === p.id">{{ p.mesaNumero }}</div>
                      <div class="mesa-data">
                        <div class="fw-600 text-sm">Mesa {{ p.mesaNumero }}</div>
                        <div class="text-xs text-muted">{{ p.meseroNombre }} · {{ p.items.length }} items</div>
                      </div>
                      <div class="mesa-total">{{ p.total | currency:'COP':'$':'1.0-0' }}</div>
                    </div>
                  }
                </div>
              }

              <div class="sk-divider"></div>
              <div class="sk-stat-card" style="padding:1rem">
                <div class="stat-label">Total vendido hoy</div>
                <div class="stat-value" style="font-size:1.5rem">{{ totalHoy() | currency:'COP':'$':'1.0-0' }}</div>
              </div>
            </div>

            <!-- RIGHT: Detalle y facturación -->
            <div class="caja-right">
              @if (!pedidoSel()) {
                <div class="empty-state" style="height:100%">
                  <div class="empty-icon">👆</div>
                  <p>Selecciona una mesa para facturar</p>
                </div>
              } @else if (!facturaGenerada()) {
                <!-- Detalle del pedido -->
                <div class="detalle-header">
                  <h4>Mesa {{ pedidoSel()!.mesaNumero }} — Detalle</h4>
                  <span class="text-xs text-muted">{{ pedidoSel()!.fechaCreacion | date:'dd/MM HH:mm' }}</span>
                </div>

                <div class="detalle-items">
                  @for (item of pedidoSel()!.items; track item.id) {
                    <div class="detalle-item">
                      <div>
                        <div class="text-sm fw-600">{{ item.productoNombre }}</div>
                        @if (item.observacion) { <div class="text-xs text-muted">{{ item.observacion }}</div> }
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-muted">{{ item.cantidad }} × {{ item.precioUnitario | currency:'COP':'$':'1.0-0' }}</div>
                        <div class="fw-600 text-sm">{{ item.subtotal | currency:'COP':'$':'1.0-0' }}</div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Facturación -->
                <div class="factura-form">
                  <div class="sk-input-group">
                    <label>Servicio</label>
                    <div class="servicio-opts">
                      @for (s of servicioOpts; track s.value) {
                        <button class="serv-btn" [class.active]="factura.porcentajeServicio === s.value" (click)="factura.porcentajeServicio = s.value; calcular()">{{ s.label }}</button>
                      }
                    </div>
                  </div>

                  <div class="sk-input-group">
                    <label>Método de pago</label>
                    <div class="pago-opts">
                      @for (p of pagoOpts; track p.value) {
                        <button class="pago-btn" [class.active]="factura.metodoPago === p.value" (click)="setMetodoPago(p.value)">
                          <span>{{ p.icon }}</span><span>{{ p.label }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  <div class="sk-input-group">
                    <label>Observación</label>
                    <input class="sk-input" [(ngModel)]="factura.observacion" placeholder="Opcional...">
                  </div>

                  <div class="totales">
                    <div class="total-line"><span>Subtotal</span><span>{{ pedidoSel()!.total | currency:'COP':'$':'1.0-0' }}</span></div>
                    @if ((factura.porcentajeServicio ?? 0) > 0) {
                      <div class="total-line"><span>Servicio ({{ factura.porcentajeServicio }}%)</span><span>{{ valorServicio() | currency:'COP':'$':'1.0-0' }}</span></div>
                    }
                    <div class="total-line grand"><span>TOTAL</span><span>{{ totalFinal() | currency:'COP':'$':'1.0-0' }}</span></div>
                  </div>

                  <button class="sk-btn sk-btn-primary sk-btn-lg sk-btn-full" (click)="cobrar()" [disabled]="facturando() || !factura.metodoPago || !pedidoSel()?.items?.length">
                    @if (facturando()) { <span class="sk-spinner sk-spinner-sm"></span> }
                    💳 Cobrar {{ totalFinal() | currency:'COP':'$':'1.0-0' }}
                  </button>
                </div>

              } @else {
                <!-- TICKET TÉRMICO -->
                <div class="ticket-wrapper" @ticketIn>
                  <div class="ticket">
                    <div class="ticket-logo">SK</div>
                    <div class="ticket-brand">SmartKitchen</div>
                    <div class="ticket-sub">SISTEMA POS</div>
                    <div class="ticket-divider">- - - - - - - - - - - - - - - - - -</div>

                    <div class="ticket-info">
                      <div class="ti-row"><span>Mesa</span><span>{{ facturaGenerada()!.mesaNumero }}</span></div>
                      <div class="ti-row"><span>Atendido por</span><span>{{ facturaGenerada()!.meseroNombre }}</span></div>
                      <div class="ti-row"><span>Fecha</span><span>{{ facturaGenerada()!.fechaPago | date:'dd/MM/yyyy HH:mm' }}</span></div>
                      <div class="ti-row"><span>Factura #</span><span>{{ facturaGenerada()!.id }}</span></div>
                    </div>

                    <div class="ticket-divider">- - - - - - - - - - - - - - - - - -</div>

                    <div class="ticket-items">
                      @for (item of facturaGenerada()!.items; track item.id) {
                        <div class="ticket-item">
                          <div>{{ item.cantidad }}x {{ item.productoNombre }}</div>
                          <div>{{ item.subtotal | currency:'COP':'$':'1.0-0' }}</div>
                        </div>
                      }
                    </div>

                    <div class="ticket-divider">- - - - - - - - - - - - - - - - - -</div>

                    <div class="ticket-totales">
                      <div class="tt-row"><span>Subtotal</span><span>{{ facturaGenerada()!.subtotal | currency:'COP':'$':'1.0-0' }}</span></div>
                      @if (facturaGenerada()!.porcentajeServicio > 0) {
                        <div class="tt-row"><span>Servicio {{ facturaGenerada()!.porcentajeServicio }}%</span><span>{{ facturaGenerada()!.valorServicio | currency:'COP':'$':'1.0-0' }}</span></div>
                      }
                      <div class="tt-row total-final"><span>TOTAL</span><span>{{ facturaGenerada()!.total | currency:'COP':'$':'1.0-0' }}</span></div>
                      <div class="tt-row"><span>Pago</span><span>{{ facturaGenerada()!.metodoPago }}</span></div>
                    </div>

                    <div class="ticket-divider">- - - - - - - - - - - - - - - - - -</div>
                    <div class="ticket-footer">¡Gracias por su visita!</div>
                    <div class="ticket-footer">Vuelva pronto</div>
                  </div>

                  <div class="ticket-actions">
                    <button class="sk-btn sk-btn-ghost" onclick="window.print()">🖨 Imprimir</button>
                    <button class="sk-btn sk-btn-primary" (click)="nuevaFactura()">+ Nueva mesa</button>
                  </div>
                </div>
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .caja-layout { display:grid; grid-template-columns:340px 1fr; gap:1.5rem; height:calc(100vh - 128px); }
    .caja-left { display:flex; flex-direction:column; gap:1rem; overflow:hidden; }
    .caja-right { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; display:flex; flex-direction:column; }

    .mesas-list { display:flex; flex-direction:column; gap:.5rem; overflow-y:auto; flex:1; }
    .mesa-item { display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:all var(--transition-fast); &:hover{border-color:var(--border-active);} &.selected{border-color:var(--primary);background:var(--primary-glow);} }
    .mesa-num-small { width:38px; height:38px; border-radius:var(--radius-md); background:var(--bg-input); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1rem; flex-shrink:0; &.active-num{background:var(--primary);color:#fff;} }
    .mesa-data { flex:1; }
    .mesa-total { font-weight:700; color:var(--primary); font-size:.9rem; }

    .detalle-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid var(--border); }
    .detalle-items { flex:1; overflow-y:auto; padding:.75rem; display:flex; flex-direction:column; gap:.4rem; }
    .detalle-item { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; padding:.65rem .75rem; background:var(--bg-input); border-radius:var(--radius-sm); }

    .factura-form { padding:1rem 1.25rem; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:1rem; }
    .servicio-opts { display:flex; gap:.5rem; }
    .serv-btn { flex:1; padding:.5rem; border-radius:var(--radius-md); background:var(--bg-input); border:1px solid var(--border); color:var(--text-secondary); font-size:.8rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all var(--transition-fast); &.active{background:var(--primary-glow);color:var(--primary);border-color:rgba(255,107,53,.3);} }
    .pago-opts { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
    .pago-btn { display:flex; align-items:center; gap:.5rem; padding:.6rem .75rem; border-radius:var(--radius-md); background:var(--bg-input); border:1px solid var(--border); color:var(--text-secondary); font-size:.8rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all var(--transition-fast); &.active{background:var(--primary-glow);color:var(--primary);border-color:rgba(255,107,53,.3);} }

    .totales { background:var(--bg-input); border-radius:var(--radius-md); padding:.85rem 1rem; display:flex; flex-direction:column; gap:.4rem; }
    .total-line { display:flex; justify-content:space-between; font-size:.875rem; &.grand{font-size:1.1rem;font-weight:800;color:var(--primary);border-top:1px solid var(--border);padding-top:.5rem;margin-top:.25rem;} }

    /* Ticket */
    .ticket-wrapper { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem; height:100%; overflow-y:auto; }
    .ticket { background:#fff; color:#111; width:100%; max-width:320px; padding:1.5rem 1.25rem; border-radius:var(--radius-md); box-shadow:var(--shadow-lg); font-family:'JetBrains Mono',monospace; font-size:.8rem; }
    .ticket-logo { text-align:center; font-size:2rem; font-weight:900; color:#111; }
    .ticket-brand { text-align:center; font-size:1.1rem; font-weight:800; letter-spacing:.05em; }
    .ticket-sub { text-align:center; font-size:.65rem; letter-spacing:.1em; color:#666; margin-bottom:.5rem; }
    .ticket-divider { text-align:center; color:#ccc; margin:.6rem 0; font-size:.75rem; letter-spacing:.05em; }
    .ticket-info { display:flex; flex-direction:column; gap:.25rem; }
    .ti-row { display:flex; justify-content:space-between; }
    .ticket-items { display:flex; flex-direction:column; gap:.25rem; }
    .ticket-item { display:flex; justify-content:space-between; }
    .ticket-totales { display:flex; flex-direction:column; gap:.35rem; }
    .tt-row { display:flex; justify-content:space-between; &.total-final{font-size:1rem;font-weight:900;border-top:2px solid #111;padding-top:.35rem;margin-top:.15rem;} }
    .ticket-footer { text-align:center; color:#666; font-size:.72rem; }
    .ticket-actions { display:flex; gap:1rem; margin-top:1.25rem; }

    @media print { .sk-sidebar,.sk-topbar,.ticket-actions{display:none!important;} .ticket-wrapper{padding:0;} .ticket{box-shadow:none;border-radius:0;} }
  `]
})
export class CajaComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  loading       = signal(true);
  facturando    = signal(false);
  pedidos       = signal<Pedido[]>([]);
  pedidoSel     = signal<Pedido | null>(null);
  facturaGenerada = signal<Factura | null>(null);
  totalHoy      = signal(0);

  factura: Partial<FacturaRequest> & { observacion?: string } = { porcentajeServicio: 0, metodoPago: undefined as any, observacion: '' };

  servicioOpts = [{ value: 0, label: 'Sin servicio' }, { value: 5, label: '5%' }, { value: 10, label: '10%' }];
  pagoOpts     = [{ value: 'EFECTIVO', label: 'Efectivo', icon: '💵' }, { value: 'TARJETA', label: 'Tarjeta', icon: '💳' }, { value: 'TRANSFERENCIA', label: 'Transferencia', icon: '📲' }, { value: 'MIXTO', label: 'Mixto', icon: '🔀' }];

  ngOnInit() { this.cargar(); this.cargarTotalHoy(); }

  cargar() {
    this.loading.set(true);
    this.api.getPedidosAbiertos().subscribe({ next: p => { this.pedidos.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  cargarTotalHoy() {
    this.api.getFacturasHoy().subscribe(r => this.totalHoy.set((r as any).total ?? 0));
  }

  seleccionar(p: Pedido) {
    this.pedidoSel.set(p);
    this.facturaGenerada.set(null);
    this.factura = { porcentajeServicio: 0, metodoPago: undefined as any, observacion: '' };
  }

  calcular() {}
  setMetodoPago(v: string) { this.factura.metodoPago = v as MetodoPago; }

  valorServicio() {
    return (this.pedidoSel()?.total ?? 0) * (this.factura.porcentajeServicio ?? 0) / 100;
  }

  totalFinal() {
    return (this.pedidoSel()?.total ?? 0) + this.valorServicio();
  }

  cobrar() {
    if (!this.factura.metodoPago || !this.pedidoSel()) return;
    this.facturando.set(true);
    const req: FacturaRequest = {
      pedidoId: this.pedidoSel()!.id,
      porcentajeServicio: this.factura.porcentajeServicio ?? 0,
      metodoPago: this.factura.metodoPago as MetodoPago,
      observacion: this.factura.observacion
    };
    this.api.facturar(req).subscribe({
      next: f => {
        this.facturando.set(false);
        this.facturaGenerada.set(f);
        this.cargar();
        this.cargarTotalHoy();
        this.toast.success(`Mesa ${f.mesaNumero} facturada — ${f.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`);
      },
      error: e => { this.facturando.set(false); this.toast.error(e.error?.mensaje ?? 'Error al facturar'); }
    });
  }

  nuevaFactura() { this.pedidoSel.set(null); this.facturaGenerada.set(null); this.cargar(); }
}
