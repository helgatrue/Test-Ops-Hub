import { useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Settings, Beaker, ChevronRight } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(location.startsWith("/projects"));
  const { data: projects } = useListProjects();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="h-14 flex items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-sidebar-primary">
              <Beaker className="w-5 h-5" />
              <span>TestOPS</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={location.startsWith("/projects")} className="w-full justify-between">
                      <span className="flex items-center">
                        <FolderKanban className="w-4 h-4 mr-2" />
                        Projects
                      </span>
                      <ChevronRight
                        className="w-4 h-4 text-muted-foreground transition-transform duration-200"
                        style={{ transform: projectsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/projects"}>
                          <Link href="/projects">All Projects</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {projects?.map(project => (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location.startsWith(`/projects/${project.id}`)}
                          >
                            <Link href={`/projects/${project.id}`}>
                              <span className="truncate">{project.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/settings")}>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 lg:hidden">
            <SidebarTrigger />
            <span className="font-bold ml-4">TestOPS</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
