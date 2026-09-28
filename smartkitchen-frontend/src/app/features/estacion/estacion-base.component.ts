import { Component, Input, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { EstacionCard } from '../../core/models/models';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-estacion-base',
  standalone: true,
  imports: [CommonModule, DatePipe, SidebarComponent, TopbarComponent, ToastComponent],
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
        <sk-topbar [title]="icono + ' ' + titulo"
                   [subtitle]="cards().length + ' pedido' + (cards().length !== 1 ? 's' : '') + ' pendiente' + (cards().length !== 1 ? 's' : '')"
                   [alerts]="newCount()"></sk-topbar>
        <div class="sk-content">

          <!-- Nuevo pedido alert -->
          @if (newCount() > 0) {
            <div class="new-alert" @newAlert [style.borderColor]="color" [style.color]="color">
              🔔 {{ newCount() }} nuevo{{ newCount() > 1 ? 's' : '' }} pedido{{ newCount() > 1 ? 's' : '' }}
            </div>
          }

          @if (loading()) {
            <div class="flex justify-center" style="padding:4rem"><div class="sk-spinner"></div></div>
          } @else if (cards().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">{{ icono }}</div>
              <h3>Sin pedidos pendientes</h3>
              <p class="text-muted text-sm">Los pedidos aparecerán aquí cuando sean enviados</p>
            </div>
          } @else {
            <div class="est-grid">
              @for (card of cards(); track card.pedidoId) {
                <div class="est-card" @cardIn [style.borderTopColor]="color" [class.urgente]="esUrgente(card)">

                  <div class="est-card-header" [style.background]="color + '15'">
                    <div class="mesa-badge-big" [style.background]="color + '22'" [style.color]="color">
                      {{ card.mesaNumero }}
                    </div>
                    <div class="card-meta">
                      <div class="fw-600">Mesa {{ card.mesaNumero }}</div>
                      <div class="text-xs text-muted">{{ card.meseroNombre }}</div>
                    </div>
                    <div class="card-header-right">
                      <div class="card-time" [class.urgente-time]="esUrgente(card)">
                        {{ card.fechaEnvio | date:'HH:mm' }}
                        @if (esUrgente(card)) { <span class="urgente-tag">⚠ URGENTE</span> }
                      </div>
                    </div>
                  </div>

                  <div class="est-items">
                    @for (item of card.items; track item.itemId) {
                      <div class="est-item" [class.listo]="item.estado === 'LISTO'">
                        <div class="item-qty-badge">{{ item.cantidad }}×</div>
                        <div class="item-det">
                          <div class="fw-600 text-sm">{{ item.productoNombre }}</div>
                          @if (item.observacion) { <div class="item-obs">💬 {{ item.observacion }}</div> }
                        </div>
                        <div class="item-est">
                          @if (item.estado === 'ENVIADO') {
                            <button class="sk-btn sk-btn-success sk-btn-sm"
                                    (click)="marcarListo(item.itemId)"
                                    [disabled]="actualizando()">✓</button>
                          } @else if (item.estado === 'LISTO') {
                            <span class="sk-badge badge-success" style="font-size:.65rem">✓</span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <div class="est-card-footer">
                    <span class="pending-count">
                      {{ pendientes(card) }} pendiente{{ pendientes(card) !== 1 ? 's' : '' }}
                    </span>
                    <div class="footer-right">
                      <span class="time-ago">{{ tiempoTranscurrido(card.fechaEnvio) }}</span>
                      <button class="sk-btn sk-btn-success sk-btn-sm mesa-lista-btn"
                              (click)="marcarTodaMesa(card)"
                              [disabled]="actualizando() || pendientes(card) === 0">
                        ✓✓ Mesa lista
                      </button>
                    </div>
                  </div>

                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .new-alert { padding:.75rem 1.25rem; border-radius:var(--radius-md); border:1px solid; background:rgba(255,107,53,.05); font-weight:600; margin-bottom:1.5rem; animation: blink 2s infinite; }

    .est-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.25rem; }

    .est-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; border-top:3px solid; transition:box-shadow var(--transition-base); &:hover{box-shadow:var(--shadow-md);} &.urgente{animation:blink 1.5s infinite;} }
    .est-card-header { display:flex; align-items:center; gap:.75rem; padding:.85rem 1rem; }
    .mesa-badge-big { width:44px; height:44px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-size:1.25rem; font-weight:800; flex-shrink:0; }
    .card-meta { flex:1; min-width:0; }
    .card-header-right { flex-shrink:0; text-align:right; }
    .card-time { font-size:.78rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace; }
    .urgente-time { color:var(--danger); font-weight:700; }
    .urgente-tag { display:block; font-size:.65rem; background:var(--danger-bg); color:var(--danger); padding:.1rem .35rem; border-radius:var(--radius-full); margin-top:.2rem; }

    .est-items { padding:.5rem; display:flex; flex-direction:column; gap:.35rem; }
    .est-item { display:flex; align-items:center; gap:.65rem; padding:.6rem .75rem; border-radius:var(--radius-md); background:var(--bg-input); transition:all var(--transition-fast); &.listo{background:var(--success-bg);opacity:.65;} }
    .item-qty-badge { width:28px; height:28px; border-radius:50%; background:var(--bg-elevated); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.8rem; flex-shrink:0; }
    .item-det { flex:1; min-width:0; }
    .item-obs { font-size:.72rem; color:var(--text-muted); }
    .item-est { flex-shrink:0; }

    .est-card-footer { display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.65rem 1rem; border-top:1px solid var(--border); flex-wrap:wrap; }
    .pending-count { font-size:.78rem; color:var(--warning); font-weight:600; }
    .footer-right { display:flex; align-items:center; gap:.65rem; margin-left:auto; }
    .time-ago { font-size:.72rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace; }
    .mesa-lista-btn { white-space:nowrap; }

    @media (max-width: 767px) {
      .est-grid { grid-template-columns: 1fr; }
    }
    @media (min-width: 768px) and (max-width: 1100px) {
      .est-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    }
  `]
})
export class EstacionBaseComponent implements OnInit, OnDestroy {
  @Input() estacion!: 'cocina' | 'barra' | 'mexico';
  @Input() titulo = '';
  @Input() icono  = '';
  @Input() color  = 'var(--primary)';

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
