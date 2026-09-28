import { Component, inject, OnInit, signal, Input, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { productImageUrl } from '../../../core/utils/img';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { Pedido, Producto, Categoria, ItemPedido } from '../../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';


@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, ToastComponent],
  animations: [
    trigger('itemEnter', [
      transition(':enter', [style({ opacity: 0, transform: 'translateX(16px)' }), animate('200ms ease', style({ opacity: 1, transform: 'translateX(0)' }))])
    ]),
    trigger('itemLeave', [
      transition(':leave', [animate('150ms ease', style({ opacity: 0, transform: 'translateX(-16px)' }))])
    ]),
    trigger('prodEnter', [
      transition(':enter', [style({ opacity: 0, transform: 'scale(.9)' }), animate('180ms ease', style({ opacity: 1, transform: 'scale(1)' }))])
    ])
  ],
  template: `
    <sk-toast></sk-toast>
    <div class="pedido-layout">

      <!-- Mobile tab bar -->
      <div class="mob-tabs">
        <button class="mob-tab" [class.active]="activeTab() === 'productos'" (click)="activeTab.set('productos')">
          🍽 Menú
        </button>
        <button class="mob-tab" [class.active]="activeTab() === 'pedido'" (click)="activeTab.set('pedido')">
          🛒 Pedido
          @if ((pedido()?.items?.length ?? 0) > 0) {
            <span class="mob-tab-badge">{{ pedido()?.items?.length }}</span>
          }
        </button>
      </div>

      <!-- LEFT: Productos -->
      <div class="prod-panel" [class.mob-hidden]="activeTab() === 'pedido'">
        <!-- Header -->
        <div class="prod-header">
          <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="router.navigate(['/mesero/mesas'])">←</button>
          <div class="prod-header-info">
            <h3>Mesa {{ pedido()?.mesaNumero }}</h3>
            <span class="text-xs text-muted">{{ pedido()?.meseroNombre }}</span>
          </div>
          <button class="sk-btn sk-btn-primary sk-btn-sm" (click)="enviarAEstaciones()"
                  [disabled]="!tienePendientes() || enviando()">
            @if (enviando()) { <span class="sk-spinner sk-spinner-sm"></span> }
            📤 Enviar
          </button>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="sk-input" style="padding-left:2.5rem" placeholder="Buscar plato o bebida..."
                 [(ngModel)]="q" (ngModelChange)="filtrar()">
        </div>

        <!-- Category tabs -->
        <div class="cat-scroll">
          <button class="cat-tab" [class.active]="catActiva === null" (click)="catActiva = null; filtrar()">Todos</button>
          @for (c of categorias(); track c.id) {
            <button class="cat-tab" [class.active]="catActiva === c.id" (click)="catActiva = c.id; filtrar()">
              {{ estIcon(c.estacion) }} {{ c.nombre }}
            </button>
          }
        </div>

        <!-- Product grid -->
        <div class="prod-grid">
          @for (p of productosFiltrados(); track p.id) {
            <div class="prod-card" @prodEnter (click)="agregarItem(p)" [class.inactive]="!p.activo">
              <div class="prod-img">
                @if (p.imagen) { <img [src]="imgUrl(p.imagen)!" [alt]="p.nombre"> }
                @else { <span class="prod-emoji">{{ estEmoji(p.estacion) }}</span> }
              </div>
              <div class="prod-info">
                <div class="prod-nombre">{{ p.nombre }}</div>
                <div class="prod-precio">{{ p.precio | currency:'COP':'$':'1.0-0' }}</div>
                <span class="prod-est">{{ p.estacion }}</span>
              </div>
              <div class="prod-add">+</div>
            </div>
          }
          @if (productosFiltrados().length === 0) {
            <div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">Sin resultados</div>
          }
        </div>
      </div>

      <!-- RIGHT: Pedido actual -->
      <div class="order-panel" [class.mob-hidden]="activeTab() === 'productos'">
        <div class="order-header">
          <h4>Pedido actual</h4>
          <span class="sk-badge badge-primary">{{ pedido()?.items?.length ?? 0 }} items</span>
        </div>

        <div class="order-items">
          @if (!pedido()?.items?.length) {
            <div class="empty-state" style="padding:2rem"><div class="empty-icon">🛒</div><p class="text-sm">Agrega productos al pedido</p></div>
          }
          @for (item of pedido()?.items ?? []; track item.id) {
            <div class="order-item" @itemEnter [@itemLeave]="true" [class.bloqueado]="item.bloqueado">
              <div class="item-info">
                <div class="item-nombre">{{ item.productoNombre }}</div>
                <div class="item-qty">× {{ item.cantidad }}</div>
                @if (item.observacion) { <div class="item-obs">💬 {{ item.observacion }}</div> }
                <div class="item-estado">
                  <span class="sk-badge badge-xs" [class]="estadoBadge(item.estado)">{{ item.estado }}</span>
                  @if (item.bloqueado) { <span class="sk-badge badge-xs badge-warning">🔒</span> }
                </div>
              </div>
              <div class="item-right">
                <div class="item-precio">{{ item.subtotal | currency:'COP':'$':'1.0-0' }}</div>
                @if (item.estado === 'LISTO') {
                  <button class="sk-btn sk-btn-success sk-btn-sm" (click)="entregar(item)">Entregar</button>
                }
                @if (!item.bloqueado && (item.estado === 'PENDIENTE' || item.estado === 'ENVIADO')) {
                  <button class="sk-btn sk-btn-danger sk-btn-icon" style="width:28px;height:28px;font-size:.75rem" (click)="eliminarItem(item)">✕</button>
                }
                @if (item.bloqueado) { <span title="Enviado, no eliminable" style="font-size:1rem;opacity:.5">🔒</span> }
              </div>
            </div>
          }
        </div>

        <!-- Total -->
        <div class="order-footer">
          <div class="total-row">
            <span class="text-muted">Total</span>
            <span class="total-value">{{ pedido()?.total | currency:'COP':'$':'1.0-0' }}</span>
          </div>
          <button class="sk-btn sk-btn-success sk-btn-full sk-btn-lg" (click)="enviarAEstaciones()"
                  [disabled]="!tienePendientes() || enviando()">
            @if (enviando()) { <span class="sk-spinner sk-spinner-sm"></span> }
            📤 Enviar a cocina/barra
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pedido-layout { display:flex; height:100vh; background:var(--bg-base); overflow:hidden; flex-direction:row; }

    /* Mobile tabs (ocultos en desktop) */
    .mob-tabs { display:none; }
    .mob-tab { flex:1; padding:.75rem .5rem; background:var(--bg-surface); border:none; border-bottom:2px solid var(--border); color:var(--text-secondary); font-weight:600; font-size:.85rem; font-family:inherit; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.4rem; transition:all var(--transition-fast); position:relative; &.active{color:var(--primary);border-bottom-color:var(--primary);background:var(--bg-card);} }
    .mob-tab-badge { background:var(--primary); color:#fff; font-size:.65rem; font-weight:700; padding:.1rem .4rem; border-radius:var(--radius-full); min-width:18px; text-align:center; }

    /* LEFT */
    .prod-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; border-right:1px solid var(--border); }
    .prod-header { display:flex; align-items:center; gap:.75rem; padding:1rem 1.25rem; border-bottom:1px solid var(--border); background:var(--bg-surface); flex-wrap:wrap; }
    .prod-header-info { flex:1; min-width:0; }
    .search-bar { position:relative; padding:.75rem 1rem; .search-icon{position:absolute;left:1.85rem;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:.9rem;} }
    .cat-scroll { display:flex; gap:.5rem; padding:.5rem 1rem; overflow-x:auto; border-bottom:1px solid var(--border); &::-webkit-scrollbar{display:none;} }
    .cat-tab { padding:.35rem .9rem; border-radius:var(--radius-full); font-size:.78rem; font-weight:600; background:var(--bg-input); border:1px solid var(--border); color:var(--text-secondary); cursor:pointer; font-family:inherit; white-space:nowrap; transition:all var(--transition-fast); &:hover{color:var(--text-primary);} &.active{background:var(--primary-glow);color:var(--primary);border-color:rgba(255,107,53,.3);} }
    .prod-grid { flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:.75rem; padding:1rem; align-content:start; }
    .prod-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; cursor:pointer; transition:all var(--transition-base); position:relative; &:hover{border-color:var(--primary);transform:translateY(-2px);box-shadow:var(--shadow-primary);} &.inactive{opacity:.5;pointer-events:none;} }
    .prod-img { aspect-ratio:4/3; background:var(--bg-input); display:flex; align-items:center; justify-content:center; overflow:hidden; img{width:100%;height:100%;object-fit:cover;} }
    .prod-emoji { font-size:2rem; }
    .prod-info { padding:.65rem .75rem; }
    .prod-nombre { font-size:.825rem; font-weight:600; margin-bottom:.2rem; }
    .prod-precio { font-size:.85rem; color:var(--primary); font-weight:700; }
    .prod-est { font-size:.65rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.04em; }
    .prod-add { position:absolute; top:.5rem; right:.5rem; width:24px; height:24px; background:var(--primary); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:700; opacity:0; transition:opacity var(--transition-fast); }
    .prod-card:hover .prod-add { opacity:1; }

    /* RIGHT */
    .order-panel { width:320px; display:flex; flex-direction:column; background:var(--bg-surface); flex-shrink:0; }
    .order-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid var(--border); }
    .order-items { flex:1; overflow-y:auto; padding:.75rem; display:flex; flex-direction:column; gap:.5rem; }
    .order-item { display:flex; gap:.75rem; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:.75rem; transition:border-color var(--transition-fast); &.bloqueado{border-color:rgba(253,203,110,.2);background:rgba(253,203,110,.04);} }
    .item-info { flex:1; min-width:0; }
    .item-nombre { font-size:.85rem; font-weight:600; }
    .item-qty { font-size:.78rem; color:var(--text-muted); }
    .item-obs { font-size:.72rem; color:var(--text-muted); margin-top:.15rem; }
    .item-estado { margin-top:.3rem; display:flex; gap:.3rem; flex-wrap:wrap; }
    .badge-xs { font-size:.65rem; padding:.15rem .45rem; }
    .item-right { display:flex; flex-direction:column; align-items:flex-end; gap:.35rem; flex-shrink:0; }
    .item-precio { font-size:.85rem; font-weight:700; color:var(--primary); }

    .order-footer { border-top:1px solid var(--border); padding:1rem 1.25rem; display:flex; flex-direction:column; gap:.75rem; }
    .total-row { display:flex; justify-content:space-between; align-items:center; }
    .total-value { font-size:1.4rem; font-weight:800; color:var(--primary); }

    /* Responsive */
    @media (max-width: 767px) {
      .pedido-layout { flex-direction:column; height:100dvh; }
      .mob-tabs { display:flex; border-bottom:1px solid var(--border); }
      .mob-hidden { display:none !important; }
      .order-panel { width:100%; }
      .prod-grid { grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); }
    }
    @media (max-width: 480px) {
      .prod-grid { grid-template-columns:repeat(2,1fr); }
      .prod-header { padding:.75rem 1rem; }
    }
  `]
})
export class PedidoComponent implements OnInit, OnDestroy {
  @Input() id!: string;
  imgUrl = productImageUrl;

