import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, TestCase } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-test-run-new',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './test-run-new.html',
})
export class TestRunNew implements OnInit {
  projectId = 0;
  testCases = signal<TestCase[]>([]);
  loading = signal(true);
  name = signal('');
  selectedIds = signal<Set<number>>(new Set());
  saving = signal(false);

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
    this.api.getTestCases(this.projectId, { status: 'active' }).subscribe({ next: t => { this.testCases.set(t); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  get allSelected() { return this.testCases().length > 0 && this.selectedIds().size === this.testCases().length; }

  toggleAll() {
    if (this.allSelected) this.selectedIds.set(new Set());
    else this.selectedIds.set(new Set(this.testCases().map(t => t.id)));
  }

  toggle(id: number) {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  submit() {
    if (!this.name().trim()) { this.toast.show({ title: 'Name required', variant: 'destructive' }); return; }
    if (this.selectedIds().size === 0) { this.toast.show({ title: 'Select at least one test case', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createTestRun(this.projectId, { name: this.name().trim(), testCaseIds: [...this.selectedIds()] }).subscribe({
      next: run => { this.toast.show({ title: 'Test run started' }); this.router.navigate(['/projects', this.projectId, 'test-runs', run.id]); },
      error: e => { this.toast.show({ title: 'Failed to start run', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }
}
