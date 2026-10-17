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
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, SidebarComponent, TopbarComponent, ToastComponent, IconComponent],
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
        <sk-topbar title="Caja" subtitle="Cobros y facturación" [alerts]="pedidos().length"></sk-topbar>
        <div class="sk-content">

          <div class="caja-layout">

            <!-- LEFT: Mesas activas -->
            <div class="caja-left">
              <div class="ventas">
                <sk-icon name="trend" [size]="22" />
                <span>Vendido hoy</span>
                <strong>{{ totalHoy() | currency:'COP':'$':'1.0-0' }}</strong>
              </div>
              <div class="left-head"><h3>Mesas por cobrar</h3><span>{{ pedidos().length }} abiertas</span></div>

              @if (loading()) {
                <div class="flex justify-center" style="padding:2rem"><div class="sk-spinner"></div></div>
              } @else if (pedidos().length === 0) {
                <div class="empty-state" style="padding:2rem"><div class="empty-icon"><sk-icon name="table" /></div><p>Sin mesas por cobrar</p></div>
              } @else {
                <div class="mesas-list">
                  @for (p of pedidos(); track p.id) {
                    <div class="mesa-item" [class.selected]="pedidoSel()?.id === p.id" (click)="seleccionar(p)">
                      <div class="mesa-num-small" [class.active-num]="pedidoSel()?.id === p.id">{{ p.mesaNumero }}</div>
                      <div class="mesa-data">
                        <div class="fw-600 text-sm">Mesa {{ p.mesaNumero }}</div>
                        <div class="text-xs text-muted">{{ p.meseroNombre }} · {{ p.items.length }} ítems</div>
                      </div>
                      <div class="mesa-total">{{ p.total | currency:'COP':'$':'1.0-0' }}</div>
                    </div>
                  }
                </div>
              }

            </div>

            <!-- RIGHT: Detalle y facturación -->
            <div class="caja-right">
              @if (!pedidoSel()) {
                <div class="empty-state" style="height:100%">
                  <div class="empty-icon"><sk-icon name="receipt" /></div>
                  <h3>Elige una mesa</h3>
                  <p class="text-sm">Selecciona una mesa de la lista para ver su cuenta y cobrar.</p>
                </div>
              } @else if (!facturaGenerada()) {
                <!-- Detalle del pedido -->
                <div class="detalle-header">
                  <h3>Cuenta · Mesa {{ pedidoSel()!.mesaNumero }}</h3>
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
                    <div class="seg">
                      @for (s of servicioOpts; track s.value) {
                        <button class="serv-btn" [class.active]="factura.porcentajeServicio === s.value" (click)="factura.porcentajeServicio = s.value; calcular()">{{ s.label }}</button>
                      }
                    </div>
                  </div>

                  <div class="sk-input-group full">
                    <label>Método de pago</label>
                    <div class="pago-opts">
                      @for (p of pagoOpts; track p.value) {
                        <button class="pago-btn" [class.active]="factura.metodoPago === p.value" (click)="setMetodoPago(p.value)">
                          <sk-icon [name]="p.icon" [size]="20" /><span>{{ p.label }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  <div class="sk-input-group">
                    <label>Observación</label>
                    <input class="sk-input" [(ngModel)]="factura.observacion" placeholder="Opcional">
                  </div>

                  <div class="totales">
                    <div class="total-line"><span>Subtotal</span><span>{{ pedidoSel()!.total | currency:'COP':'$':'1.0-0' }}</span></div>
                    @if ((factura.porcentajeServicio ?? 0) > 0) {
                      <div class="total-line"><span>Servicio ({{ factura.porcentajeServicio }}%)</span><span>{{ valorServicio() | currency:'COP':'$':'1.0-0' }}</span></div>
                    }
                    <div class="total-line grand"><span>Total</span><span>{{ totalFinal() | currency:'COP':'$':'1.0-0' }}</span></div>
                  </div>

                  <button class="sk-btn sk-btn-primary sk-btn-lg sk-btn-full full cobrar" (click)="cobrar()" [disabled]="facturando() || !factura.metodoPago || !pedidoSel()?.items?.length">
                    @if (facturando()) { <span class="sk-spinner sk-spinner-sm"></span> }
                    Cobrar {{ totalFinal() | currency:'COP':'$':'1.0-0' }}
                  </button>
                </div>

              } @else {
                <!-- TICKET TÉRMICO -->
                <div class="ticket-wrapper" @ticketIn>
                  <div class="ok"><sk-icon name="check-circle" [size]="20" /> Pago registrado</div>
                  <div class="ticket">
                    <div class="ticket-logo">SK</div>
                    <div class="ticket-brand">SmartKitchen</div>
                    <div class="ticket-sub">Restaurante · Medellín</div>
                    <div class="ticket-divider"></div>

                    <div class="ticket-info">
                      <div class="ti-row"><span>Mesa</span><span>{{ facturaGenerada()!.mesaNumero }}</span></div>
                      <div class="ti-row"><span>Atendido por</span><span>{{ facturaGenerada()!.meseroNombre }}</span></div>
                      <div class="ti-row"><span>Fecha</span><span>{{ facturaGenerada()!.fechaPago | date:'dd/MM/yyyy HH:mm' }}</span></div>
                      <div class="ti-row"><span>Factura #</span><span>{{ facturaGenerada()!.id }}</span></div>
                    </div>

                    <div class="ticket-divider"></div>

                    <div class="ticket-items">
                      @for (item of facturaGenerada()!.items; track item.id) {
                        <div class="ticket-item">
                          <div>{{ item.cantidad }}x {{ item.productoNombre }}</div>
                          <div>{{ item.subtotal | currency:'COP':'$':'1.0-0' }}</div>
                        </div>
                      }
                    </div>

                    <div class="ticket-divider"></div>

                    <div class="ticket-totales">
                      <div class="tt-row"><span>Subtotal</span><span>{{ facturaGenerada()!.subtotal | currency:'COP':'$':'1.0-0' }}</span></div>
                      @if (facturaGenerada()!.porcentajeServicio > 0) {
                        <div class="tt-row"><span>Servicio {{ facturaGenerada()!.porcentajeServicio }}%</span><span>{{ facturaGenerada()!.valorServicio | currency:'COP':'$':'1.0-0' }}</span></div>
                      }
                      <div class="tt-row total-final"><span>TOTAL</span><span>{{ facturaGenerada()!.total | currency:'COP':'$':'1.0-0' }}</span></div>
                      <div class="tt-row"><span>Pago</span><span>{{ facturaGenerada()!.metodoPago }}</span></div>
                    </div>

                    <div class="ticket-divider"></div>
                    <div class="ticket-footer">¡Gracias por su visita!</div>
                    <div class="ticket-footer">Vuelva pronto</div>
                  </div>

                  <div class="ticket-actions">
                    <button class="sk-btn sk-btn-ghost" onclick="window.print()"><sk-icon name="printer" [size]="17" /> Imprimir</button>
                    <button class="sk-btn sk-btn-primary" (click)="nuevaFactura()">Siguiente mesa <sk-icon name="arrow-right" [size]="16" /></button>
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
    .caja-layout { display:grid; grid-template-columns:340px 1fr; gap:1.25rem; height:calc(100vh - 132px); min-height:560px; }
    .caja-left { display:flex; flex-direction:column; gap:1rem; overflow:hidden; }
    .caja-right { background:#fff; border:1px solid var(--border); border-radius:24px; overflow:hidden; display:flex; flex-direction:column; }
    .left-head { display:flex; align-items:baseline; justify-content:space-between; h3 { font-size:1.15rem; } span { font-size:.82rem; color:var(--text-muted); } }

    .ventas { position:relative; border-radius:22px; padding:1.25rem 1.3rem; background:var(--ink); color:#fff; overflow:hidden; flex-shrink:0; }
    .ventas span { font-size:.8rem; color:rgba(255,255,255,.65); }
    .ventas strong { display:block; margin-top:.35rem; font-family:var(--display); font-size:1.9rem; font-weight:700; letter-spacing:-.04em; }
    .ventas sk-icon { position:absolute; right:1.1rem; top:1.1rem; color:var(--primary); }

    .mesas-list { display:flex; flex-direction:column; gap:.5rem; overflow-y:auto; flex:1; padding-bottom:.25rem; }
    .mesa-item { display:flex; align-items:center; gap:.8rem; padding:.85rem 1rem; background:#fff; border:1px solid var(--border); border-radius:16px; cursor:pointer; transition:all var(--transition-fast); &:hover{border-color:var(--border-strong);box-shadow:var(--shadow-sm);} &.selected{border-color:var(--ink);box-shadow:0 0 0 1px var(--ink);} }
    .mesa-num-small { width:40px; height:40px; border-radius:12px; background:var(--bg-soft); display:flex; align-items:center; justify-content:center; font-family:var(--display); font-weight:700; flex-shrink:0; &.active-num{background:var(--ink);color:#fff;} }
    .mesa-data { flex:1; min-width:0; }
    .mesa-total { font-weight:600; font-size:.9rem; font-variant-numeric:tabular-nums; }

    .detalle-header { display:flex; align-items:baseline; justify-content:space-between; padding:1.25rem 1.5rem 1rem; h3 { font-size:1.3rem; letter-spacing:-.03em; } }
    .detalle-items { flex:1; overflow-y:auto; padding:0 1.5rem; display:flex; flex-direction:column; }
    .detalle-item { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:.75rem 0; border-top:1px solid var(--bg-soft); }
    .text-right { text-align:right; }

    .factura-form { padding:1.25rem 1.5rem 1.5rem; border-top:1px solid var(--border); background:var(--bg-base); display:grid; grid-template-columns:1fr 1fr; gap:1rem 1.5rem; }
    .factura-form .full { grid-column:1/-1; }
    .seg { display:flex; gap:.2rem; background:var(--bg-soft-2); padding:.25rem; border-radius:999px; }
    .serv-btn { flex:1; padding:.5rem; border-radius:999px; background:none; border:none; color:var(--text-secondary); font-size:.82rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all var(--transition-fast); &.active{background:#fff;color:var(--text-primary);box-shadow:0 1px 3px rgba(19,19,22,.12);} }
    .pago-opts { display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; }
    .pago-btn { display:flex; flex-direction:column; align-items:center; gap:.4rem; padding:.7rem .4rem; border-radius:14px; background:#fff; border:1px solid var(--border); color:var(--text-secondary); font-size:.78rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all var(--transition-fast); &:hover{border-color:var(--border-strong);} &.active{border-color:var(--ink);color:var(--text-primary);box-shadow:0 0 0 1px var(--ink);} }

    .totales { display:flex; flex-direction:column; gap:.4rem; justify-content:flex-end; }
    .total-line { display:flex; justify-content:space-between; font-size:.88rem; color:var(--text-secondary); &.grand{color:var(--text-primary);font-family:var(--display);font-size:1.6rem;font-weight:700;letter-spacing:-.04em;padding-top:.35rem;} }
    .cobrar { align-self:end; height:56px; }

    /* Ticket */
    .ticket-wrapper { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem; height:100%; overflow-y:auto; background:var(--bg-base); }
    .ok { display:flex; align-items:center; gap:.5rem; margin-bottom:1.25rem; color:var(--success); font-weight:600; }
    .ticket { background:#fff; color:#111; width:100%; max-width:320px; padding:1.5rem 1.25rem; border-radius:16px; border:1px solid var(--border); box-shadow:var(--shadow-md); font-family:'JetBrains Mono',monospace; font-size:.8rem; }
    .ticket-logo { width:40px; height:40px; margin:0 auto .5rem; border-radius:12px; background:var(--ink); color:#fff; display:grid; place-items:center; font-family:var(--display); font-weight:800; font-size:.9rem; }
    .ticket-brand { text-align:center; font-family:var(--display); font-size:1.05rem; font-weight:700; letter-spacing:-.02em; }
    .ticket-sub { text-align:center; font-size:.68rem; color:#888; margin-bottom:.5rem; }
    .ticket-divider { border-top:1px dashed #d6d4cd; margin:.75rem 0; }
    .ticket-info, .ticket-items, .ticket-totales { display:flex; flex-direction:column; gap:.3rem; }
    .ti-row, .ticket-item { display:flex; justify-content:space-between; gap:.75rem; }
    .tt-row { display:flex; justify-content:space-between; &.total-final{font-size:1rem;font-weight:800;border-top:1.5px solid #111;padding-top:.4rem;margin-top:.15rem;} }
    .ticket-footer { text-align:center; color:#888; font-size:.72rem; }
    .ticket-actions { display:flex; gap:.75rem; margin-top:1.25rem; }

    @media (max-width: 1100px) { .factura-form { grid-template-columns:1fr; } .cobrar { align-self:stretch; } }
    @media (max-width: 900px) {
      .caja-layout { grid-template-columns:1fr; height:auto; }
      .caja-left { overflow:visible; }
      .caja-right { min-height:420px; }
      .pago-opts { grid-template-columns:repeat(2,1fr); }
    }
    @media print { .sk-sidebar,.sk-topbar,.ticket-actions,.ok{display:none!important;} .ticket-wrapper{padding:0;} .ticket{box-shadow:none;border:none;} }
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
  pagoOpts     = [{ value: 'EFECTIVO', label: 'Efectivo', icon: 'cash' }, { value: 'TARJETA', label: 'Tarjeta', icon: 'card' }, { value: 'TRANSFERENCIA', label: 'Transferencia', icon: 'phone' }, { value: 'MIXTO', label: 'Mixto', icon: 'split' }];

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
