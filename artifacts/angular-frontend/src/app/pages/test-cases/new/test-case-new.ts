import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-test-case-new',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './test-case-new.html',
})
export class TestCaseNew {
  projectId: number;
  title = signal('');
  description = signal('');
  priority = signal('medium');
  automationStatus = signal('manual');
  labelInput = signal('');
  labels = signal<string[]>([]);
  steps = signal<Array<{ name: string; action: string; expected: string }>>([]);
  saving = signal(false);

  application = signal('');
  classification = signal('internal');
  preConditions = signal('');
  status = signal('design');
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

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute, private router: Router) {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
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
    if (l && !this.labels().includes(l)) { this.labels.update(arr => [...arr, l]); }
    this.labelInput.set('');
  }
  removeLabel(label: string) { this.labels.update(arr => arr.filter(x => x !== label)); }

  addStep() { this.steps.update(s => [...s, { name: '', action: '', expected: '' }]); }
  removeStep(i: number) { this.steps.update(s => s.filter((_, idx) => idx !== i)); }
  updateStep(i: number, field: 'name' | 'action' | 'expected', val: string) {
    this.steps.update(s => s.map((step, idx) => idx === i ? { ...step, [field]: val } : step));
  }

  submit() {
    if (!this.title().trim()) { this.toast.show({ title: 'Title required', variant: 'destructive' }); return; }
    this.saving.set(true);
    this.api.createTestCase(this.projectId, {
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
      next: tc => { this.toast.show({ title: 'Test case created' }); this.router.navigate(['/projects', this.projectId, 'test-cases', tc.id]); },
      error: e => { this.toast.show({ title: 'Failed to create', description: e.message, variant: 'destructive' }); this.saving.set(false); }
    });
  }
}
