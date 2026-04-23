import { useParams, Link } from "wouter";
import { useGetTestRun, useUpdateTestResult, getGetTestRunQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Clock, GitBranch, GitCommit, CheckCircle, XCircle, AlertCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
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
      testRunId: trId,
      testResultId: resultId,
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
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
            <Card>
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
