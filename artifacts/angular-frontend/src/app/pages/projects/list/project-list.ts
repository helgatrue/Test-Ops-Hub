import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Project } from '../../../services/api.service';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './project-list.html',
})
export class ProjectList implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getProjects().subscribe({ next: p => { this.projects.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}
