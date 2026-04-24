import { Badge } from "@/components/ui/badge";

type StatusProps = {
  status: string;
};

export function StatusBadge({ status }: StatusProps) {
  switch (status.toLowerCase()) {
    case "passed":
      return <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/20">Passed</Badge>;
    case "failed":
      return <Badge variant="outline" className="border-destructive/20 bg-[#ef43431a] text-[#ef4443]">Failed</Badge>;
    case "skipped":
      return <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">Skipped</Badge>;
    case "running":
      return <Badge variant="outline" className="bg-info/10 text-info-foreground border-info/20 animate-pulse">Running</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Pending</Badge>;
    case "blocked":
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20">Blocked</Badge>;
    case "aborted":
      return <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/20">Aborted</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: string }) {
  switch (priority.toLowerCase()) {
    case "critical":
      return <Badge variant="outline" className="text-destructive border-destructive/30">Critical</Badge>;
    case "high":
      return <Badge variant="outline" className="text-warning border-warning/30">High</Badge>;
    case "medium":
      return <Badge variant="outline" className="text-info border-info/30">Medium</Badge>;
    case "low":
      return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}
