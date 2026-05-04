import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, ChecklistItem } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-checklist-new',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-new.html',
})
export class ChecklistNew {
  projectId: number;
  title = signal('');
  description = signal('');
  items = signal<ChecklistItem[]>([]);
  itemInput = signal('');
  saving = signal(false);

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute, private router: Router) {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
  }

  addItem() {
    const text = this.itemInput().trim();
    if (!text) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: text,
      checked: false,
      order: this.items().length + 1,
    };
    this.items.update(arr => [...arr, newItem]);
    this.itemInput.set('');
  }

  removeItem(id: string) { this.items.update(arr => arr.filter(i => i.id !== id)); }

  updateItemTitle(id: string, val: string) {
    this.items.update(arr => arr.map(i => i.id === id ? { ...i, title: val } : i));
  }

  submit() {
    if (!this.title().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createChecklist(this.projectId, {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      items: this.items().map((item, i) => ({ ...item, order: i + 1 })),
    }).subscribe({
      next: cl => { this.toast.show({ title: 'Checklist created' }); this.router.navigate(['/projects', this.projectId, 'checklists', cl.id]); },
      error: e => { this.toast.show({ title: 'Failed to create', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }
}
