import { useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Plus, FolderKanban, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ProjectsList() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage test suites across your applications.</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : projects?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <Card className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-muted-foreground" />
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto pb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-muted-foreground">Test Cases</div>
                      <div className="font-medium text-lg">{project.totalTestCases}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Runs</div>
                      <div className="font-medium text-lg">{project.totalRuns}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {project.lastRunAt ? `Last run ${formatDistanceToNow(new Date(project.lastRunAt))} ago` : "Never run"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed rounded-lg">
          <FolderKanban className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No projects</h3>
          <p className="text-muted-foreground mb-4">Create your first project to start tracking test cases.</p>
          <Link href="/projects/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Link>
        </div>
      )}
    </div>
  );
}
