import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, Project } from '../../services/api.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app-layout.html',
})
export class AppLayout implements OnInit {
  projects = signal<Project[]>([]);
  projectsOpen = signal(false);
  currentUrl = signal('');

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getProjects().subscribe(p => this.projects.set(p));
    this.currentUrl.set(this.router.url);
    if (this.router.url.startsWith('/projects')) {
      this.projectsOpen.set(true);
    }
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.currentUrl.set(e.urlAfterRedirects);
      if (e.urlAfterRedirects.startsWith('/projects')) {
        this.projectsOpen.set(true);
      }
      this.api.getProjects().subscribe(p => this.projects.set(p));
    });
  }

  toggleProjects() {
    this.projectsOpen.update(v => !v);
  }

  isActive(path: string): boolean {
    return this.currentUrl() === path;
  }

  isActivePrefix(prefix: string): boolean {
    return this.currentUrl().startsWith(prefix);
  }
}
