import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useCreateTestCase } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function TestCaseNew() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTestCase = useCreateTestCase();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [automationStatus, setAutomationStatus] = useState<"manual" | "automated" | "to_automate">("manual");
  
  const [steps, setSteps] = useState([{ order: 1, action: "", expected: "" }]);

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
    if (!title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    createTestCase.mutate({
      projectId: id,
      data: {
        title,
        description,
        priority,
        automationStatus,
        status: "active",
        steps: steps.filter(s => s.action.trim() || s.expected.trim())
      }
    }, {
      onSuccess: (tc) => {
        toast({ title: "Test Case Created" });
        setLocation(`/projects/${id}/test-cases/${tc.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to create test case", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Test Case</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. User can reset password via email link" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Preconditions, test data, etc." className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
                <Label>Automation Status</Label>
                <Select value={automationStatus} onValueChange={(v: any) => setAutomationStatus(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="to_automate">To Automate</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                  </SelectContent>
                </Select>
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
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-md relative group">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium text-sm flex-shrink-0">
                  {step.order}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Action</Label>
                    <Textarea value={step.action} onChange={e => updateStep(index, "action", e.target.value)} className="min-h-[60px]" placeholder="What the user does..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Expected Result</Label>
                    <Textarea value={step.expected} onChange={e => updateStep(index, "expected", e.target.value)} className="min-h-[60px]" placeholder="What should happen..." />
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeStep(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setLocation(`/projects/${id}`)}>Cancel</Button>
          <Button type="submit" disabled={createTestCase.isPending}>
            {createTestCase.isPending ? "Creating..." : "Save Test Case"}
          </Button>
        </div>
      </form>
    </div>
  );
}
