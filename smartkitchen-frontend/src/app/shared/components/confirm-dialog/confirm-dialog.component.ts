import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'sk-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('overlay', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms', style({ opacity: 0 }))])
    ]),
    trigger('modal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(.94) translateY(16px)' }),
        animate('250ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="sk-overlay" @overlay (click)="cancel.emit()">
      <div class="sk-modal confirm-modal" @modal (click)="$event.stopPropagation()">
        <div class="confirm-icon" [class]="'icon-' + type">{{ icons[type] }}</div>
        <h3>{{ title }}</h3>
        <p class="text-muted text-sm mt-1">{{ message }}</p>
        <div class="sk-modal-footer">
          <button class="sk-btn sk-btn-ghost" (click)="cancel.emit()">Cancelar</button>
          <button class="sk-btn" [class]="'sk-btn-' + (type === 'danger' ? 'danger' : 'primary')"
                  (click)="confirm.emit()">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-modal { max-width: 420px; text-align: center; }
    .confirm-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .icon-danger  { color: var(--danger); }
    .icon-warning { color: var(--warning); }
    .icon-info    { color: var(--info); }
    h3 { margin-bottom: .25rem; }
  `]
})
export class ConfirmDialogComponent {
  @Input() title        = '¿Estás seguro?';
  @Input() message      = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();

  icons: Record<string, string> = { danger: '🗑', warning: '⚠️', info: 'ℹ️' };
}
