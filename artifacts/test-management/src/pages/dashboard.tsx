import { useGetDashboardSummary, useGetPassRateTrend, useGetRecentRuns, useGetTopFailingTests } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: trend, isLoading: isTrendLoading } = useGetPassRateTrend();
  const { data: recentRuns, isLoading: isRecentLoading } = useGetRecentRuns({ limit: 5 });
  const { data: failingTests, isLoading: isFailingLoading } = useGetTopFailingTests({ limit: 5 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      {isSummaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall pass rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overallPassRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeRuns}</div>
            </CardContent>
          </Card>
          <Card className="border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProjects}</div>
            </CardContent>
          </Card>
          <Card className="border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTestCases}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
          <CardHeader>
            <CardTitle>Pass Rate Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isTrendLoading ? <Skeleton className="h-full w-full" /> : trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), "MMM d")} fontSize={12} stroke="currentColor" opacity={0.5} />
                  <YAxis domain={[0, 100]} fontSize={12} stroke="currentColor" opacity={0.5} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }}
                    labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    formatter={(val: number) => [`${val.toFixed(1)}%`, "Pass Rate"]}
                  />
                  <Line type="monotone" dataKey="passRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-1 border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {isRecentLoading ? <Skeleton className="h-[300px]" /> : recentRuns ? (
              <div className="space-y-4">
                {recentRuns.map(run => (
                  <Link key={run.id} href={`/projects/${run.projectId}/test-runs/${run.id}`} className="block">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover-elevate transition-colors border-t-[#0f172900] border-r-[#0f172900] border-b-[#0f172900] border-l-[#0f172900] bg-[#fafafa]">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {run.projectName} / {run.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(run.createdAt), "MMM d, HH:mm")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground text-right hidden sm:block">
                          <div>{run.passedTests} passed</div>
                          <div className="text-destructive">{run.failedTests} failed</div>
                        </div>
                        <StatusBadge status={run.status} />
                      </div>
                    </div>
                  </Link>
                ))}
                {recentRuns.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 text-sm">No recent test runs.</div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card className="border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00]">
        <CardHeader>
          <CardTitle>Top Failing Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {isFailingLoading ? <Skeleton className="h-40" /> : failingTests ? (
            <div className="space-y-2">
              {failingTests.map(test => (
                <Link key={test.testCaseId} href={`/projects/${test.projectId}/test-cases/${test.testCaseId}`} className="block">
                  <div className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 transition-colors border-t-[#ffffff00] border-r-[#ffffff00] border-b-[#ffffff00] border-l-[#ffffff00] bg-[#e8e8e838]">
                    <div>
                      <div className="font-medium text-sm">{test.testCaseTitle}</div>
                      <div className="text-xs text-muted-foreground">{test.projectName}</div>
                    </div>
                    <div className="text-sm font-medium text-destructive">
                      {test.failureCount} failures
                    </div>
                  </div>
                </Link>
              ))}
              {failingTests.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">No failing tests in the last 7 days!</div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
