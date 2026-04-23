import { useParams, Link } from "wouter";
import { useGetProject, useListTestCases, useListTestRuns, getGetProjectQueryKey, getListTestCasesQueryKey, getListTestRunsQueryKey } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Search, Filter, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import React from "react";
import { Badge } from "@/components/ui/badge";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId, 10);

  const { data: project, isLoading: isProjectLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) }
  });

  const { data: testCases, isLoading: isTestCasesLoading } = useListTestCases(id, {}, {
    query: { enabled: !!id, queryKey: getListTestCasesQueryKey(id, {}) }
  });

  const { data: testRuns, isLoading: isTestRunsLoading } = useListTestRuns(id, {}, {
    query: { enabled: !!id, queryKey: getListTestRunsQueryKey(id, {}) }
  });

  if (isProjectLoading) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-destructive">Project not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="test-cases">
        <TabsList>
          <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          <TabsTrigger value="test-runs">Test Runs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test-cases" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search test cases..." className="pl-9" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Link href={`/projects/${id}/test-cases/new`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Plus className="w-4 h-4 mr-2" />
              New Test Case
            </Link>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Automation</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTestCasesLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading test cases...</TableCell></TableRow>
                ) : testCases?.length ? (
                  testCases.map(tc => (
                    <TableRow key={tc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/projects/${id}/test-cases/${tc.id}`}>
                      <TableCell className="font-mono text-muted-foreground">TC-{tc.id}</TableCell>
                      <TableCell className="font-medium">{tc.title}</TableCell>
                      <TableCell><PriorityBadge priority={tc.priority} /></TableCell>
                      <TableCell><Badge variant="outline">{tc.status}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{tc.automationStatus}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatDistanceToNow(new Date(tc.updatedAt))} ago</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="text-muted-foreground mb-2">No test cases found.</div>
                      <Link href={`/projects/${id}/test-cases/new`} className="text-primary hover:underline text-sm font-medium">Create your first test case</Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="test-runs" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search runs..." className="pl-9" />
              </div>
            </div>
            <Link href={`/projects/${id}/test-runs/new`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Play className="w-4 h-4 mr-2" />
              New Test Run
            </Link>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Pass Rate</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTestRunsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading test runs...</TableCell></TableRow>
                ) : testRuns?.length ? (
                  testRuns.map(run => (
                    <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50" onClick={() => window.location.href = `/projects/${id}/test-runs/${run.id}`}>
                      <TableCell>
                        <div className="font-medium">{run.name}</div>
                        {run.branch && <div className="text-xs text-muted-foreground font-mono">{run.branch}</div>}
                      </TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell>{run.totalTests}</TableCell>
                      <TableCell>
                        {run.totalTests > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className={run.passedTests === run.totalTests ? "text-success font-medium" : ""}>
                              {Math.round((run.passedTests / run.totalTests) * 100)}%
                            </span>
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-success" style={{ width: `${(run.passedTests / run.totalTests) * 100}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{run.duration ? `${Math.round(run.duration / 1000)}s` : '-'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {run.startedAt ? formatDistanceToNow(new Date(run.startedAt)) + ' ago' : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="text-muted-foreground mb-2">No test runs found.</div>
                      <Link href={`/projects/${id}/test-runs/new`} className="text-primary hover:underline text-sm font-medium">Start a new run</Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
