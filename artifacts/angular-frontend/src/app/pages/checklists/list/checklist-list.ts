import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Checklist, Project } from '../../../services/api.service';

@Component({
  selector: 'app-checklist-list',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checklist-list.html',
})
export class ChecklistList implements OnInit {
  projects = signal<Project[]>([]);
  checklists = signal<{ project: Project; lists: Checklist[] }[]>([]);
  loading = signal(true);
  selectedProjectId = signal<number | null>(null);

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const pid = this.route.snapshot.queryParamMap.get('projectId');
    if (pid) this.selectedProjectId.set(parseInt(pid));
    this.api.getProjects().subscribe({
      next: projects => {
        this.projects.set(projects);
        if (projects.length === 0) { this.loading.set(false); return; }
        let done = 0;
        const result: { project: Project; lists: Checklist[] }[] = [];
        projects.forEach(p => {
          this.api.getChecklists(p.id).subscribe({
            next: lists => {
              result.push({ project: p, lists });
              done++;
              if (done === projects.length) {
                result.sort((a, b) => a.project.name.localeCompare(b.project.name));
                this.checklists.set(result);
                this.loading.set(false);
              }
            },
            error: () => { done++; if (done === projects.length) { this.checklists.set(result); this.loading.set(false); } }
          });
        });
      },
      error: () => this.loading.set(false)
    });
  }

  get filteredChecklists() {
    const pid = this.selectedProjectId();
    if (!pid) return this.checklists();
    return this.checklists().filter(c => c.project.id === pid);
  }

  get totalCount() { return this.checklists().reduce((sum, c) => sum + c.lists.length, 0); }

  progress(cl: Checklist) {
    if (!cl.items.length) return 0;
    return Math.round((cl.items.filter(i => i.checked).length / cl.items.length) * 100);
  }

  checkedCount(cl: Checklist) { return cl.items.filter(i => i.checked).length; }

  timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}
