import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Project, TestCase, TestRun, Checklist } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './project-detail.html',
})
export class ProjectDetail implements OnInit {
  projectId = 0;
  project = signal<Project | null>(null);
  testCases = signal<TestCase[]>([]);
  testRuns = signal<TestRun[]>([]);
  checklists = signal<Checklist[]>([]);
  allProjects = signal<Project[]>([]);
  loading = signal(true);
  activeTab = signal<'test-cases' | 'test-runs' | 'checklists'>('test-cases');
  search = signal('');

  showActionsMenu = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  showImportModal = signal(false);
  showDeleteTcModal = signal(false);
  deleteTcTarget = signal<{ id: number; title: string } | null>(null);

  editName = signal('');
  editDescription = signal('');
  editRepoUrl = signal('');
  editBranch = signal('');

  sourceProjectId = signal('');
  sourceTcs = signal<TestCase[]>([]);
  selectedTcIds = signal<Set<number>>(new Set());
  saving = signal(false);

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
    this.loadAll();
    this.api.getProjects().subscribe(p => this.allProjects.set(p));
  }

  loadAll() {
    this.api.getProject(this.projectId).subscribe({ next: p => { this.project.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.api.getTestCases(this.projectId).subscribe(t => this.testCases.set(t));
    this.api.getTestRuns(this.projectId).subscribe(t => this.testRuns.set(t));
    this.api.getChecklists(this.projectId).subscribe(c => this.checklists.set(c));
  }

  get filteredTestCases() {
    return this.testCases().filter(tc => tc.title.toLowerCase().includes(this.search().toLowerCase()));
  }

  get otherProjects() {
    return this.allProjects().filter(p => p.id !== this.projectId);
  }

  openEdit() {
    const p = this.project();
    if (!p) return;
    this.editName.set(p.name);
    this.editDescription.set(p.description ?? '');
    this.editRepoUrl.set((p as any).repoUrl ?? '');
    this.editBranch.set((p as any).defaultBranch ?? '');
    this.showEditModal.set(true);
    this.showActionsMenu.set(false);
  }

  saveEdit() {
    this.saving.set(true);
    this.api.updateProject(this.projectId, { name: this.editName(), description: this.editDescription() || undefined, repoUrl: this.editRepoUrl() || undefined, defaultBranch: this.editBranch() || undefined }).subscribe({
      next: p => { this.project.set(p); this.toast.show({ title: 'Project updated' }); this.showEditModal.set(false); this.saving.set(false); },
      error: e => { this.toast.show({ title: 'Failed to update', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }

  duplicateProject() {
    const p = this.project();
    if (!p) return;
    this.showActionsMenu.set(false);
    this.api.createProject({ name: `${p.name} (Copy)`, description: p.description }).subscribe({
      next: np => {
        const copies = this.testCases().map(tc =>
          this.api.createTestCase(np.id, { title: tc.title, description: tc.description, priority: tc.priority, status: 'draft', automationStatus: tc.automationStatus, labels: tc.labels, steps: tc.steps })
        );
        let done = 0;
        copies.forEach(obs => obs.subscribe({ next: () => { done++; if (done === copies.length) { this.toast.show({ title: 'Project duplicated', description: `"${np.name}" created.` }); this.router.navigate(['/projects', np.id]); } }, error: () => done++ }));
        if (copies.length === 0) { this.toast.show({ title: 'Project duplicated' }); this.router.navigate(['/projects', np.id]); }
      },
      error: e => this.toast.show({ title: 'Failed to duplicate', description: e.message, variant: 'destructive' })
    });
  }

  deleteProject() {
    this.api.deleteProject(this.projectId).subscribe({
      next: () => { this.toast.show({ title: 'Project deleted' }); this.router.navigate(['/projects']); },
      error: e => this.toast.show({ title: 'Failed to delete', description: e.message, variant: 'destructive' })
    });
  }

  onDeleteTc(tc: TestCase) {
    this.deleteTcTarget.set({ id: tc.id, title: tc.title });
    this.showDeleteTcModal.set(true);
  }

  confirmDeleteTc() {
    const target = this.deleteTcTarget();
    if (!target) return;
    this.api.deleteTestCase(this.projectId, target.id).subscribe({
      next: () => { this.testCases.update(t => t.filter(x => x.id !== target.id)); this.toast.show({ title: 'Test case deleted' }); this.showDeleteTcModal.set(false); this.deleteTcTarget.set(null); },
      error: e => { this.toast.show({ title: 'Failed to delete', description: e.message, variant: 'destructive' }); this.showDeleteTcModal.set(false); }
    });
  }

  duplicateTc(tc: TestCase) {
    this.api.createTestCase(this.projectId, { title: `${tc.title} (Copy)`, description: tc.description, priority: tc.priority, status: 'draft', automationStatus: tc.automationStatus, labels: tc.labels, steps: tc.steps }).subscribe({
      next: n => { this.testCases.update(t => [...t, n]); this.toast.show({ title: `Duplicated as TC-${n.id}` }); },
      error: e => this.toast.show({ title: 'Failed to duplicate', description: e.message, variant: 'destructive' })
    });
  }

  onSourceProjectChange(id: string) {
    this.sourceProjectId.set(id);
    this.selectedTcIds.set(new Set());
    if (id) this.api.getTestCases(parseInt(id)).subscribe(t => this.sourceTcs.set(t));
    else this.sourceTcs.set([]);
  }

  toggleTc(id: number) {
    this.selectedTcIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  importTcs() {
    const toImport = this.sourceTcs().filter(tc => this.selectedTcIds().has(tc.id));
    let done = 0;
    const total = toImport.length;
    if (total === 0) return;
    toImport.forEach(tc => {
      this.api.createTestCase(this.projectId, { title: tc.title, description: tc.description, priority: tc.priority, status: 'draft', automationStatus: tc.automationStatus, labels: tc.labels, steps: tc.steps }).subscribe({
        next: n => { this.testCases.update(t => [...t, n]); done++; if (done === total) { this.toast.show({ title: `Imported ${done} test case(s)` }); this.showImportModal.set(false); this.selectedTcIds.set(new Set()); this.sourceProjectId.set(''); this.sourceTcs.set([]); } },
        error: () => { done++; }
      });
    });
  }

  priorityClass(priority: string) {
    const p = priority?.toLowerCase();
    if (p === 'critical') return 'badge badge-critical';
    if (p === 'high') return 'badge badge-high';
    if (p === 'medium') return 'badge badge-medium';
    return 'badge badge-low';
  }

  statusClass(status: string) {
    const s = status?.toLowerCase();
    if (s === 'passed') return 'badge badge-passed';
    if (s === 'failed') return 'badge badge-failed';
    if (s === 'running') return 'badge badge-running';
    if (s === 'skipped') return 'badge badge-skipped';
    return 'badge badge-pending';
  }

  checklistProgress(cl: Checklist) {
    if (!cl.items.length) return 0;
    return Math.round((cl.items.filter(i => i.checked).length / cl.items.length) * 100);
  }
  checklistCheckedCount(cl: Checklist) { return cl.items.filter(i => i.checked).length; }

  timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  closeMenuOnOutsideClick() {
    this.showActionsMenu.set(false);
  }
}
