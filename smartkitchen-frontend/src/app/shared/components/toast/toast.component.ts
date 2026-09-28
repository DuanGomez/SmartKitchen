import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'sk-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(32px)' }),
        animate('280ms cubic-bezier(.34,1.56,.64,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease', style({ opacity: 0, transform: 'translateX(32px)' }))
      ])
    ])
  ],
  template: `
    <div class="sk-toast-container">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="sk-toast toast-{{ t.type }}" @toastAnim>
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span>{{ t.message }}</span>
          <button class="toast-close" (click)="toastSvc.remove(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-icon { font-size: 1rem; flex-shrink: 0; }
    .toast-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: inherit; opacity: .6; font-size: .875rem; padding: .1rem .2rem;
      &:hover { opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toastSvc = inject(ToastService);
  icons: Record<string, string> = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
}
