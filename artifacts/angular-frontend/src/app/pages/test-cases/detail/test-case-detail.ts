import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService, TestCase } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-test-case-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './test-case-detail.html',
})
export class TestCaseDetail implements OnInit {
  projectId = 0; testCaseId = 0;
  tc = signal<TestCase | null>(null);
  loading = signal(true);
  showDeleteModal = signal(false);

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
    this.testCaseId = parseInt(this.route.snapshot.paramMap.get('testCaseId') ?? '0');
    this.api.getTestCase(this.projectId, this.testCaseId).subscribe({ next: t => { this.tc.set(t); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  delete() {
    this.api.deleteTestCase(this.projectId, this.testCaseId).subscribe({
      next: () => { this.toast.show({ title: 'Test case deleted' }); this.router.navigate(['/projects', this.projectId]); },
      error: e => this.toast.show({ title: 'Failed to delete', description: e.message, variant: 'destructive' })
    });
  }

  priorityClass(p: string) {
    const pr = p?.toLowerCase();
    if (pr === 'critical') return 'badge badge-critical';
    if (pr === 'high') return 'badge badge-high';
    if (pr === 'medium') return 'badge badge-medium';
    return 'badge badge-low';
  }
}
