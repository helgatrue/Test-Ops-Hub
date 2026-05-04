import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Checklist, Project } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

interface Group { project: Project; lists: Checklist[]; menuOpen: boolean; }

type Modal =
  | { kind: 'none' }
  | { kind: 'createProject' }
  | { kind: 'editProject'; project: Project }
  | { kind: 'deleteProject'; project: Project }
  | { kind: 'duplicateProject'; project: Project }
  | { kind: 'editChecklist'; projectId: number; checklist: Checklist }
  | { kind: 'deleteChecklist'; projectId: number; checklist: Checklist }
  | { kind: 'duplicateChecklist'; projectId: number; checklist: Checklist }
  | { kind: 'newChecklist'; projectId: number };

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

  formProjectName = signal('');
  formProjectDesc = signal('');
  formProjectRepo = signal('');

  formClTitle = signal('');
  formClDesc = signal('');

  constructor(private api: ApiService, private toast: ToastService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getProjects().subscribe({
      next: projects => {
        if (projects.length === 0) {
          this.groups.set([]);
          this.loading.set(false);
          return;
        }
        let done = 0;
        const result: Group[] = [];
        projects.forEach(p => {
          this.api.getChecklists(p.id).subscribe({
            next: lists => {
              result.push({ project: p, lists, menuOpen: false });
              done++;
              if (done === projects.length) {
                result.sort((a, b) => a.project.name.localeCompare(b.project.name));
                this.groups.set(result);
                this.loading.set(false);
              }
            },
            error: () => {
              result.push({ project: p, lists: [], menuOpen: false });
              done++;
              if (done === projects.length) {
                result.sort((a, b) => a.project.name.localeCompare(b.project.name));
                this.groups.set(result);
                this.loading.set(false);
              }
            }
          });
        });
      },
      error: () => this.loading.set(false)
    });
  }

  get filteredGroups() {
    const pid = this.filterProjectId();
    return pid ? this.groups().filter(g => g.project.id === pid) : this.groups();
  }

  get allProjects() { return this.groups().map(g => g.project); }

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

  openCreateProject() {
    this.formProjectName.set('');
    this.formProjectDesc.set('');
    this.formProjectRepo.set('');
    this.modal.set({ kind: 'createProject' });
  }

  openEditProject(p: Project) {
    this.formProjectName.set(p.name);
    this.formProjectDesc.set(p.description ?? '');
    this.formProjectRepo.set(p.repoUrl ?? '');
    this.modal.set({ kind: 'editProject', project: p });
  }

  openDeleteProject(p: Project) { this.modal.set({ kind: 'deleteProject', project: p }); }

  openDuplicateProject(p: Project) {
    this.formProjectName.set(p.name + ' (copy)');
    this.modal.set({ kind: 'duplicateProject', project: p });
  }

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

  submitCreateProject() {
    if (!this.formProjectName().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createProject({
      name: this.formProjectName().trim(),
      description: this.formProjectDesc().trim() || undefined,
      repoUrl: this.formProjectRepo().trim() || undefined,
    }).subscribe({
      next: p => {
        this.groups.update(gs => [...gs, { project: p, lists: [], menuOpen: false }].sort((a, b) => a.project.name.localeCompare(b.project.name)));
        this.toast.show({ title: 'Project created' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  submitEditProject() {
    const m = this.modal();
    if (m.kind !== 'editProject') return;
    if (!this.formProjectName().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.updateProject(m.project.id, {
      name: this.formProjectName().trim(),
      description: this.formProjectDesc().trim() || undefined,
      repoUrl: this.formProjectRepo().trim() || undefined,
    }).subscribe({
      next: updated => {
        this.groups.update(gs => gs.map(g => g.project.id === updated.id ? { ...g, project: updated } : g));
        this.toast.show({ title: 'Project updated' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  submitDeleteProject() {
    const m = this.modal();
    if (m.kind !== 'deleteProject') return;
    this.saving.set(true);
    this.api.deleteProject(m.project.id).subscribe({
      next: () => {
        this.groups.update(gs => gs.filter(g => g.project.id !== m.project.id));
        if (this.filterProjectId() === m.project.id) this.filterProjectId.set(null);
        this.toast.show({ title: 'Project deleted' });
        this.saving.set(false);
        this.closeModal();
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  submitDuplicateProject() {
    const m = this.modal();
    if (m.kind !== 'duplicateProject') return;
    if (!this.formProjectName().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createProject({
      name: this.formProjectName().trim(),
      description: m.project.description,
      repoUrl: m.project.repoUrl,
      defaultBranch: m.project.defaultBranch,
    }).subscribe({
      next: newProject => {
        const srcGroup = this.groups().find(g => g.project.id === m.project.id);
        if (!srcGroup || srcGroup.lists.length === 0) {
          this.groups.update(gs => [...gs, { project: newProject, lists: [], menuOpen: false }].sort((a, b) => a.project.name.localeCompare(b.project.name)));
          this.toast.show({ title: 'Project duplicated' });
          this.saving.set(false);
          this.closeModal();
          return;
        }
        let done = 0;
        const newLists: Checklist[] = [];
        srcGroup.lists.forEach(cl => {
          this.api.createChecklist(newProject.id, { title: cl.title, description: cl.description, items: cl.items.map(i => ({ ...i, checked: false })) }).subscribe({
            next: newCl => {
              newLists.push(newCl);
              done++;
              if (done === srcGroup.lists.length) {
                this.groups.update(gs => [...gs, { project: newProject, lists: newLists, menuOpen: false }].sort((a, b) => a.project.name.localeCompare(b.project.name)));
                this.toast.show({ title: `Project duplicated with ${newLists.length} checklist(s)` });
                this.saving.set(false);
                this.closeModal();
              }
            },
            error: () => {
              done++;
              if (done === srcGroup.lists.length) {
                this.groups.update(gs => [...gs, { project: newProject, lists: newLists, menuOpen: false }].sort((a, b) => a.project.name.localeCompare(b.project.name)));
                this.saving.set(false);
                this.closeModal();
              }
            }
          });
        });
      },
      error: e => { this.toast.show({ title: 'Failed', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
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
