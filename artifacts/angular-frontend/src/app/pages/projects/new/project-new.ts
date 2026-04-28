import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-project-new',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './project-new.html',
})
export class ProjectNew {
  name = signal('');
  description = signal('');
  repoUrl = signal('');
  branch = signal('');
  saving = signal(false);

  constructor(private api: ApiService, private toast: ToastService, private router: Router) {}

  submit() {
    if (!this.name().trim()) {
      this.toast.show({ title: 'Name required', variant: 'destructive' });
      return;
    }
    this.saving.set(true);
    this.api.createProject({
      name: this.name().trim(),
      description: this.description().trim() || undefined,
      repoUrl: this.repoUrl().trim() || undefined,
      defaultBranch: this.branch().trim() || undefined,
    }).subscribe({
      next: p => { this.toast.show({ title: 'Project created' }); this.router.navigate(['/projects', p.id]); },
      error: e => { this.toast.show({ title: 'Failed to create project', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }
}
