import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Checklist, ChecklistGroup } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

interface Group { meta: ChecklistGroup; lists: Checklist[]; }

type Modal =
  | { kind: 'none' }
  | { kind: 'createGroup' }
  | { kind: 'newChecklist'; groupId: number }
  | { kind: 'editChecklist'; groupId: number; checklist: Checklist }
  | { kind: 'deleteChecklist'; groupId: number; checklist: Checklist };

@Component({
  selector: 'app-checklist-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-list.html',
})
export class ChecklistList implements OnInit {
  groups = signal<Group[]>([]);
  loading = signal(true);
  saving = signal(false);
  openCardMenuId = signal<string | null>(null);
  modal = signal<Modal>({ kind: 'none' });

  formGroupName = signal('');
  formGroupDesc = signal('');
  formClTitle = signal('');
  formClDesc = signal('');

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getChecklistGroups().subscribe({
      next: groups => {
        if (groups.length === 0) { this.groups.set([]); this.loading.set(false); return; }
        let done = 0;
        const result: Group[] = [];
        const finalize = () => {
          done++;
          if (done === groups.length) {
            result.sort((a, b) => a.meta.name.localeCompare(b.meta.name));
            this.groups.set(result);
            this.loading.set(false);
          }
        };
        groups.forEach(g => {
          this.api.getGroupChecklists(g.id).subscribe({
            next: lists => { result.push({ meta: g, lists }); finalize(); },
            error: () => { result.push({ meta: g, lists: [] }); finalize(); }
          });
        });
      },
      error: () => this.loading.set(false)
    });
  }

  progress(cl: Checklist) {
    if (!cl.items.length) return 0;
    return Math.round((cl.items.filter(i => i.checked).length / cl.items.length) * 100);
  }
  checkedCount(cl: Checklist) { return cl.items.filter(i => i.checked).length; }
  timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  closeModal() { this.modal.set({ kind: 'none' }); }

  openCreateGroup() {
    this.formGroupName.set('');
    this.formGroupDesc.set('');
    this.modal.set({ kind: 'createGroup' });
  }

  submitCreateGroup() {
    if (!this.formGroupName().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createChecklistGroup({ name: this.formGroupName().trim(), description: this.formGroupDesc().trim() || undefined }).subscribe({
      next: g => {
        this.groups.update(gs => [...gs, { meta: g, lists: [] }].sort((a, b) => a.meta.name.localeCompare(b.meta.name)));
        this.toast.show({ title: 'Project created' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  openNewChecklist(groupId: number) {
    this.formClTitle.set('');
    this.formClDesc.set('');
    this.modal.set({ kind: 'newChecklist', groupId });
  }

  openEditChecklist(groupId: number, cl: Checklist) {
    this.formClTitle.set(cl.title);
    this.formClDesc.set(cl.description ?? '');
    this.modal.set({ kind: 'editChecklist', groupId, checklist: cl });
    this.openCardMenuId.set(null);
  }

  openDeleteChecklist(groupId: number, cl: Checklist) {
    this.modal.set({ kind: 'deleteChecklist', groupId, checklist: cl });
    this.openCardMenuId.set(null);
  }

  submitNewChecklist() {
    const m = this.modal();
    if (m.kind !== 'newChecklist') return;
    if (!this.formClTitle().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createGroupChecklist(m.groupId, { title: this.formClTitle().trim(), description: this.formClDesc().trim() || undefined, items: [] }).subscribe({
      next: cl => {
        this.groups.update(gs => gs.map(g => g.meta.id === m.groupId ? { ...g, lists: [...g.lists, cl] } : g));
        this.toast.show({ title: 'Checklist created' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  submitEditChecklist() {
    const m = this.modal();
    if (m.kind !== 'editChecklist') return;
    if (!this.formClTitle().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.updateGroupChecklist(m.groupId, m.checklist.id, {
      title: this.formClTitle().trim(),
      description: this.formClDesc().trim() || undefined,
      status: m.checklist.status,
      items: m.checklist.items,
    }).subscribe({
      next: updated => {
        this.groups.update(gs => gs.map(g => g.meta.id === m.groupId ? { ...g, lists: g.lists.map(cl => cl.id === updated.id ? updated : cl) } : g));
        this.toast.show({ title: 'Checklist updated' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  submitDeleteChecklist() {
    const m = this.modal();
    if (m.kind !== 'deleteChecklist') return;
    this.saving.set(true);
    this.api.deleteGroupChecklist(m.groupId, m.checklist.id).subscribe({
      next: () => {
        this.groups.update(gs => gs.map(g => g.meta.id === m.groupId ? { ...g, lists: g.lists.filter(cl => cl.id !== m.checklist.id) } : g));
        this.toast.show({ title: 'Checklist deleted' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  toggleCardMenu(key: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.openCardMenuId.update(v => v === key ? null : key);
  }

  @HostListener('document:click')
  closeCardMenus() { this.openCardMenuId.set(null); }
}
