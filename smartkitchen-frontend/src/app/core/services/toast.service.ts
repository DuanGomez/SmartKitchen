import { Injectable, signal } from '@angular/core';
import { Toast } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  private add(type: Toast['type'], message: string) {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => this.remove(id), 3500);
  }

  success(msg: string) { this.add('success', msg); }
  error(msg: string)   { this.add('error', msg); }
  warning(msg: string) { this.add('warning', msg); }
  info(msg: string)    { this.add('info', msg); }

  remove(id: string) { this.toasts.update(t => t.filter(x => x.id !== id)); }
}
