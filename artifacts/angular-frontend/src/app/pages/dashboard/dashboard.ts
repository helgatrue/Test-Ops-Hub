import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardSummary, PassRateTrend, RecentRun, TopFailingTest } from '../../services/api.service';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  summary = signal<DashboardSummary | null>(null);
  trend = signal<PassRateTrend[]>([]);
  recentRuns = signal<RecentRun[]>([]);
  failingTests = signal<TopFailingTest[]>([]);
  loading = signal(true);

  private chart: Chart | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboardSummary().subscribe(s => this.summary.set(s));
    this.api.getRecentRuns(5).subscribe(r => { this.recentRuns.set(r); this.loading.set(false); });
    this.api.getTopFailingTests(5).subscribe(t => this.failingTests.set(t));
    this.api.getPassRateTrend().subscribe(t => {
      this.trend.set(t);
      this.renderChart(t);
    });
  }

  ngAfterViewInit() {
    if (this.trend().length) this.renderChart(this.trend());
  }

  renderChart(data: PassRateTrend[]) {
    setTimeout(() => {
      if (!this.chartCanvas) return;
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(this.chartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
          datasets: [{
            data: data.map(d => d.passRate),
            borderColor: 'hsl(221 83% 53%)',
            backgroundColor: 'hsl(221 83% 53% / 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${(ctx.parsed.y as number).toFixed(1)}%` } } },
          scales: {
            x: { grid: { color: 'hsl(214 32% 91% / 0.5)' }, ticks: { font: { size: 12 }, color: 'hsl(215 16% 47%)' } },
            y: { min: 0, max: 100, grid: { color: 'hsl(214 32% 91% / 0.5)' }, ticks: { font: { size: 12 }, color: 'hsl(215 16% 47%)', callback: v => `${v}%` } }
          }
        }
      });
    }, 50);
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  statusClass(status: string) {
    const s = status.toLowerCase();
    if (s === 'passed') return 'badge badge-passed';
    if (s === 'failed') return 'badge badge-failed';
    if (s === 'running') return 'badge badge-running animate-pulse';
    if (s === 'skipped') return 'badge badge-skipped';
    return 'badge badge-pending';
  }

  downloadReport() {
    const summary = this.summary();
    const recentRuns = this.recentRuns();
    const failingTests = this.failingTests();
    const now = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const runsRows = recentRuns.map(r => `<tr><td>${r.projectName} / ${r.name}</td><td>${this.formatDate(r.createdAt)}</td><td style="color:#16a34a">${r.passedTests} passed</td><td style="color:#ef4443">${r.failedTests} failed</td><td><strong>${r.status.toUpperCase()}</strong></td></tr>`).join('');
    const failingRows = failingTests.map(t => `<tr><td>${t.testCaseTitle}</td><td>${t.projectName}</td><td style="color:#ef4443"><strong>${t.failureCount}</strong></td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>TestOPS Dashboard Report</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172b4d;padding:32px;max-width:960px;margin:0 auto}h1{font-size:24px;margin-bottom:4px}.subtitle{color:#6b778c;font-size:13px;margin-bottom:32px}h2{font-size:16px;border-bottom:1px solid #dfe1e6;padding-bottom:6px;margin-top:32px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.stat{background:#f4f5f7;border-radius:6px;padding:16px}.stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b778c;margin-bottom:4px}.stat-value{font-size:28px;font-weight:700}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px 12px;background:#f4f5f7;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b778c}td{padding:8px 12px;border-bottom:1px solid #dfe1e6}tr:last-child td{border-bottom:none}</style></head><body><h1>TestOPS Dashboard Report</h1><div class="subtitle">Generated on ${now}</div><h2>Summary</h2><div class="stats"><div class="stat"><div class="stat-label">Overall Pass Rate</div><div class="stat-value">${summary?.overallPassRate.toFixed(1) ?? '—'}%</div></div><div class="stat"><div class="stat-label">Active Runs</div><div class="stat-value">${summary?.activeRuns ?? '—'}</div></div><div class="stat"><div class="stat-label">Total Projects</div><div class="stat-value">${summary?.totalProjects ?? '—'}</div></div><div class="stat"><div class="stat-label">Total Test Cases</div><div class="stat-value">${summary?.totalTestCases ?? '—'}</div></div></div><h2>Recent Runs</h2><table><thead><tr><th>Run</th><th>Date</th><th>Passed</th><th>Failed</th><th>Status</th></tr></thead><tbody>${runsRows || "<tr><td colspan='5'>No recent runs</td></tr>"}</tbody></table><h2>Top Failing Tests</h2><table><thead><tr><th>Test Case</th><th>Project</th><th>Failures (last 7 days)</th></tr></thead><tbody>${failingRows || "<tr><td colspan='3'>No failing tests</td></tr>"}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `testops-report-${new Date().toISOString().slice(0, 10)}.html`; a.click();
    URL.revokeObjectURL(url);
  }
}
