import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './services/toast.service';
import { GlobalMenuService } from './services/global-menu.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class.error]="toast.variant === 'destructive'">
          <div class="toast-title">{{ toast.title }}</div>
          @if (toast.description) {
            <div class="toast-desc">{{ toast.description }}</div>
          }
        </div>
      }
    </div>
    @if (globalMenu.state() !== null) {
      <div style="position:fixed;inset:0;z-index:9999" (click)="globalMenu.close()">
        <div style="position:fixed;background:hsl(var(--popover));border:1px solid hsl(var(--border));border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,0.15);min-width:130px;overflow:hidden"
             [style.top.px]="globalMenu.state()!.top"
             [style.right.px]="globalMenu.state()!.right"
             (click)="$event.stopPropagation()">
          @for (item of globalMenu.state()!.items; track item.label; let i = $index) {
            @if (i > 0) { <div style="height:1px;background:hsl(var(--border));margin:0.25rem 0"></div> }
            <button [class]="item.danger ? 'dropdown-item danger' : 'dropdown-item'" (click)="runAction(item.action)">
              {{ item.label }}
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class App {
  constructor(public toastService: ToastService, public globalMenu: GlobalMenuService) {}

  runAction(action: () => void) {
    action();
    this.globalMenu.close();
  }
}
