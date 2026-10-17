import { Component, Input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LayoutService } from '../../../core/services/layout.service';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'sk-topbar',
  standalone: true,
  imports: [CommonModule, DatePipe, IconComponent],
  template: `
    <header class="sk-topbar">
      <div class="topbar-left">
        <button class="sk-btn sk-btn-ghost sk-btn-icon sk-hamburger" (click)="layout.toggle()">
          <sk-icon name="menu" [size]="20" />
        </button>
        <div class="topbar-title">
          <h3>{{ title }}</h3>
          @if (subtitle) { <span class="text-muted text-sm">{{ subtitle }}</span> }
        </div>
      </div>
      <div class="topbar-right">
        <div class="time-display"><strong>{{ now | date:'HH:mm' }}</strong><span>{{ now | date:"EEEE d 'de' MMMM" }}</span></div>
        <div class="notif-btn">
          <sk-icon name="bell" [size]="20" />
          @if (alerts > 0) { <span class="notif-badge">{{ alerts }}</span> }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar-left  { display:flex; align-items:center; gap:.75rem; }
    .topbar-title { display:flex; flex-direction:column; gap:.1rem; h3 { font-size:1.15rem; font-weight:700; letter-spacing:-.025em; } }
    .topbar-right { display:flex; align-items:center; gap:1.25rem; }
    .time-display { display:flex; align-items:baseline; gap:.5rem; font-size:.84rem; color:var(--text-muted); font-weight:500; strong { color:var(--text-primary); font-weight:600; font-variant-numeric:tabular-nums; } span { display:inline-block; } span::first-letter { text-transform:uppercase; } }
    .notif-btn { position:relative; cursor:pointer; display:grid; place-items:center; width:40px; height:40px; border-radius:50%; background:#fff; border:1px solid var(--border); color:var(--text-primary); transition:background var(--transition-fast); &:hover{background:var(--bg-hover);} }
    .notif-badge { position:absolute; top:-3px; right:-3px; background:var(--danger); color:#fff; font-size:.6rem; font-weight:700; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
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
