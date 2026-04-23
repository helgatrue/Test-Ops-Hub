import { useParams, Link } from "wouter";
import { useGetTestCase, getGetTestCaseQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

export default function TestCaseDetail() {
  const { projectId, testCaseId } = useParams<{ projectId: string, testCaseId: string }>();
  const pId = parseInt(projectId, 10);
  const tcId = parseInt(testCaseId, 10);

  const { data: tc, isLoading } = useGetTestCase(pId, tcId, {
    query: { enabled: !!(pId && tcId), queryKey: getGetTestCaseQueryKey(pId, tcId) }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading test case...</div>;
  if (!tc) return <div className="p-8 text-center text-destructive">Test case not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${pId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-muted-foreground">TC-{tc.id}</span>
              <PriorityBadge priority={tc.priority} />
              <Badge variant="secondary">{tc.automationStatus}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{tc.title}</h1>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="w-4 h-4 mr-2" /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {tc.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap">
                {tc.description}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {tc.steps?.length ? (
                <div className="divide-y border rounded-md">
                  {tc.steps.map((step, i) => (
                    <div key={i} className="flex p-4 gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium text-sm flex-shrink-0">
                        {step.order}
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Action</div>
                          <div className="whitespace-pre-wrap text-sm">{step.action}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expected</div>
                          <div className="whitespace-pre-wrap text-sm">{step.expected}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-4">No steps defined.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <div className="capitalize">{tc.status}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Labels</div>
                <div className="flex flex-wrap gap-2">
                  {tc.labels?.length ? tc.labels.map(l => <Badge key={l} variant="outline">{l}</Badge>) : <span className="text-sm text-muted-foreground">None</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
