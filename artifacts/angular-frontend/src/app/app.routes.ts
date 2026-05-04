import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/app-layout').then(m => m.AppLayout),
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'projects', loadComponent: () => import('./pages/projects/list/project-list').then(m => m.ProjectList) },
      { path: 'projects/new', loadComponent: () => import('./pages/projects/new/project-new').then(m => m.ProjectNew) },
      { path: 'projects/:projectId', loadComponent: () => import('./pages/projects/detail/project-detail').then(m => m.ProjectDetail) },
      { path: 'projects/:projectId/test-cases/new', loadComponent: () => import('./pages/test-cases/new/test-case-new').then(m => m.TestCaseNew) },
      { path: 'projects/:projectId/test-cases/:testCaseId/edit', loadComponent: () => import('./pages/test-cases/edit/test-case-edit').then(m => m.TestCaseEdit) },
      { path: 'projects/:projectId/test-cases/:testCaseId', loadComponent: () => import('./pages/test-cases/detail/test-case-detail').then(m => m.TestCaseDetail) },
      { path: 'projects/:projectId/test-runs/new', loadComponent: () => import('./pages/test-runs/new/test-run-new').then(m => m.TestRunNew) },
      { path: 'projects/:projectId/test-runs/:testRunId', loadComponent: () => import('./pages/test-runs/detail/test-run-detail').then(m => m.TestRunDetail) },
      { path: 'checklists', loadComponent: () => import('./pages/checklists/list/checklist-list').then(m => m.ChecklistList) },
      { path: 'checklists/:groupId', loadComponent: () => import('./pages/checklists/group-detail/checklist-group-detail').then(m => m.ChecklistGroupDetail) },
      { path: 'checklists/:groupId/:checklistId', loadComponent: () => import('./pages/checklists/detail/checklist-detail').then(m => m.ChecklistDetail) },
      { path: 'projects/:projectId/checklists/new', loadComponent: () => import('./pages/checklists/new/checklist-new').then(m => m.ChecklistNew) },
      { path: 'projects/:projectId/checklists/:checklistId', loadComponent: () => import('./pages/checklists/detail/checklist-detail').then(m => m.ChecklistDetail) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings').then(m => m.Settings) },
    ]
  },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) },
];
