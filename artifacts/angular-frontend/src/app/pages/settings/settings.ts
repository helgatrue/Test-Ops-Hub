import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  template: `
    <div style="display:flex;flex-direction:column;gap:1.5rem">
      <div>
        <h1 style="font-size:1.875rem;font-weight:700;letter-spacing:-0.025em">Settings</h1>
        <p style="color:hsl(var(--muted-foreground));margin-top:0.25rem;font-size:0.875rem">Configure your TestOPS workspace.</p>
      </div>
      <div class="card">
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">About TestOPS</h2>
        <p style="font-size:0.875rem;color:hsl(var(--muted-foreground))">TestOPS is a comprehensive test management platform. Version 1.0.0</p>
      </div>
      <div class="card">
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">API Status</h2>
        <p style="font-size:0.875rem;color:hsl(var(--muted-foreground))">Backend: Spring Boot 3.2.5 · Database: PostgreSQL</p>
      </div>
    </div>
  `,
})
export class Settings {}
