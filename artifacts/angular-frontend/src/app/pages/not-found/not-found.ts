import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem">
      <h1 style="font-size:4rem;font-weight:700;color:hsl(var(--muted-foreground))">404</h1>
      <p style="font-size:1.25rem;font-weight:500;margin-bottom:0.5rem">Page not found</p>
      <p style="color:hsl(var(--muted-foreground));margin-bottom:2rem;font-size:0.875rem">The page you're looking for doesn't exist.</p>
      <a routerLink="/" class="btn btn-primary">Back to Dashboard</a>
    </div>
  `,
})
export class NotFound {}
