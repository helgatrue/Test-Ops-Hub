import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, TestRun } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-test-run-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './test-run-detail.html',
})
export class TestRunDetail implements OnInit {
  projectId = 0; testRunId = 0;
  run = signal<TestRun | null>(null);
  loading = signal(true);

  constructor(private api: ApiService, private toast: ToastService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.projectId = parseInt(this.route.snapshot.paramMap.get('projectId') ?? '0');
    this.testRunId = parseInt(this.route.snapshot.paramMap.get('testRunId') ?? '0');
    this.loadRun();
  }

  loadRun() {
    this.api.getTestRun(this.projectId, this.testRunId).subscribe({ next: r => { this.run.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  updateStatus(resultId: number, status: string) {
    this.api.updateTestResult(this.projectId, this.testRunId, resultId, { status }).subscribe({
      next: () => this.loadRun(),
      error: e => this.toast.show({ title: 'Failed to update', description: e.message, variant: 'destructive' })
    });
  }

  statusClass(s: string) {
    const st = s?.toLowerCase();
    if (st === 'passed') return 'badge badge-passed';
    if (st === 'failed') return 'badge badge-failed';
    if (st === 'running') return 'badge badge-running animate-pulse';
    if (st === 'skipped') return 'badge badge-skipped';
    return 'badge badge-pending';
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  passRate(run: TestRun) {
    if (!run.totalTests) return 0;
    return ((run.passedTests / run.totalTests) * 100);
  }

  downloadReport() {
    const run = this.run();
    if (!run) return;
    const now = this.formatDate(new Date().toISOString());
    const statusIcon: Record<string, string> = { passed: '✅', failed: '❌', skipped: '⚠️', blocked: '🚫', pending: '⏳' };
    const rows = (run.results ?? []).map(r => `<tr><td>${statusIcon[r.status] ?? ''} ${r.testCaseTitle}</td><td>${r.status}</td><td>${r.duration ? r.duration + 'ms' : '—'}</td><td style="color:#ef4443;font-family:monospace;font-size:12px">${r.errorMessage ?? ''}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${run.name}</title><style>body{font-family:-apple-system,sans-serif;color:#172b4d;padding:32px;max-width:960px;margin:0 auto}h1{font-size:22px}.subtitle{color:#6b778c;font-size:13px;margin-bottom:32px}h2{font-size:15px;border-bottom:1px solid #dfe1e6;padding-bottom:6px;margin-top:32px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.stat{background:#f4f5f7;border-radius:6px;padding:14px;text-align:center}.stat-label{font-size:11px;text-transform:uppercase;color:#6b778c;margin-bottom:4px}.stat-value{font-size:24px;font-weight:700}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px 12px;background:#f4f5f7;font-weight:600;font-size:11px;text-transform:uppercase;color:#6b778c}td{padding:8px 12px;border-bottom:1px solid #dfe1e6}</style></head><body><h1>${run.name}</h1><div class="subtitle">Status: <strong>${run.status.toUpperCase()}</strong> · Generated on ${now}</div><h2>Summary</h2><div class="stats"><div class="stat"><div class="stat-label">Total</div><div class="stat-value">${run.totalTests}</div></div><div class="stat"><div class="stat-label" style="color:#16a34a">Passed</div><div class="stat-value" style="color:#16a34a">${run.passedTests}</div></div><div class="stat"><div class="stat-label" style="color:#ef4443">Failed</div><div class="stat-value" style="color:#ef4443">${run.failedTests}</div></div><div class="stat"><div class="stat-label" style="color:#d97706">Skipped</div><div class="stat-value" style="color:#d97706">${run.skippedTests}</div></div></div><h2>Results</h2><table><thead><tr><th>Test Case</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `run-${run.id}-report.html`; a.click();
    URL.revokeObjectURL(url);
  }
}
