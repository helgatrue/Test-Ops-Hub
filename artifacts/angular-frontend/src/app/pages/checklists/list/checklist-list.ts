import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, ChecklistGroup } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-checklist-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-list.html',
})
export class ChecklistList implements OnInit {
  groups = signal<ChecklistGroup[]>([]);
  loading = signal(true);
  saving = signal(false);
  openMenuId = signal<number | null>(null);
  showCreateModal = signal(false);
  showEditModal = signal<ChecklistGroup | null>(null);
  showDeleteModal = signal<ChecklistGroup | null>(null);

  formName = signal('');
  formDesc = signal('');

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getChecklistGroups().subscribe({
      next: gs => { this.groups.set(gs.sort((a, b) => a.name.localeCompare(b.name))); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.formName.set('');
    this.formDesc.set('');
    this.showCreateModal.set(true);
  }

  submitCreate() {
    if (!this.formName().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createChecklistGroup({ name: this.formName().trim(), description: this.formDesc().trim() || undefined }).subscribe({
      next: g => {
        this.groups.update(gs => [...gs, g].sort((a, b) => a.name.localeCompare(b.name)));
        this.toast.show({ title: 'Project created' });
        this.saving.set(false);
        this.showCreateModal.set(false);
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  openEdit(g: ChecklistGroup, event: Event) {
    event.stopPropagation();
    this.formName.set(g.name);
    this.formDesc.set(g.description ?? '');
    this.showEditModal.set(g);
    this.openMenuId.set(null);
  }

  submitEdit() {
    const g = this.showEditModal();
    if (!g) return;
    if (!this.formName().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.updateChecklistGroup(g.id, { name: this.formName().trim(), description: this.formDesc().trim() || undefined }).subscribe({
      next: updated => {
        this.groups.update(gs => gs.map(x => x.id === updated.id ? updated : x).sort((a, b) => a.name.localeCompare(b.name)));
        this.toast.show({ title: 'Project updated' });
        this.saving.set(false);
        this.showEditModal.set(null);
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  openDelete(g: ChecklistGroup, event: Event) {
    event.stopPropagation();
    this.showDeleteModal.set(g);
    this.openMenuId.set(null);
  }

  submitDelete() {
    const g = this.showDeleteModal();
    if (!g) return;
    this.saving.set(true);
    this.api.deleteChecklistGroup(g.id).subscribe({
      next: () => {
        this.groups.update(gs => gs.filter(x => x.id !== g.id));
        this.toast.show({ title: 'Project deleted' });
        this.saving.set(false);
        this.showDeleteModal.set(null);
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  toggleMenu(id: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.openMenuId.update(v => v === id ? null : id);
  }

  @HostListener('document:click')
  closeMenus() { this.openMenuId.set(null); }
}