  router   = inject(Router);
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  pedido   = signal<Pedido | null>(null);
  productos= signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  enviando = signal(false);
  activeTab = signal<'productos' | 'pedido'>('productos');

  private interval: any;
  q: string = '';
  catActiva: number | null = null;

  tienePendientes() { return this.pedido()?.items?.some(i => i.estado === 'PENDIENTE') ?? false; }

  ngOnInit() {
    this.api.getCategorias().subscribe(c => this.categorias.set(c));
    this.api.getProductos().subscribe(p => { this.productos.set(p); this.filtrar(); });
    this.cargarPedido();
    // Refresca estados (enviado → listo) y el bloqueo de 2 minutos mientras el mesero está en la vista.
    this.interval = setInterval(() => this.cargarPedido(), 10000);
  }

  ngOnDestroy() { clearInterval(this.interval); }

  cargarPedido() {
    this.api.getPedido(+this.id).subscribe({
      next: p => this.pedido.set(p),
      error: () => this.toast.error('No se pudo cargar el pedido')
    });
  }

  filtrar() {
    let f = this.productos();
    if (this.q) f = f.filter(p => p.nombre.toLowerCase().includes(this.q.toLowerCase()));
    if (this.catActiva) f = f.filter(p => p.categoriaId === this.catActiva);
    this.productosFiltrados.set(f);
  }

