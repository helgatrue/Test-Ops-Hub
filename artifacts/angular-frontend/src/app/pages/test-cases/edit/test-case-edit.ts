import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, TestCase } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-test-case-edit',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './test-case-edit.html',
})
export class TestCaseEdit implements OnInit {
  projectId = 0; testCaseId = 0;
  loading = signal(true);
  saving = signal(false);
  title = signal('');
  description = signal('');
  priority = signal('medium');
  status = signal('draft');
  automationStatus = signal('manual');
  labelInput = signal('');
  labels = signal<string[]>([]);
  steps = signal<Array<{ action: string; expected: string }>>([]);

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
    this.testCaseId = parseInt(this.route.snapshot.paramMap.get('testCaseId') ?? '0');
    this.api.getTestCase(this.projectId, this.testCaseId).subscribe({
      next: tc => {
        this.title.set(tc.title);
        this.description.set(tc.description ?? '');
        this.priority.set(tc.priority);
        this.status.set(tc.status);
        this.automationStatus.set(tc.automationStatus);
        this.labels.set(tc.labels ?? []);
        this.steps.set((tc.steps ?? []).map(s => ({ action: s.action, expected: s.expected })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addLabel() {
    const l = this.labelInput().trim();
    if (l && !this.labels().includes(l)) this.labels.update(a => [...a, l]);
    this.labelInput.set('');
  }
  removeLabel(l: string) { this.labels.update(a => a.filter(x => x !== l)); }
  addStep() { this.steps.update(s => [...s, { action: '', expected: '' }]); }
  removeStep(i: number) { this.steps.update(s => s.filter((_, idx) => idx !== i)); }
  updateStep(i: number, field: 'action' | 'expected', val: string) {
    this.steps.update(s => s.map((step, idx) => idx === i ? { ...step, [field]: val } : step));
  }

  submit() {
    if (!this.title().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.updateTestCase(this.projectId, this.testCaseId, {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      priority: this.priority(),
      status: this.status(),
      automationStatus: this.automationStatus(),
      labels: this.labels(),
      steps: this.steps().map((s, i) => ({ order: i + 1, action: s.action, expected: s.expected })),
    }).subscribe({
      next: tc => { this.toast.show({ title: 'Test case updated' }); this.router.navigate(['/projects', this.projectId, 'test-cases', tc.id]); },
      error: e => { this.toast.show({ title: 'Failed to update', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }
}
