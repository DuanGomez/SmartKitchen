import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'sk-confirm-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent],
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
        <div [class]="'confirm-icon icon-' + type"><sk-icon [name]="icons[type]" [size]="26" /></div>
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
    .confirm-icon { width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 1rem; }
    .sk-modal-footer { justify-content: center; }
    .icon-danger  { color: var(--danger); background: var(--danger-bg); }
    .icon-warning { color: var(--warning); background: var(--warning-bg); }
    .icon-info    { color: var(--info); background: var(--info-bg); }
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

  icons: Record<string, string> = { danger: 'trash', warning: 'alert', info: 'info' };
}
