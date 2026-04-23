import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useCreateTestRun, useListTestCases, getListTestCasesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Play } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function TestRunNew() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

  const { data: testCases, isLoading } = useListTestCases(id, { status: "active" }, {
    query: { enabled: !!id, queryKey: getListTestCasesQueryKey(id, { status: "active" }) }
  });

  const createRun = useCreateTestRun();

  const handleToggle = (tcId: number) => {
    setSelectedTests(prev => 
      prev.includes(tcId) ? prev.filter(i => i !== tcId) : [...prev, tcId]
    );
  };

  const handleToggleAll = () => {
    if (!testCases) return;
    if (selectedTests.length === testCases.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(testCases.map(tc => tc.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (selectedTests.length === 0) {
      toast({ title: "Select at least one test case", variant: "destructive" });
      return;
    }

    createRun.mutate({
      data: {
        name,
        testCaseIds: selectedTests
      }
    }, {
      onSuccess: (run) => {
        toast({ title: "Test Run Started" });
        setLocation(`/projects/${id}/test-runs/${run.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to start run", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Test Run</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Run Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Run Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Release 2.4.0 Regression" required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Select Test Cases</CardTitle>
              <CardDescription>Choose tests to include in this run</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {selectedTests.length} selected
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading test cases...</div>
            ) : testCases?.length ? (
              <div className="border rounded-md divide-y">
                <div className="flex items-center gap-3 p-4 bg-muted/50">
                  <Checkbox 
                    checked={selectedTests.length === testCases.length && testCases.length > 0} 
                    onCheckedChange={handleToggleAll} 
                  />
                  <span className="font-medium text-sm">Select All</span>
                </div>
                {testCases.map(tc => (
                  <div key={tc.id} className="flex items-center gap-3 p-4 hover:bg-muted/20">
                    <Checkbox 
                      checked={selectedTests.includes(tc.id)} 
                      onCheckedChange={() => handleToggle(tc.id)} 
                      id={`tc-${tc.id}`}
                    />
                    <label htmlFor={`tc-${tc.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">{tc.title}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">TC-{tc.id}</div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                No active test cases available.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setLocation(`/projects/${id}`)}>Cancel</Button>
          <Button type="submit" disabled={createRun.isPending || selectedTests.length === 0}>
            <Play className="w-4 h-4 mr-2" />
            {createRun.isPending ? "Starting..." : "Start Run"}
          </Button>
        </div>
      </form>
    </div>
  );
}
