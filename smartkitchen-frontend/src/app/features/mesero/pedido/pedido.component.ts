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
import { IconComponent } from '../../../shared/components/icon.component';


@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, ToastComponent, IconComponent],
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

      <!-- Pestañas móviles -->
      <div class="mob-tabs">
        <button class="mob-tab" [class.active]="activeTab() === 'productos'" (click)="activeTab.set('productos')">
          <sk-icon name="utensils" [size]="17" /> Carta
        </button>
        <button class="mob-tab" [class.active]="activeTab() === 'pedido'" (click)="activeTab.set('pedido')">
          <sk-icon name="cart" [size]="17" /> Pedido
          @if ((pedido()?.items?.length ?? 0) > 0) {
            <span class="mob-tab-badge">{{ pedido()?.items?.length }}</span>
          }
        </button>
      </div>

      <!-- IZQUIERDA: carta -->
      <div class="prod-panel" [class.mob-hidden]="activeTab() === 'pedido'">
        <div class="prod-header">
          <button class="sk-btn sk-btn-ghost sk-btn-icon" (click)="router.navigate(['/mesero/mesas'])" aria-label="Volver a mesas">
            <sk-icon name="arrow-left" [size]="18" />
          </button>
          <div class="prod-header-info">
            <h3>Mesa {{ pedido()?.mesaNumero }}</h3>
            <span class="text-xs text-muted">Atiende {{ pedido()?.meseroNombre }}</span>
          </div>
          <div class="search">
            <sk-icon class="search__icon" name="search" [size]="17" />
            <input class="sk-input" placeholder="Buscar en la carta" [(ngModel)]="q" (ngModelChange)="filtrar()">
          </div>
        </div>

        <div class="cat-scroll">
          <button class="cat-tab" [class.active]="catActiva === null" (click)="catActiva = null; filtrar()">Todo</button>
          @for (c of categorias(); track c.id) {
            <button class="cat-tab" [class.active]="catActiva === c.id" (click)="catActiva = c.id; filtrar()">{{ c.nombre }}</button>
          }
        </div>

        <div class="prod-grid">
          @for (p of productosFiltrados(); track p.id) {
            <button class="prod-card" @prodEnter (click)="agregarItem(p)" [class.inactive]="!p.activo">
              <div class="prod-img">
                @if (p.imagen) { <img [src]="imgUrl(p.imagen)!" [alt]="p.nombre" loading="lazy"> }
                @else { <sk-icon name="image" [size]="26" /> }
                <span class="prod-add"><sk-icon name="plus" [size]="18" [stroke]="2" /></span>
              </div>
              <div class="prod-info">
                <div class="prod-nombre">{{ p.nombre }}</div>
                <div class="prod-row">
                  <span class="prod-precio">{{ p.precio | currency:'COP':'$':'1.0-0' }}</span>
                  <span class="prod-est">{{ estLabel(p.estacion) }}</span>
                </div>
              </div>
            </button>
          }
          @if (productosFiltrados().length === 0) {
            <div class="no-results">Sin resultados para «{{ q }}»</div>
          }
        </div>
      </div>

      <!-- DERECHA: pedido -->
      <aside class="order-panel" [class.mob-hidden]="activeTab() === 'productos'">
        <div class="order-header">
          <div><h3>Pedido</h3><p>Mesa {{ pedido()?.mesaNumero }}</p></div>
          <span class="sk-badge badge-muted">{{ pedido()?.items?.length ?? 0 }} ítems</span>
        </div>

        <div class="order-items">
          @if (!pedido()?.items?.length) {
            <div class="empty-state" style="padding:3rem 1rem">
              <div class="empty-icon"><sk-icon name="cart" /></div>
              <p class="text-sm">Toca un plato de la carta para agregarlo.</p>
            </div>
          }
          @for (item of pedido()?.items ?? []; track item.id) {
            <div class="order-item" @itemEnter [@itemLeave]="true">
              <div class="item-thumb">
                @if (imgUrl(item.productoImagen); as f) { <img [src]="f" alt=""> } @else { <sk-icon name="image" [size]="16" /> }
              </div>
              <div class="item-info">
                <div class="item-nombre">{{ item.cantidad }} × {{ item.productoNombre }}</div>
                @if (item.observacion) { <div class="item-obs"><sk-icon name="note" [size]="12" /> {{ item.observacion }}</div> }
                <div class="item-estado">
                  <span class="estado" [class]="'estado estado--' + item.estado.toLowerCase()"><i></i>{{ estadoLabel(item.estado) }}</span>
                  @if (item.bloqueado) { <span class="lock" title="Enviado: ya no se puede eliminar"><sk-icon name="lock" [size]="12" /></span> }
                </div>
              </div>
              <div class="item-right">
                <div class="item-precio">{{ item.subtotal | currency:'COP':'$':'1.0-0' }}</div>
                @if (item.estado === 'LISTO') {
                  <button class="sk-btn sk-btn-success sk-btn-sm" (click)="entregar(item)">Entregar</button>
                }
                @if (!item.bloqueado && (item.estado === 'PENDIENTE' || item.estado === 'ENVIADO')) {
                  <button class="remove" (click)="eliminarItem(item)" aria-label="Quitar"><sk-icon name="close" [size]="14" /></button>
                }
              </div>
            </div>
          }
        </div>

        <div class="order-footer">
          <div class="total-row">
            <span>Total</span>
            <span class="total-value">{{ pedido()?.total | currency:'COP':'$':'1.0-0' }}</span>
          </div>
          <button class="sk-btn sk-btn-accent sk-btn-full sk-btn-lg" (click)="enviarAEstaciones()"
                  [disabled]="!tienePendientes() || enviando()">
            @if (enviando()) { <span class="sk-spinner sk-spinner-sm" style="border-top-color:#fff"></span> }
            @else { <sk-icon name="send" [size]="17" /> }
            Enviar a cocina y barra
          </button>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .pedido-layout { display:flex; height:100vh; background:var(--bg-base); overflow:hidden; }

    .mob-tabs { display:none; }
    .mob-tab { flex:1; padding:.85rem .5rem; background:#fff; border:none; border-bottom:2px solid transparent; color:var(--text-secondary); font-weight:600; font-size:.88rem; font-family:inherit; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.45rem; &.active{color:var(--text-primary);border-bottom-color:var(--ink);} }
    .mob-tab-badge { background:var(--primary); color:#fff; font-size:.68rem; font-weight:700; padding:.1rem .45rem; border-radius:999px; }

    /* Carta */
    .prod-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
    .prod-header { display:flex; align-items:center; gap:.9rem; padding:1rem 1.5rem; background:rgba(250,250,247,.85); backdrop-filter:blur(14px); border-bottom:1px solid var(--border); flex-wrap:wrap; }
    .prod-header-info { flex:1; min-width:120px; h3 { font-size:1.3rem; letter-spacing:-.03em; } }
    .search { position:relative; width:min(300px,100%); }
    .search__icon { position:absolute; left:.95rem; top:50%; transform:translateY(-50%); color:var(--text-muted); }
    .search .sk-input { padding-left:2.6rem; border-radius:999px; height:42px; }
    .cat-scroll { display:flex; gap:.45rem; padding:.9rem 1.5rem; overflow-x:auto; flex-shrink:0; &::-webkit-scrollbar{display:none;} }
    .cat-tab { padding:.5rem 1rem; border-radius:999px; font-size:.84rem; font-weight:600; background:#fff; border:1px solid var(--border); color:var(--text-secondary); cursor:pointer; font-family:inherit; white-space:nowrap; transition:all var(--transition-fast); &:hover{color:var(--text-primary);border-color:var(--border-strong);} &.active{background:var(--ink);color:#fff;border-color:var(--ink);} }

    .prod-grid { flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill,minmax(176px,1fr)); grid-auto-rows:max-content; gap:1rem; padding:.25rem 1.5rem 1.5rem; align-content:start; }
    .prod-card { all:unset; box-sizing:border-box; display:block; background:#fff; border:1px solid var(--border); border-radius:20px; overflow:hidden; cursor:pointer; transition:transform var(--transition-base), box-shadow var(--transition-base); &:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);} &:focus-visible{box-shadow:0 0 0 3px var(--primary-glow);} &.inactive{opacity:.5;pointer-events:none;} }
    .prod-img { position:relative; aspect-ratio:4/3; background:var(--bg-soft); color:var(--text-muted); display:flex; align-items:center; justify-content:center; overflow:hidden; img{width:100%;height:100%;object-fit:cover;transition:transform .6s var(--dc-ease-out);} }
    .prod-card:hover .prod-img img { transform:scale(1.05); }
    .prod-add { position:absolute; right:.6rem; bottom:.6rem; width:34px; height:34px; border-radius:50%; background:#fff; color:var(--ink); display:grid; place-items:center; box-shadow:0 4px 14px rgba(19,19,22,.18); transition:transform var(--transition-fast), background var(--transition-fast), color var(--transition-fast); }
    .prod-card:hover .prod-add { background:var(--primary); color:#fff; transform:scale(1.08); }
    .prod-info { padding:.8rem .9rem .9rem; }
    .prod-nombre { font-size:.92rem; font-weight:600; letter-spacing:-.01em; line-height:1.25; }
    .prod-row { display:flex; align-items:center; justify-content:space-between; gap:.5rem; margin-top:.35rem; }
    .prod-precio { font-size:.9rem; font-weight:600; color:var(--text-primary); font-variant-numeric:tabular-nums; }
    .prod-est { font-size:.72rem; color:var(--text-muted); }
    .no-results { grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted); }

    /* Pedido */
    .order-panel { width:360px; display:flex; flex-direction:column; background:#fff; border-left:1px solid var(--border); flex-shrink:0; }
    .order-header { display:flex; align-items:flex-start; justify-content:space-between; padding:1.25rem 1.4rem 1rem; p { font-size:.8rem; color:var(--text-muted); margin-top:.1rem; } }
    .order-items { flex:1; overflow-y:auto; padding:0 .9rem; display:flex; flex-direction:column; }
    .order-item { display:flex; gap:.75rem; padding:.85rem .5rem; border-top:1px solid var(--bg-soft); }
    .item-thumb { width:46px; height:46px; border-radius:12px; overflow:hidden; background:var(--bg-soft); color:var(--text-muted); display:grid; place-items:center; flex-shrink:0; img{width:100%;height:100%;object-fit:cover;} }
    .item-info { flex:1; min-width:0; }
    .item-nombre { font-size:.88rem; font-weight:600; line-height:1.3; }
    .item-obs { display:flex; align-items:center; gap:.25rem; font-size:.74rem; color:var(--warning); margin-top:.15rem; }
    .item-estado { margin-top:.35rem; display:flex; align-items:center; gap:.35rem; }
    .estado { display:inline-flex; align-items:center; gap:.3rem; font-size:.72rem; font-weight:600; color:var(--text-secondary); i { width:6px; height:6px; border-radius:50%; background:var(--text-muted); } }
    .estado--enviado { color:var(--warning); i { background:#e0a020; } }
    .estado--listo { color:var(--success); i { background:var(--success); } }
    .estado--entregado { color:var(--info); i { background:var(--info); } }
    .lock { display:inline-flex; color:var(--text-muted); }
    .item-right { display:flex; flex-direction:column; align-items:flex-end; gap:.4rem; flex-shrink:0; }
    .item-precio { font-size:.88rem; font-weight:600; font-variant-numeric:tabular-nums; }
    .remove { width:26px; height:26px; border-radius:50%; border:none; background:var(--bg-soft); color:var(--text-secondary); display:grid; place-items:center; cursor:pointer; &:hover{background:var(--danger-bg);color:var(--danger);} }

    .order-footer { border-top:1px solid var(--border); padding:1.1rem 1.4rem 1.4rem; display:flex; flex-direction:column; gap:.9rem; }
    .total-row { display:flex; justify-content:space-between; align-items:baseline; span:first-child { color:var(--text-secondary); font-weight:500; } }
    .total-value { font-family:var(--display); font-size:1.7rem; font-weight:700; letter-spacing:-.04em; }

    @media (max-width: 1023px) { .order-panel { width:320px; } }
    @media (max-width: 767px) {
      .pedido-layout { flex-direction:column; height:100dvh; }
      .mob-tabs { display:flex; border-bottom:1px solid var(--border); }
      .mob-hidden { display:none !important; }
      .order-panel { width:100%; flex:1; min-height:0; border-left:none; }
      .prod-header { padding:.75rem 1rem; }
      .search { width:100%; }
      .cat-scroll { padding:.75rem 1rem; }
      .prod-grid { grid-template-columns:repeat(2,1fr); gap:.7rem; padding:.25rem 1rem 1rem; }
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

  estLabel(e: string) { return ({ COCINA: 'Cocina', BARRA: 'Barra', MEXICO: 'México' } as Record<string, string>)[e] ?? e; }
  estadoLabel(e: string) { return ({ PENDIENTE: 'Sin enviar', ENVIADO: 'En preparación', LISTO: 'Listo', ENTREGADO: 'Entregado' } as Record<string, string>)[e] ?? e; }
  estadoBadge(e: string) {
    return { PENDIENTE:'badge-muted', ENVIADO:'badge-warning', LISTO:'badge-success', ENTREGADO:'badge-info' }[e] ?? 'badge-muted';
  }
}
