import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Checklist, Project } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

interface Group { project: Project; lists: Checklist[]; }

type Modal =
  | { kind: 'none' }
  | { kind: 'editChecklist'; projectId: number; checklist: Checklist }
  | { kind: 'deleteChecklist'; projectId: number; checklist: Checklist }
  | { kind: 'newChecklist'; projectId: number }
  | { kind: 'duplicateChecklist'; projectId: number; checklist: Checklist };

@Component({
  selector: 'app-checklist-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-list.html',
})
export class ChecklistList implements OnInit {
  groups = signal<Group[]>([]);
  loading = signal(true);
  saving = signal(false);
  filterProjectId = signal<number | null>(null);
  openCardMenuId = signal<string | null>(null);
  modal = signal<Modal>({ kind: 'none' });

  formClTitle = signal('');
  formClDesc = signal('');

  constructor(private api: ApiService, private toast: ToastService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getProjects().subscribe({
      next: projects => {
        if (projects.length === 0) { this.groups.set([]); this.loading.set(false); return; }
        let done = 0;
        const result: Group[] = [];
        projects.forEach(p => {
          this.api.getChecklists(p.id).subscribe({
            next: lists => { result.push({ project: p, lists }); finalize(); },
            error: () => { result.push({ project: p, lists: [] }); finalize(); }
          });
        });
        const finalize = () => {
          done++;
          if (done === projects.length) {
            result.sort((a, b) => a.project.name.localeCompare(b.project.name));
            this.groups.set(result);
            this.loading.set(false);
          }
        };
      },
      error: () => this.loading.set(false)
    });
  }

  get allProjects() { return this.groups().map(g => g.project); }

  get filteredGroups() {
    const pid = this.filterProjectId();
    const gs = pid ? this.groups().filter(g => g.project.id === pid) : this.groups();
    return gs.filter(g => g.lists.length > 0);
  }

  get totalCount() { return this.groups().reduce((s, g) => s + g.lists.length, 0); }

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

  openNewChecklist(projectId: number) {
    this.formClTitle.set('');
    this.formClDesc.set('');
    this.modal.set({ kind: 'newChecklist', projectId });
  }

  openEditChecklist(projectId: number, cl: Checklist) {
    this.formClTitle.set(cl.title);
    this.formClDesc.set(cl.description ?? '');
    this.modal.set({ kind: 'editChecklist', projectId, checklist: cl });
    this.openCardMenuId.set(null);
  }

  openDeleteChecklist(projectId: number, cl: Checklist) {
    this.modal.set({ kind: 'deleteChecklist', projectId, checklist: cl });
    this.openCardMenuId.set(null);
  }

  openDuplicateChecklist(projectId: number, cl: Checklist) {
    this.modal.set({ kind: 'duplicateChecklist', projectId, checklist: cl });
    this.openCardMenuId.set(null);
  }

  submitNewChecklist() {
    const m = this.modal();
    if (m.kind !== 'newChecklist') return;
    if (!this.formClTitle().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createChecklist(m.projectId, { title: this.formClTitle().trim(), description: this.formClDesc().trim() || undefined, items: [] }).subscribe({
      next: cl => {
        this.groups.update(gs => gs.map(g => g.project.id === m.projectId ? { ...g, lists: [...g.lists, cl] } : g));
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
    this.api.updateChecklist(m.projectId, m.checklist.id, {
      title: this.formClTitle().trim(),
      description: this.formClDesc().trim() || undefined,
      status: m.checklist.status,
      items: m.checklist.items,
    }).subscribe({
      next: updated => {
        this.groups.update(gs => gs.map(g => g.project.id === m.projectId ? { ...g, lists: g.lists.map(cl => cl.id === updated.id ? updated : cl) } : g));
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
    this.api.deleteChecklist(m.projectId, m.checklist.id).subscribe({
      next: () => {
        this.groups.update(gs => gs.map(g => g.project.id === m.projectId ? { ...g, lists: g.lists.filter(cl => cl.id !== m.checklist.id) } : g));
        this.toast.show({ title: 'Checklist deleted' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  submitDuplicateChecklist() {
    const m = this.modal();
    if (m.kind !== 'duplicateChecklist') return;
    this.saving.set(true);
    this.api.createChecklist(m.projectId, {
      title: m.checklist.title + ' (copy)',
      description: m.checklist.description,
      items: m.checklist.items.map(i => ({ ...i, id: Date.now().toString() + Math.random(), checked: false })),
    }).subscribe({
      next: cl => {
        this.groups.update(gs => gs.map(g => g.project.id === m.projectId ? { ...g, lists: [...g.lists, cl] } : g));
        this.toast.show({ title: 'Checklist duplicated' });
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
