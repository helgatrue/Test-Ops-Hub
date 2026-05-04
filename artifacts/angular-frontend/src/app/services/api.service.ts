import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  id: number;
  name: string;
  description?: string;
  repoUrl?: string;
  defaultBranch?: string;
  totalTestCases: number;
  totalRuns: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  automationStatus: string;
  labels: string[];
  steps: Array<{ order: number; action: string; expected: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  id: number;
  testCaseId: number;
  testCaseTitle: string;
  status: string;
  duration?: number;
  errorMessage?: string;
  stackTrace?: string;
}

export interface TestRun {
  id: number;
  projectId: number;
  name: string;
  status: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  branch?: string;
  commitHash?: string;
  ciProvider?: string;
  results?: TestResult[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  overallPassRate: number;
  activeRuns: number;
  totalProjects: number;
  totalTestCases: number;
}

export interface PassRateTrend {
  date: string;
  passRate: number;
}

export interface RecentRun {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  status: string;
  passedTests: number;
  failedTests: number;
  createdAt: string;
}

export interface TopFailingTest {
  testCaseId: number;
  testCaseTitle: string;
  projectId: number;
  projectName: string;
  failureCount: number;
}

export interface ChecklistGroup {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  checked: boolean;
  order: number;
}

export interface Checklist {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`/api/projects/${id}`);
  }

  createProject(data: { name: string; description?: string; repoUrl?: string; defaultBranch?: string }): Observable<Project> {
    return this.http.post<Project>('/api/projects', data);
  }

  updateProject(id: number, data: { name?: string; description?: string; repoUrl?: string; defaultBranch?: string }): Observable<Project> {
    return this.http.put<Project>(`/api/projects/${id}`, data);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${id}`);
  }

  getTestCases(projectId: number, params?: { status?: string }): Observable<TestCase[]> {
    let url = `/api/projects/${projectId}/test-cases`;
    if (params?.status) url += `?status=${params.status}`;
    return this.http.get<TestCase[]>(url);
  }

  getTestCase(projectId: number, testCaseId: number): Observable<TestCase> {
    return this.http.get<TestCase>(`/api/projects/${projectId}/test-cases/${testCaseId}`);
  }

  createTestCase(projectId: number, data: Partial<TestCase>): Observable<TestCase> {
    return this.http.post<TestCase>(`/api/projects/${projectId}/test-cases`, data);
  }

  updateTestCase(projectId: number, testCaseId: number, data: Partial<TestCase>): Observable<TestCase> {
    return this.http.put<TestCase>(`/api/projects/${projectId}/test-cases/${testCaseId}`, data);
  }

  deleteTestCase(projectId: number, testCaseId: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${projectId}/test-cases/${testCaseId}`);
  }

  getTestRuns(projectId: number): Observable<TestRun[]> {
    return this.http.get<TestRun[]>(`/api/projects/${projectId}/test-runs`);
  }

  getTestRun(projectId: number, testRunId: number): Observable<TestRun> {
    return this.http.get<TestRun>(`/api/projects/${projectId}/test-runs/${testRunId}`);
  }

  createTestRun(projectId: number, data: { name: string; testCaseIds: number[] }): Observable<TestRun> {
    return this.http.post<TestRun>(`/api/projects/${projectId}/test-runs`, data);
  }

  updateTestResult(projectId: number, testRunId: number, resultId: number, data: { status: string }): Observable<TestResult> {
    return this.http.patch<TestResult>(`/api/projects/${projectId}/test-runs/${testRunId}/results/${resultId}`, data);
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/api/dashboard/summary');
  }

  getPassRateTrend(): Observable<PassRateTrend[]> {
    return this.http.get<PassRateTrend[]>('/api/dashboard/pass-rate-trend');
  }

  getRecentRuns(limit = 5): Observable<RecentRun[]> {
    return this.http.get<RecentRun[]>(`/api/dashboard/recent-runs?limit=${limit}`);
  }

  getTopFailingTests(limit = 5): Observable<TopFailingTest[]> {
    return this.http.get<TopFailingTest[]>(`/api/dashboard/top-failing-tests?limit=${limit}`);
  }

  getChecklistGroups(): Observable<ChecklistGroup[]> {
    return this.http.get<ChecklistGroup[]>('/api/checklist-groups');
  }

  createChecklistGroup(data: { name: string; description?: string }): Observable<ChecklistGroup> {
    return this.http.post<ChecklistGroup>('/api/checklist-groups', data);
  }

  updateChecklistGroup(id: number, data: { name?: string; description?: string }): Observable<ChecklistGroup> {
    return this.http.put<ChecklistGroup>(`/api/checklist-groups/${id}`, data);
  }

  deleteChecklistGroup(id: number): Observable<void> {
    return this.http.delete<void>(`/api/checklist-groups/${id}`);
  }

  getGroupChecklists(groupId: number): Observable<Checklist[]> {
    return this.http.get<Checklist[]>(`/api/checklist-groups/${groupId}/checklists`);
  }

  getGroupChecklist(groupId: number, checklistId: number): Observable<Checklist> {
    return this.http.get<Checklist>(`/api/checklist-groups/${groupId}/checklists/${checklistId}`);
  }

  createGroupChecklist(groupId: number, data: { title: string; description?: string; items: ChecklistItem[] }): Observable<Checklist> {
    return this.http.post<Checklist>(`/api/checklist-groups/${groupId}/checklists`, data);
  }

  updateGroupChecklist(groupId: number, checklistId: number, data: { title?: string; description?: string; status?: string; items?: ChecklistItem[] }): Observable<Checklist> {
    return this.http.put<Checklist>(`/api/checklist-groups/${groupId}/checklists/${checklistId}`, data);
  }

  deleteGroupChecklist(groupId: number, checklistId: number): Observable<void> {
    return this.http.delete<void>(`/api/checklist-groups/${groupId}/checklists/${checklistId}`);
  }

  getChecklists(projectId: number): Observable<Checklist[]> {
    return this.http.get<Checklist[]>(`/api/projects/${projectId}/checklists`);
  }

  getChecklist(projectId: number, checklistId: number): Observable<Checklist> {
    return this.http.get<Checklist>(`/api/projects/${projectId}/checklists/${checklistId}`);
  }

  createChecklist(projectId: number, data: { title: string; description?: string; items: ChecklistItem[] }): Observable<Checklist> {
    return this.http.post<Checklist>(`/api/projects/${projectId}/checklists`, data);
  }

  updateChecklist(projectId: number, checklistId: number, data: { title?: string; description?: string; status?: string; items?: ChecklistItem[] }): Observable<Checklist> {
    return this.http.put<Checklist>(`/api/projects/${projectId}/checklists/${checklistId}`, data);
  }

  deleteChecklist(projectId: number, checklistId: number): Observable<void> {
    return this.http.delete<void>(`/api/projects/${projectId}/checklists/${checklistId}`);
  }
}
