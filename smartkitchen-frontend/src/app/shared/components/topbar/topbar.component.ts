import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'sk-topbar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <header class="sk-topbar">
      <div class="topbar-left">
        <button class="sk-btn sk-btn-ghost sk-btn-icon sk-hamburger" (click)="layout.toggle()">
          <span style="font-size:1.1rem">☰</span>
        </button>
        <div class="topbar-title">
          <h3>{{ title }}</h3>
          @if (subtitle) { <span class="text-muted text-sm">{{ subtitle }}</span> }
        </div>
      </div>
      <div class="topbar-right">
        <div class="time-display">{{ now | date:'HH:mm' }} · {{ now | date:'EEE d MMM' }}</div>
        <div class="notif-btn">
          <span>🔔</span>
          @if (alerts > 0) { <span class="notif-badge">{{ alerts }}</span> }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar-left  { display:flex; align-items:center; gap:.75rem; }
    .topbar-title { display:flex; flex-direction:column; gap:.1rem; h3 { font-size:1.1rem; } }
    .topbar-right { display:flex; align-items:center; gap:1.25rem; }
    .time-display { font-size:.8rem; color:var(--text-muted); font-weight:500; font-family:'JetBrains Mono',monospace; }
    .notif-btn { position:relative; cursor:pointer; font-size:1.1rem; padding:.4rem; border-radius:var(--radius-md); transition:background var(--transition-fast); &:hover{background:var(--bg-hover);} }
    .notif-badge { position:absolute; top:0; right:0; background:var(--danger); color:#fff; font-size:.6rem; font-weight:700; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    @media (max-width: 480px) {
      .time-display { display: none; }
    }
  `]
})
export class TopbarComponent {
  @Input() title    = '';
  @Input() subtitle = '';
  @Input() alerts   = 0;

  layout = inject(LayoutService);
  now = new Date();

  constructor() { setInterval(() => this.now = new Date(), 30000); }
}
