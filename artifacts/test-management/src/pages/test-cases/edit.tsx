import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetTestCase,
  useUpdateTestCase,
  getGetTestCaseQueryKey,
  getListTestCasesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function TestCaseEdit() {
  const { projectId, testCaseId } = useParams<{
    projectId: string;
    testCaseId: string;
  }>();
  const pId = parseInt(projectId, 10);
  const tcId = parseInt(testCaseId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tc, isLoading } = useGetTestCase(pId, tcId, {
    query: {
      enabled: !!(pId && tcId),
      queryKey: getGetTestCaseQueryKey(pId, tcId),
    },
  });

  const updateTestCase = useUpdateTestCase();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [status, setStatus] = useState<"draft" | "active" | "deprecated">("active");
  const [automationStatus, setAutomationStatus] = useState<
    "manual" | "automated" | "to_automate"
  >("manual");
  const [labelsInput, setLabelsInput] = useState("");
  const [steps, setSteps] = useState<Array<{ order: number; action: string; expected: string }>>(
    []
  );

  useEffect(() => {
    if (tc) {
      setTitle(tc.title);
      setDescription(tc.description ?? "");
      setPriority(tc.priority as any);
      setStatus(tc.status as any);
      setAutomationStatus(tc.automationStatus as any);
      setLabelsInput((tc.labels ?? []).join(", "));
      setSteps(
        tc.steps?.length
          ? (tc.steps as Array<{ order: number; action: string; expected: string }>)
          : [{ order: 1, action: "", expected: "" }]
      );
    }
  }, [tc]);

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, action: "", expected: "" }]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps.map((step, i) => ({ ...step, order: i + 1 })));
  };

  const updateStep = (index: number, field: "action" | "expected", value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const labels = labelsInput
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    updateTestCase.mutate(
      {
        projectId: pId,
        testCaseId: tcId,
        data: {
          title,
          description: description || undefined,
          priority,
          status,
          automationStatus,
          labels,
          steps: steps.filter((s) => s.action.trim() || s.expected.trim()),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTestCaseQueryKey(pId, tcId) });
          queryClient.invalidateQueries({ queryKey: getListTestCasesQueryKey(pId, {}) });
          toast({ title: "Test case updated" });
          setLocation(`/projects/${pId}/test-cases/${tcId}`);
        },
        onError: (err) => {
          toast({
            title: "Failed to update test case",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading test case...</div>
    );
  if (!tc)
    return (
      <div className="p-8 text-center text-destructive">Test case not found</div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${pId}/test-cases/${tcId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="text-sm text-muted-foreground font-mono mb-1">TC-{tc.id}</div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Test Case</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. User can reset password via email link"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Preconditions, test data, context..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Automation Status</Label>
                <Select
                  value={automationStatus}
                  onValueChange={(v: any) => setAutomationStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="to_automate">To Automate</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Labels</Label>
                <Input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="auth, smoke, regression (comma-separated)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test Steps</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="w-4 h-4 mr-2" /> Add Step
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No steps yet. Click "Add Step" to define the test procedure.
              </p>
            )}
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 border rounded-md relative group"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium text-sm flex-shrink-0">
                  {step.order}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Action</Label>
                    <Textarea
                      value={step.action}
                      onChange={(e) => updateStep(index, "action", e.target.value)}
                      className="min-h-[60px]"
                      placeholder="What the tester does..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Expected Result</Label>
                    <Textarea
                      value={step.expected}
                      onChange={(e) => updateStep(index, "expected", e.target.value)}
                      className="min-h-[60px]"
                      placeholder="What should happen..."
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                  onClick={() => removeStep(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(`/projects/${pId}/test-cases/${tcId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateTestCase.isPending}>
            {updateTestCase.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
