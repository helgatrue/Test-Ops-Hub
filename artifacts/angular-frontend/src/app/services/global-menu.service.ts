import { Injectable, signal } from '@angular/core';

export interface GlobalMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  action: () => void;
}

export interface GlobalMenuState {
  top: number;
  right: number;
  items: GlobalMenuItem[];
}

@Injectable({ providedIn: 'root' })
export class GlobalMenuService {
  state = signal<GlobalMenuState | null>(null);

  open(pos: { top: number; right: number }, items: GlobalMenuItem[]) {
    this.state.set({ top: pos.top, right: pos.right, items });
  }

  close() {
    this.state.set(null);
  }
}
