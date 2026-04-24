import { useParams, Link } from "wouter";
import { useGetTestRun, useUpdateTestResult, getGetTestRunQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Clock, GitBranch, GitCommit, CheckCircle, XCircle, AlertCircle, Ban, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function TestRunDetail() {
  const { projectId, testRunId } = useParams<{ projectId: string, testRunId: string }>();
  const pId = parseInt(projectId, 10);
  const trId = parseInt(testRunId, 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: run, isLoading } = useGetTestRun(pId, trId, {
    query: { enabled: !!(pId && trId), queryKey: getGetTestRunQueryKey(pId, trId) }
  });

  const updateResult = useUpdateTestResult();

  const handleStatusChange = (resultId: number, status: "passed" | "failed" | "skipped" | "blocked") => {
    updateResult.mutate({
      projectId: pId,
      testRunId: trId,
      resultId: resultId,
      data: { status }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTestRunQueryKey(pId, trId) });
      },
      onError: (err) => {
        toast({ title: "Failed to update result", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading test run...</div>;
  if (!run) return <div className="p-8 text-center text-destructive">Test run not found</div>;

  const downloadConfluenceReport = () => {
    const now = format(new Date(), "MMMM d, yyyy 'at' HH:mm");
    const statusIcon: Record<string, string> = {
      passed: "✅", failed: "❌", skipped: "⚠️", blocked: "🚫", pending: "⏳",
    };
    const resultRows = (run.results ?? []).map(r => `
      <tr>
        <td>${statusIcon[r.status] ?? ""} ${r.testCaseTitle}</td>
        <td>${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</td>
        <td>${r.duration ? `${r.duration}ms` : "—"}</td>
        <td style="font-family:monospace;font-size:12px;color:#ef4443">${r.errorMessage ?? ""}</td>
      </tr>`).join("");
    const envSection = (run.branch || run.commitHash || run.ciProvider) ? `
      <h2>Environment</h2>
      <table>
        <tbody>
          ${run.branch ? `<tr><td><strong>Branch</strong></td><td><code>${run.branch}</code></td></tr>` : ""}
          ${run.commitHash ? `<tr><td><strong>Commit</strong></td><td><code>${run.commitHash.substring(0, 7)}</code></td></tr>` : ""}
          ${run.ciProvider ? `<tr><td><strong>CI Provider</strong></td><td>${run.ciProvider}</td></tr>` : ""}
        </tbody>
      </table>` : "";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${run.name} — Test Run Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172b4d; padding: 32px; max-width: 960px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #6b778c; font-size: 13px; margin-bottom: 32px; }
    h2 { font-size: 15px; border-bottom: 1px solid #dfe1e6; padding-bottom: 6px; margin-top: 32px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat { background: #f4f5f7; border-radius: 6px; padding: 14px; text-align: center; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #6b778c; margin-bottom: 4px; }
    .stat-value { font-size: 24px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f4f5f7; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6b778c; }
    td { padding: 8px 12px; border-bottom: 1px solid #dfe1e6; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    code { background: #f4f5f7; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${run.name}</h1>
  <div class="subtitle">Status: <strong>${run.status.toUpperCase()}</strong> &nbsp;·&nbsp; Generated on ${now}</div>

  <h2>Summary</h2>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total</div><div class="stat-value">${run.totalTests}</div></div>
    <div class="stat"><div class="stat-label" style="color:#16a34a">Passed</div><div class="stat-value" style="color:#16a34a">${run.passedTests}</div></div>
    <div class="stat"><div class="stat-label" style="color:#ef4443">Failed</div><div class="stat-value" style="color:#ef4443">${run.failedTests}</div></div>
    <div class="stat"><div class="stat-label" style="color:#d97706">Skipped</div><div class="stat-value" style="color:#d97706">${run.skippedTests}</div></div>
  </div>

  <h2>Results</h2>
  <table>
    <thead><tr><th>Test Case</th><th>Status</th><th>Duration</th><th>Error</th></tr></thead>
    <tbody>${resultRows || "<tr><td colspan='4'>No results recorded.</td></tr>"}</tbody>
  </table>

  ${envSection}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-run-${run.id}-${format(new Date(), "yyyy-MM-dd")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${pId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={run.status} />
              {run.startedAt && <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Started {formatDistanceToNow(new Date(run.startedAt))} ago</span>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{run.name}</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={downloadConfluenceReport}>
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3 border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Test Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {run.results?.length ? (
                    run.results.map(res => (
                      <TableRow key={res.id}>
                        <TableCell>
                          {res.status === 'passed' && <CheckCircle className="w-5 h-5 text-success" />}
                          {res.status === 'failed' && <XCircle className="w-5 h-5 text-destructive" />}
                          {res.status === 'skipped' && <AlertCircle className="w-5 h-5 text-warning" />}
                          {res.status === 'blocked' && <Ban className="w-5 h-5 text-muted-foreground" />}
                          {res.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />}
                        </TableCell>
                        <TableCell>
                          <Link href={`/projects/${pId}/test-cases/${res.testCaseId}`} className="font-medium hover:underline">
                            {res.testCaseTitle}
                          </Link>
                          {res.errorMessage && (
                            <div className="text-xs text-destructive mt-1 font-mono p-1 bg-destructive/10 rounded">
                              {res.errorMessage}
                            </div>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={res.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{res.duration ? `${res.duration}ms` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Select 
                            value={res.status !== 'pending' ? res.status : undefined} 
                            onValueChange={(val: any) => handleStatusChange(res.id, val)}
                          >
                            <SelectTrigger className="w-[120px] ml-auto h-8">
                              <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="passed">Pass</SelectItem>
                              <SelectItem value="failed">Fail</SelectItem>
                              <SelectItem value="skipped">Skip</SelectItem>
                              <SelectItem value="blocked">Block</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No test results in this run.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Tests</span>
                <span className="font-medium">{run.totalTests}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-success flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Passed</span>
                <span className="font-medium">{run.passedTests}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-destructive flex items-center gap-2"><XCircle className="w-4 h-4"/> Failed</span>
                <span className="font-medium">{run.failedTests}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-warning flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Skipped</span>
                <span className="font-medium">{run.skippedTests}</span>
              </div>
            </CardContent>
          </Card>

          {(run.branch || run.commitHash || run.ciProvider) && (
            <Card className="border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
              <CardHeader>
                <CardTitle className="text-sm">Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {run.branch && (
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{run.branch}</span>
                  </div>
                )}
                {run.commitHash && (
                  <div className="flex items-center gap-2 text-sm">
                    <GitCommit className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{run.commitHash.substring(0, 7)}</span>
                  </div>
                )}
                {run.ciProvider && (
                  <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-medium">{run.ciProvider}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
