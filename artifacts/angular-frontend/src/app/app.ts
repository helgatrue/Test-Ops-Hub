import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './services/toast.service';
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
  `,
})
export class App {
  constructor(public toastService: ToastService) {}
}
