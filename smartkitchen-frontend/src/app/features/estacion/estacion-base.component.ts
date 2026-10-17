import { Component, Input, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { EstacionCard } from '../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-estacion-base',
  standalone: true,
  imports: [CommonModule, DatePipe, SidebarComponent, TopbarComponent, ToastComponent, IconComponent],
  animations: [
    trigger('cardIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px) scale(.96)' }),
        animate('300ms cubic-bezier(.34,1.2,.64,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('250ms ease', style({ opacity: 0, transform: 'scale(.92) translateY(-8px)' }))
      ])
    ]),
    trigger('newAlert', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(1.15)' }),
        animate('400ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <sk-toast></sk-toast>
    <div class="sk-layout">
      <sk-sidebar></sk-sidebar>
      <div class="sk-main">
        <sk-topbar [title]="'Estación ' + titulo" subtitle="Pantalla de producción" [alerts]="newCount()"></sk-topbar>
        <div class="sk-content">

          <!-- Banner de la estación -->
          <section class="banner">
            <img [src]="foto" alt="" />
            <div class="banner__copy">
              <span class="banner__chip"><span class="live"></span> En vivo</span>
              <h1>{{ titulo }}</h1>
              <p>{{ descripcion }}</p>
            </div>
            <div class="banner__stats">
              <div><strong>{{ cards().length }}</strong><span>Mesas</span></div>
              <div><strong>{{ totalPendientes() }}</strong><span>Por preparar</span></div>
            </div>
          </section>

          @if (newCount() > 0) {
            <div class="new-alert" @newAlert>
              <sk-icon name="bell" [size]="18" />
              {{ newCount() }} nuevo{{ newCount() > 1 ? 's' : '' }} pedido{{ newCount() > 1 ? 's' : '' }}
            </div>
          }

          @if (loading()) {
            <div class="flex justify-center" style="padding:4rem"><div class="sk-spinner"></div></div>
          } @else if (cards().length === 0) {
            <div class="empty-state">
              <div class="empty-icon"><sk-icon name="check-circle" /></div>
              <h3>Todo al día</h3>
              <p class="text-muted text-sm">Los pedidos aparecerán aquí en cuanto el mesero los envíe.</p>
            </div>
          } @else {
            <div class="est-grid">
              @for (card of cards(); track card.pedidoId) {
                <article class="ticket" @cardIn [class.urgente]="esUrgente(card)">

                  <header class="ticket__head">
                    <div class="mesa">{{ card.mesaNumero }}</div>
                    <div class="card-meta">
                      <div class="fw-600">Mesa {{ card.mesaNumero }}</div>
                      <div class="text-xs text-muted">{{ card.meseroNombre }}</div>
                    </div>
                    <div class="card-time" [class.urgente-time]="esUrgente(card)">
                      <sk-icon name="clock" [size]="14" />
                      {{ tiempoTranscurrido(card.fechaEnvio) }}
                    </div>
                  </header>
                  @if (esUrgente(card)) { <div class="urgente-tag"><sk-icon name="alert" [size]="14" /> Lleva más de 10 minutos</div> }

                  <div class="est-items">
                    @for (item of card.items; track item.itemId) {
                      <div class="est-item" [class.listo]="item.estado === 'LISTO'">
                        <div class="item-qty">{{ item.cantidad }}</div>
                        <div class="item-det">
                          <div class="item-name">{{ item.productoNombre }}</div>
                          @if (item.observacion) { <div class="item-obs"><sk-icon name="note" [size]="13" /> {{ item.observacion }}</div> }
                        </div>
                        @if (item.estado === 'ENVIADO') {
                          <button class="check" (click)="marcarListo(item.itemId)" [disabled]="actualizando()" aria-label="Marcar listo">
                            <sk-icon name="check" [size]="16" [stroke]="2.2" />
                          </button>
                        } @else if (item.estado === 'LISTO') {
                          <span class="check check--done"><sk-icon name="check" [size]="16" [stroke]="2.2" /></span>
                        }
                      </div>
                    }
                  </div>

                  <footer class="ticket__foot">
                    <span class="pending-count">{{ pendientes(card) }} pendiente{{ pendientes(card) !== 1 ? 's' : '' }} · {{ card.fechaEnvio | date:'HH:mm' }}</span>
                    <button class="sk-btn sk-btn-primary sk-btn-sm" (click)="marcarTodaMesa(card)"
                            [disabled]="actualizando() || pendientes(card) === 0">
                      <sk-icon name="check" [size]="15" [stroke]="2.2" /> Mesa lista
                    </button>
                  </footer>
                </article>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .banner { position: relative; height: 210px; border-radius: 28px; overflow: hidden; margin-bottom: 1.5rem; color: #fff; background: var(--bg-soft-2); }
    .banner img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(19,19,22,.78) 0%, rgba(19,19,22,.25) 70%, rgba(19,19,22,.1) 100%); }
    .banner__copy { position: absolute; z-index: 1; left: 2rem; bottom: 1.75rem; }
    .banner__chip { display: inline-flex; align-items: center; gap: .45rem; padding: 5px 12px; border-radius: 980px; background: rgba(255,255,255,.18); backdrop-filter: blur(10px); font-size: .78rem; font-weight: 600; }
    .live { width: 7px; height: 7px; border-radius: 50%; background: #3ddc84; animation: pulse 1.6s infinite; }
    .banner h1 { color: #fff; font-size: clamp(2rem, 4vw, 2.8rem); letter-spacing: -.045em; margin-top: .7rem; line-height: 1; }
    .banner p { margin-top: .4rem; color: rgba(255,255,255,.82); }
    .banner__stats { position: absolute; z-index: 1; right: 2rem; bottom: 1.75rem; display: flex; gap: 2rem; text-align: right; }
    .banner__stats div { display: flex; flex-direction: column; }
    .banner__stats strong { font-family: var(--display); font-size: 2.2rem; font-weight: 700; letter-spacing: -.04em; line-height: 1; }
    .banner__stats span { font-size: .8rem; color: rgba(255,255,255,.75); margin-top: .3rem; }

    .new-alert { display: flex; align-items: center; gap: .6rem; padding: .8rem 1.1rem; border-radius: var(--radius-md); background: var(--primary-soft); color: var(--primary-dark); font-weight: 600; margin-bottom: 1.25rem; }

    .est-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; align-items: start; }

    .ticket { background: #fff; border: 1px solid var(--border); border-radius: 22px; overflow: hidden; transition: box-shadow var(--transition-base); &:hover { box-shadow: var(--shadow-md); } &.urgente { border-color: rgba(209,67,47,.45); animation: blink 1.6s infinite; } }
    .ticket__head { display: flex; align-items: center; gap: .8rem; padding: 1rem 1.1rem .75rem; }
    .mesa { width: 46px; height: 46px; border-radius: 14px; background: var(--ink); color: #fff; display: grid; place-items: center; font-family: var(--display); font-size: 1.25rem; font-weight: 700; flex-shrink: 0; }
    .card-meta { flex: 1; min-width: 0; }
    .card-time { display: inline-flex; align-items: center; gap: .3rem; font-size: .8rem; color: var(--text-muted); font-weight: 500; font-variant-numeric: tabular-nums; }
    .urgente-time { color: var(--danger); font-weight: 700; }
    .urgente-tag { display: flex; align-items: center; gap: .4rem; margin: 0 1.1rem .5rem; padding: .4rem .7rem; border-radius: 10px; background: var(--danger-bg); color: var(--danger); font-size: .76rem; font-weight: 600; }

    .est-items { padding: 0 .6rem .4rem; display: flex; flex-direction: column; }
    .est-item { display: flex; align-items: center; gap: .75rem; padding: .7rem .5rem; border-top: 1px solid var(--bg-soft); transition: opacity var(--transition-fast); &.listo { opacity: .5; .item-name { text-decoration: line-through; } } }
    .item-qty { width: 30px; height: 30px; border-radius: 10px; background: var(--bg-soft); display: grid; place-items: center; font-weight: 700; font-size: .85rem; flex-shrink: 0; }
    .item-det { flex: 1; min-width: 0; }
    .item-name { font-weight: 600; font-size: .92rem; }
    .item-obs { display: flex; align-items: center; gap: .3rem; margin-top: .15rem; font-size: .76rem; color: var(--warning); }
    .check { width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--border-strong); background: #fff; color: var(--text-muted); display: grid; place-items: center; cursor: pointer; flex-shrink: 0; transition: all var(--transition-fast); &:hover { border-color: var(--success); color: var(--success); background: var(--success-bg); } &:disabled { opacity: .5; } }
    .check--done { border-color: var(--success); background: var(--success); color: #fff; cursor: default; }

    .ticket__foot { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .8rem 1.1rem; background: var(--bg-base); border-top: 1px solid var(--border); }
    .pending-count { font-size: .8rem; color: var(--text-secondary); font-weight: 500; }

    @media (max-width: 767px) {
      .est-grid { grid-template-columns: 1fr; }
      .banner { height:auto; min-height:210px; display:flex; flex-direction:column; justify-content:flex-end; gap:1rem; padding:1.25rem; }
      .banner__copy, .banner__stats { position:relative; left:auto; right:auto; bottom:auto; top:auto; }
      .banner__stats { justify-content:flex-start; text-align:left; gap:1.75rem; padding-top:.9rem; border-top:1px solid rgba(255,255,255,.2); }
      .banner__stats strong { font-size:1.6rem; }
      .banner::after { background: linear-gradient(180deg, rgba(19,19,22,.25) 0%, rgba(19,19,22,.8) 100%); }
    }
  `]
})
export class EstacionBaseComponent implements OnInit, OnDestroy {
  @Input() estacion!: 'cocina' | 'barra' | 'mexico';
  @Input() titulo = '';
  @Input() foto   = '';
  @Input() descripcion = '';

  private api   = inject(ApiService);
  private toast = inject(ToastService);

  cards        = signal<EstacionCard[]>([]);
  loading      = signal(true);
  actualizando = signal(false);
  newCount     = signal(0);

  private interval: any;
  private prevIds = new Set<number>();

  ngOnInit()    { this.cargar(); this.interval = setInterval(() => this.cargar(), 10000); }
  ngOnDestroy() { clearInterval(this.interval); }

  cargar() {
    this.api.getCards(this.estacion).subscribe({
      next: c => {
        const nuevos = c.filter(card => !this.prevIds.has(card.pedidoId)).length;
        this.newCount.set(nuevos);
        if (nuevos > 0) setTimeout(() => this.newCount.set(0), 5000);
        this.prevIds = new Set(c.map(x => x.pedidoId));
        this.cards.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  marcarListo(itemId: number) {
    this.actualizando.set(true);
    this.api.marcarListo(itemId).subscribe({
      next: () => { this.actualizando.set(false); this.cargar(); this.toast.success('Item listo'); },
      error: e  => { this.actualizando.set(false); this.toast.error(e.error?.mensaje ?? 'Error'); }
    });
  }

  marcarTodaMesa(card: EstacionCard) {
    this.actualizando.set(true);
    this.api.marcarTodaMesa(card.pedidoId, this.estacion.toUpperCase()).subscribe({
      next: () => { this.actualizando.set(false); this.cargar(); this.toast.success(`Mesa ${card.mesaNumero} lista`); },
      error: e  => { this.actualizando.set(false); this.toast.error(e.error?.mensaje ?? 'Error'); }
    });
  }

  totalPendientes() { return this.cards().reduce((n, c) => n + this.pendientes(c), 0); }
  pendientes(card: EstacionCard)  { return card.items.filter(i => i.estado === 'ENVIADO').length; }
  esUrgente(card: EstacionCard) {
    if (!card.fechaEnvio) return false;
    return (Date.now() - new Date(card.fechaEnvio).getTime()) > 10 * 60 * 1000;
  }
  tiempoTranscurrido(fecha: string) {
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    return mins < 1 ? 'Ahora' : `${mins} min`;
  }
}
