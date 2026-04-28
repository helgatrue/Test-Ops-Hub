import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(toast: Omit<Toast, 'id'>) {
    const id = ++this.nextId;
    this.toasts.update(t => [...t, { ...toast, id }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
