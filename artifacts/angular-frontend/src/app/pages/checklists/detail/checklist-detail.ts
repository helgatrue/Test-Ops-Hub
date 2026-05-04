import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Checklist, ChecklistItem } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-checklist-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-detail.html',
})
export class ChecklistDetail implements OnInit {
  projectId = 0;
  checklistId = 0;
  checklist = signal<Checklist | null>(null);
  loading = signal(true);
  saving = signal(false);
  itemInput = signal('');
  showDeleteModal = signal(false);
  showEditModal = signal(false);
  editTitle = signal('');
  editDescription = signal('');

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
    this.checklistId = parseInt(this.route.snapshot.paramMap.get('checklistId') ?? '0');
    this.load();
  }

  load() {
    this.api.getChecklist(this.projectId, this.checklistId).subscribe({
      next: cl => { this.checklist.set(cl); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  get checkedCount() { return this.checklist()?.items.filter(i => i.checked).length ?? 0; }
  get totalCount() { return this.checklist()?.items.length ?? 0; }
  get progress() { return this.totalCount ? Math.round((this.checkedCount / this.totalCount) * 100) : 0; }

  toggleItem(item: ChecklistItem) {
    const cl = this.checklist();
    if (!cl) return;
    const updated = cl.items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i);
    this.save({ items: updated });
  }

  addItem() {
    const text = this.itemInput().trim();
    if (!text) return;
    const cl = this.checklist();
    if (!cl) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: text,
      checked: false,
      order: cl.items.length + 1,
    };
    this.save({ items: [...cl.items, newItem] });
    this.itemInput.set('');
  }

  removeItem(id: string) {
    const cl = this.checklist();
    if (!cl) return;
    const items = cl.items.filter(i => i.id !== id).map((item, idx) => ({ ...item, order: idx + 1 }));
    this.save({ items });
  }

  uncheckAll() {
    const cl = this.checklist();
    if (!cl) return;
    this.save({ items: cl.items.map(i => ({ ...i, checked: false })) });
  }

  checkAll() {
    const cl = this.checklist();
    if (!cl) return;
    this.save({ items: cl.items.map(i => ({ ...i, checked: true })) });
  }

  toggleArchive() {
    const cl = this.checklist();
    if (!cl) return;
    const newStatus = cl.status === 'active' ? 'archived' : 'active';
    this.save({ status: newStatus });
  }

  save(patch: { items?: ChecklistItem[]; status?: string; title?: string; description?: string }) {
    const cl = this.checklist();
    if (!cl) return;
    this.saving.set(true);
    this.api.updateChecklist(this.projectId, this.checklistId, {
      title: patch.title ?? cl.title,
      description: patch.description ?? cl.description,
      status: patch.status ?? cl.status,
      items: patch.items ?? cl.items,
    }).subscribe({
      next: updated => { this.checklist.set(updated); this.saving.set(false); },
      error: e => { this.toast.show({ title: 'Failed to save', description: e.message, variant: 'destructive' }); this.saving.set(false); },
    });
  }

  openEdit() {
    const cl = this.checklist();
    if (!cl) return;
    this.editTitle.set(cl.title);
    this.editDescription.set(cl.description ?? '');
    this.showEditModal.set(true);
  }

  saveEdit() {
    if (!this.editTitle().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.save({ title: this.editTitle().trim(), description: this.editDescription().trim() || undefined });
    this.showEditModal.set(false);
  }

  delete() {
    this.api.deleteChecklist(this.projectId, this.checklistId).subscribe({
      next: () => { this.toast.show({ title: 'Checklist deleted' }); this.router.navigate(['/projects', this.projectId]); },
      error: e => this.toast.show({ title: 'Failed to delete', description: e.message, variant: 'destructive' }),
    });
  }

  progressColor() {
    const p = this.progress;
    if (p === 100) return '#16a34a';
    if (p >= 50) return 'hsl(var(--primary))';
    return 'hsl(var(--primary))';
  }
}
