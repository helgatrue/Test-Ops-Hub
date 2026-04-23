import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import ProjectsList from "@/pages/projects/list";
import ProjectNew from "@/pages/projects/new";
import ProjectDetail from "@/pages/projects/detail";
import TestCaseNew from "@/pages/test-cases/new";
import TestCaseDetail from "@/pages/test-cases/detail";
import TestRunNew from "@/pages/test-runs/new";
import TestRunDetail from "@/pages/test-runs/detail";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={ProjectsList} />
        <Route path="/projects/new" component={ProjectNew} />
        <Route path="/projects/:projectId" component={ProjectDetail} />
        <Route path="/projects/:projectId/test-cases/new" component={TestCaseNew} />
        <Route path="/projects/:projectId/test-cases/:testCaseId" component={TestCaseDetail} />
        <Route path="/projects/:projectId/test-runs/new" component={TestRunNew} />
        <Route path="/projects/:projectId/test-runs/:testRunId" component={TestRunDetail} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