  agregarItem(p: Producto) {
    this.api.agregarItem(+this.id, { productoId: p.id, cantidad: 1 }).subscribe({
      next: ped => {
        this.pedido.set(ped);
        this.toast.success(`${p.nombre} agregado`);
      },
      error: e => this.toast.error(e.error?.mensaje ?? 'Error al agregar')
    });
  }

  eliminarItem(item: ItemPedido) {
    if (item.bloqueado) { this.toast.warning('Este item ya no puede eliminarse'); return; }
    this.api.eliminarItem(+this.id, item.id).subscribe({
      next: ped => this.pedido.set(ped),
      error: e  => this.toast.error(e.error?.mensaje ?? 'Error al eliminar')
    });
  }

  entregar(item: ItemPedido) {
    this.api.marcarEntregado(item.id).subscribe({
      next: () => { this.toast.success(`${item.productoNombre} entregado`); this.cargarPedido(); },
      error: e => this.toast.error(e.error?.mensaje ?? 'Error al marcar entregado')
    });
  }

  enviarAEstaciones() {
    this.enviando.set(true);
    this.api.enviarAEstaciones(+this.id).subscribe({
      next: ped => {
        this.enviando.set(false);
        this.pedido.set(ped);
        this.toast.success('Pedido enviado a las estaciones');
        this.activeTab.set('productos');
      },
      error: e => { this.enviando.set(false); this.toast.error(e.error?.mensaje ?? 'Error al enviar'); }
    });
  }

  estIcon(e: string)  { return { COCINA:'🍳', BARRA:'🍹', MEXICO:'🌮' }[e] ?? ''; }
  estEmoji(e: string) { return { COCINA:'🍖', BARRA:'🥤', MEXICO:'🌮' }[e] ?? '🍽'; }
  estadoBadge(e: string) {
    return { PENDIENTE:'badge-muted', ENVIADO:'badge-warning', LISTO:'badge-success', ENTREGADO:'badge-info' }[e] ?? 'badge-muted';
  }
}
