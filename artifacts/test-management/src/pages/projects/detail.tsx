import { useParams, Link, useLocation } from "wouter";
import {
  useGetProject,
  useListTestCases,
  useListTestRuns,
  useDeleteTestCase,
  useCreateTestCase,
  useUpdateProject,
  useDeleteProject,
  useCreateProject,
  useListProjects,
  getGetProjectQueryKey,
  getListTestCasesQueryKey,
  getListTestRunsQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Search, Play, Edit, Trash2, MoreHorizontal, Copy, FolderInput } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── UI state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [sourceProjectId, setSourceProjectId] = useState<string>("");
  const [selectedTcIds, setSelectedTcIds] = useState<Set<number>>(new Set());

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRepoUrl, setEditRepoUrl] = useState("");
  const [editBranch, setEditBranch] = useState("");

  // ── Queries ───────────────────────────────────────────────────────────
  const { data: project, isLoading: isProjectLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });
  const { data: testCases, isLoading: isTestCasesLoading } = useListTestCases(
    id, {}, { query: { enabled: !!id, queryKey: getListTestCasesQueryKey(id, {}) } }
  );
  const { data: testRuns, isLoading: isTestRunsLoading } = useListTestRuns(
    id, {}, { query: { enabled: !!id, queryKey: getListTestRunsQueryKey(id, {}) } }
  );
  const { data: allProjects } = useListProjects();
  const otherProjects = allProjects?.filter((p) => p.id !== id) ?? [];

  const srcId = sourceProjectId ? parseInt(sourceProjectId, 10) : 0;
  const { data: sourceTcs } = useListTestCases(
    srcId, {}, { query: { enabled: !!srcId, queryKey: getListTestCasesQueryKey(srcId, {}) } }
  );

  // ── Mutations ─────────────────────────────────────────────────────────
  const deleteTestCase = useDeleteTestCase();
  const duplicateTestCase = useCreateTestCase();
  const createTestCase = useCreateTestCase();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createProject = useCreateProject();

  // ── Handlers ──────────────────────────────────────────────────────────
  const openEdit = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditRepoUrl((project as any).repoUrl ?? "");
    setEditBranch((project as any).defaultBranch ?? "");
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    updateProject.mutate(
      { projectId: id, data: { name: editName, description: editDescription || undefined, repoUrl: editRepoUrl || undefined, defaultBranch: editBranch || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project updated" });
          setEditOpen(false);
        },
        onError: (err) => toast({ title: "Failed to update project", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDuplicateProject = () => {
    if (!project) return;
    createProject.mutate(
      { data: { name: `${project.name} (Copy)`, description: project.description ?? undefined } },
      {
        onSuccess: async (newProject) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          // Copy all test cases to the new project
          const copies = (testCases ?? []).map((tc) =>
            createTestCase.mutateAsync({
              projectId: newProject.id,
              data: {
                title: tc.title,
                description: tc.description ?? undefined,
                priority: tc.priority as any,
                status: "draft",
                automationStatus: tc.automationStatus as any,
                labels: (tc.labels as string[]) ?? [],
                steps: (tc.steps as Array<{ order: number; action: string; expected: string }>) ?? [],
              },
            })
          );
          await Promise.allSettled(copies);
          toast({ title: "Project duplicated", description: `"${newProject.name}" created with ${testCases?.length ?? 0} test case(s).` });
          setLocation(`/projects/${newProject.id}`);
        },
        onError: (err) => toast({ title: "Failed to duplicate project", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDeleteProject = () => {
    deleteProject.mutate(
      { projectId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project deleted" });
          setLocation("/projects");
        },
        onError: (err) => toast({ title: "Failed to delete project", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDuplicate = (tc: NonNullable<typeof testCases>[number]) => {
    duplicateTestCase.mutate(
      {
        projectId: id,
        data: {
          title: `${tc.title} (Copy)`,
          description: tc.description ?? undefined,
          priority: tc.priority as any,
          status: "draft",
          automationStatus: tc.automationStatus as any,
          labels: (tc.labels as string[]) ?? [],
          steps: (tc.steps as Array<{ order: number; action: string; expected: string }>) ?? [],
        },
      },
      {
        onSuccess: (newTc) => {
          queryClient.invalidateQueries({ queryKey: getListTestCasesQueryKey(id, {}) });
          toast({ title: `Duplicated as TC-${newTc.id}` });
        },
        onError: (err) => toast({ title: "Failed to duplicate", description: err.message, variant: "destructive" }),
      }
    );
  };

  const filteredTestCases = testCases?.filter((tc) =>
    tc.title.toLowerCase().includes(search.toLowerCase())
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTestCase.mutate(
      { projectId: id, testCaseId: deleteTarget.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTestCasesQueryKey(id, {}) });
          toast({ title: "Test case deleted" });
          setDeleteTarget(null);
        },
        onError: (err) => {
          toast({ title: "Failed to delete test case", description: err.message, variant: "destructive" });
          setDeleteTarget(null);
        },
      }
    );
  };

  const toggleTc = (tcId: number) => {
    setSelectedTcIds((prev) => {
      const next = new Set(prev);
      next.has(tcId) ? next.delete(tcId) : next.add(tcId);
      return next;
    });
  };

  const handleImport = async () => {
    const toImport = (sourceTcs ?? []).filter((tc) => selectedTcIds.has(tc.id));
    const results = await Promise.allSettled(
      toImport.map((tc) =>
        createTestCase.mutateAsync({
          projectId: id,
          data: {
            title: tc.title,
            description: tc.description ?? undefined,
            priority: tc.priority as any,
            status: "draft",
            automationStatus: tc.automationStatus as any,
            labels: (tc.labels as string[]) ?? [],
            steps: (tc.steps as Array<{ order: number; action: string; expected: string }>) ?? [],
          },
        })
      )
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    queryClient.invalidateQueries({ queryKey: getListTestCasesQueryKey(id, {}) });
    toast({ title: `Imported ${succeeded} test case(s)` });
    setImportOpen(false);
    setSelectedTcIds(new Set());
    setSourceProjectId("");
  };

  if (isProjectLoading)
    return <div className="p-8 text-center text-muted-foreground">Loading project...</div>;
  if (!project)
    return <div className="p-8 text-center text-destructive">Project not found</div>;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
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

        {/* Project actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={openEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicateProject} disabled={createProject.isPending}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteProjectOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* ── Tabs ── */}
      <Tabs defaultValue="test-cases">
        <TabsList>
          <TabsTrigger value="test-cases">
            Test Cases
            {testCases?.length ? (
              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {testCases.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="test-runs">
            Test Runs
            {testRuns?.length ? (
              <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {testRuns.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* ── Test Cases Tab ── */}
        <TabsContent value="test-cases" className="space-y-4 pt-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search test cases..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {otherProjects.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <FolderInput className="w-4 h-4 mr-2" />
                  Import from project
                </Button>
              )}
              <Link
                href={`/projects/${id}/test-cases/new`}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Test Case
              </Link>
            </div>
          </div>

          <div className="border rounded-md border-t-[transparent] border-r-[transparent] border-b-[transparent] border-l-[transparent]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Automation</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTestCasesLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading test cases...
                    </TableCell>
                  </TableRow>
                ) : filteredTestCases?.length ? (
                  filteredTestCases.map((tc) => (
                    <TableRow
                      key={tc.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/projects/${id}/test-cases/${tc.id}`)}
                    >
                      <TableCell className="font-mono text-muted-foreground text-sm">
                        TC-{tc.id}
                      </TableCell>
                      <TableCell className="font-medium">{tc.title}</TableCell>
                      <TableCell><PriorityBadge priority={tc.priority} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{tc.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tc.automationStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(tc.updatedAt))} ago
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/projects/${id}/test-cases/${tc.id}`)}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/projects/${id}/test-cases/${tc.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(tc)} disabled={duplicateTestCase.isPending}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({ id: tc.id, title: tc.title })}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {search ? (
                        <div className="text-muted-foreground">No test cases match "{search}"</div>
                      ) : (
                        <>
                          <div className="text-muted-foreground mb-2">No test cases yet.</div>
                          <Link href={`/projects/${id}/test-cases/new`} className="text-primary hover:underline text-sm font-medium">
                            Create your first test case
                          </Link>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Test Runs Tab ── */}
        <TabsContent value="test-runs" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search runs..." className="pl-9 w-64" />
            </div>
            <Link
              href={`/projects/${id}/test-runs/new`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
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
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading test runs...
                    </TableCell>
                  </TableRow>
                ) : testRuns?.length ? (
                  testRuns.map((run) => (
                    <TableRow
                      key={run.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/projects/${id}/test-runs/${run.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{run.name}</div>
                        {run.branch && <div className="text-xs text-muted-foreground font-mono">{run.branch}</div>}
                      </TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell>{run.totalTests}</TableCell>
                      <TableCell>
                        {run.totalTests > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{Math.round((run.passedTests / run.totalTests) * 100)}%</span>
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${(run.passedTests / run.totalTests) * 100}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{run.duration ? `${Math.round(run.duration / 1000)}s` : "-"}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {run.startedAt ? formatDistanceToNow(new Date(run.startedAt)) + " ago" : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="text-muted-foreground mb-2">No test runs found.</div>
                      <Link href={`/projects/${id}/test-runs/new`} className="text-primary hover:underline text-sm font-medium">
                        Start a new run
                      </Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      {/* ── Edit Project Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-repo">Repository URL</Label>
              <Input id="edit-repo" value={editRepoUrl} onChange={(e) => setEditRepoUrl(e.target.value)} placeholder="https://github.com/org/repo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-branch">Default Branch</Label>
              <Input id="edit-branch" value={editBranch} onChange={(e) => setEditBranch(e.target.value)} placeholder="main" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim() || updateProject.isPending}>
              {updateProject.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Import Test Cases Dialog ── */}
      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) { setSourceProjectId(""); setSelectedTcIds(new Set()); } }}>
        <DialogContent className="sm:max-w-lg !duration-0 !animate-none">
          <DialogHeader>
            <DialogTitle>Import Test Cases</DialogTitle>
            <DialogDescription>
              Select a project and choose which test cases to copy into this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Source project</Label>
              <Select value={sourceProjectId} onValueChange={(v) => { setSourceProjectId(v); setSelectedTcIds(new Set()); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project…" />
                </SelectTrigger>
                <SelectContent>
                  {otherProjects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sourceProjectId && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Test cases</Label>
                  {(sourceTcs?.length ?? 0) > 0 && (
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        if (selectedTcIds.size === sourceTcs?.length) {
                          setSelectedTcIds(new Set());
                        } else {
                          setSelectedTcIds(new Set(sourceTcs?.map((t) => t.id) ?? []));
                        }
                      }}
                    >
                      {selectedTcIds.size === sourceTcs?.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                  {!sourceTcs ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">Loading…</div>
                  ) : sourceTcs.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">No test cases in this project.</div>
                  ) : (
                    sourceTcs.map((tc) => (
                      <label key={tc.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selectedTcIds.has(tc.id)}
                          onCheckedChange={() => toggleTc(tc.id)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{tc.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">TC-{tc.id} · {tc.priority}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={selectedTcIds.size === 0 || createTestCase.isPending}
            >
              {createTestCase.isPending ? "Importing…" : `Import ${selectedTcIds.size > 0 ? selectedTcIds.size : ""} test case${selectedTcIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ── Delete Test Case Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this test case?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>TC-{deleteTarget?.id}: {deleteTarget?.title}</strong> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteTestCase.isPending}
            >
              {deleteTestCase.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* ── Delete Project Dialog ── */}
      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project along with all its test cases and test runs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProject}
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
