import { Component, OnInit, signal, WritableSignal } from '@angular/core';
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
  status = signal('design');
  automationStatus = signal('manual');
  labelInput = signal('');
  labels = signal<string[]>([]);
  steps = signal<Array<{ name: string; action: string; expected: string }>>([]);

  application = signal('');
  classification = signal('internal');
  preConditions = signal('');
  designer = signal('');
  testCategory = signal('positive');
  testType = signal('regression testing');

  classificationOptions = signal(['internal', 'external']);
  statusOptions = signal(['design', 'draft', 'active', 'deprecated']);
  designerOptions = signal<string[]>([]);
  testCategoryOptions = signal(['positive', 'negative']);
  testTypeOptions = signal(['regression testing', 'smoke testing']);

  addingFor = signal<string | null>(null);
  newOptionValue = signal('');

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
        this.steps.set((tc.steps ?? []).map(s => ({ name: s.name ?? '', action: s.action, expected: s.expected })));
        this.application.set(tc.application ?? '');
        this.classification.set(tc.classification ?? 'internal');
        this.preConditions.set(tc.preConditions ?? '');
        this.designer.set(tc.designer ?? '');
        this.testCategory.set(tc.testCategory ?? 'positive');
        this.testType.set(tc.testType ?? 'regression testing');

        this.ensureOption(this.statusOptions, tc.status);
        this.ensureOption(this.classificationOptions, tc.classification ?? '');
        this.ensureOption(this.testCategoryOptions, tc.testCategory ?? '');
        this.ensureOption(this.testTypeOptions, tc.testType ?? '');
        if (tc.designer) this.ensureOption(this.designerOptions, tc.designer);

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ensureOption(options: WritableSignal<string[]>, value: string) {
    if (value && !options().includes(value)) options.update(o => [...o, value]);
  }

  startAdd(field: string) { this.addingFor.set(field); this.newOptionValue.set(''); }
  cancelAdd() { this.addingFor.set(null); this.newOptionValue.set(''); }

  confirmAdd(field: string, options: WritableSignal<string[]>, value: WritableSignal<string>) {
    const v = this.newOptionValue().trim();
    if (v) {
      if (!options().includes(v)) options.update(o => [...o, v]);
      value.set(v);
    }
    this.addingFor.set(null);
    this.newOptionValue.set('');
  }

  capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
  formatOption(s: string) { return s.split(/[_\s]+/).map(w => this.capitalize(w)).join(' '); }

  addLabel() {
    const l = this.labelInput().trim();
    if (l && !this.labels().includes(l)) this.labels.update(a => [...a, l]);
    this.labelInput.set('');
  }
  removeLabel(l: string) { this.labels.update(a => a.filter(x => x !== l)); }
  addStep() { this.steps.update(s => [...s, { name: '', action: '', expected: '' }]); }
  removeStep(i: number) { this.steps.update(s => s.filter((_, idx) => idx !== i)); }
  updateStep(i: number, field: 'name' | 'action' | 'expected', val: string) {
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
      steps: this.steps().map((s, i) => ({ order: i + 1, name: s.name, action: s.action, expected: s.expected })),
      application: this.application().trim() || undefined,
      classification: this.classification() || undefined,
      preConditions: this.preConditions().trim() || undefined,
      designer: this.designer() || undefined,
      testCategory: this.testCategory() || undefined,
      testType: this.testType() || undefined,
    }).subscribe({
      next: tc => { this.toast.show({ title: 'Test case updated' }); this.router.navigate(['/projects', this.projectId, 'test-cases', tc.id]); },
      error: e => { this.toast.show({ title: 'Failed to update', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }
}
