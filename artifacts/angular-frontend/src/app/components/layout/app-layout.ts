import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, Project, ChecklistGroup } from '../../services/api.service';
import { GlobalMenuService } from '../../services/global-menu.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app-layout.html',
})
export class AppLayout implements OnInit {
  projects = signal<Project[]>([]);
  projectsOpen = signal(false);
  checklistGroups = signal<ChecklistGroup[]>([]);
  checklistsOpen = signal(false);
  currentUrl = signal('');

  constructor(private api: ApiService, private router: Router, public globalMenu: GlobalMenuService) {}

  ngOnInit() {
    this.api.getProjects().subscribe(p => this.projects.set(p));
    this.api.getChecklistGroups().subscribe(g => this.checklistGroups.set(g));
    this.currentUrl.set(this.router.url);
    if (this.router.url.startsWith('/projects')) this.projectsOpen.set(true);
    if (this.router.url.startsWith('/checklists')) this.checklistsOpen.set(true);

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentUrl.set(e.urlAfterRedirects);
      if (e.urlAfterRedirects.startsWith('/projects')) this.projectsOpen.set(true);
      if (e.urlAfterRedirects.startsWith('/checklists')) this.checklistsOpen.set(true);
      this.api.getProjects().subscribe(p => this.projects.set(p));
      this.api.getChecklistGroups().subscribe(g => this.checklistGroups.set(g));
    });
  }

  toggleProjects() { this.projectsOpen.update(v => !v); }
  toggleChecklists() { this.checklistsOpen.update(v => !v); }

  isActive(path: string): boolean { return this.currentUrl() === path; }
  isActivePrefix(prefix: string): boolean { return this.currentUrl().startsWith(prefix); }

  runMenuAction(action: () => void) {
    action();
    this.globalMenu.close();
  }
}
