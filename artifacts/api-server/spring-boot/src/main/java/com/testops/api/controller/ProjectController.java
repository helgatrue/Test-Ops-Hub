package com.testops.api.controller;

import com.testops.api.dto.CreateProjectRequest;
import com.testops.api.dto.UpdateProjectRequest;
import com.testops.api.entity.Project;
import com.testops.api.repository.ProjectRepository;
import com.testops.api.repository.TestCaseRepository;
import com.testops.api.repository.TestRunRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProjectController {

    private final ProjectRepository projectRepo;
    private final TestCaseRepository testCaseRepo;
    private final TestRunRepository testRunRepo;

    public ProjectController(ProjectRepository projectRepo,
                             TestCaseRepository testCaseRepo,
                             TestRunRepository testRunRepo) {
        this.projectRepo = projectRepo;
        this.testCaseRepo = testCaseRepo;
        this.testRunRepo = testRunRepo;
    }

    @GetMapping("/projects")
    public List<Map<String, Object>> listProjects() {
        return projectRepo.findAllByOrderByCreatedAtAsc().stream()
                .map(this::enrichProject)
                .toList();
    }

    @PostMapping("/projects")
    public ResponseEntity<Map<String, Object>> createProject(@RequestBody CreateProjectRequest req) {
        Project project = new Project();
        project.setName(req.getName());
        project.setDescription(req.getDescription());
        project.setRepoUrl(req.getRepoUrl());
        if (req.getDefaultBranch() != null) project.setDefaultBranch(req.getDefaultBranch());
        Project saved = projectRepo.save(project);

        Map<String, Object> result = entityToMap(saved);
        result.put("totalTestCases", 0);
        result.put("totalRuns", 0);
        result.put("lastRunAt", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<Map<String, Object>> getProject(@PathVariable Long projectId) {
        return projectRepo.findById(projectId)
                .map(p -> ResponseEntity.ok(enrichProject(p)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PatchMapping("/projects/{projectId}")
    public ResponseEntity<Map<String, Object>> updateProject(@PathVariable Long projectId,
                                                              @RequestBody UpdateProjectRequest req) {
        return projectRepo.findById(projectId).map(project -> {
            if (req.getName() != null) project.setName(req.getName());
            if (req.getDescription() != null) project.setDescription(req.getDescription());
            if (req.getRepoUrl() != null) project.setRepoUrl(req.getRepoUrl());
            if (req.getDefaultBranch() != null) project.setDefaultBranch(req.getDefaultBranch());
            project.setUpdatedAt(Instant.now());
            Project saved = projectRepo.save(project);
            return ResponseEntity.ok(enrichProject(saved));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long projectId) {
        projectRepo.deleteById(projectId);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> enrichProject(Project p) {
        Map<String, Object> map = entityToMap(p);
        map.put("totalTestCases", testCaseRepo.countByProjectId(p.getId()));
        map.put("totalRuns", testRunRepo.countByProjectId(p.getId()));
        // lastRunAt: fetch most recent run
        var runs = testRunRepo.findByProjectIdOrderByCreatedAtAsc(p.getId());
        Instant lastRunAt = null;
        if (!runs.isEmpty()) {
            lastRunAt = runs.get(runs.size() - 1).getCreatedAt();
        }
        map.put("lastRunAt", lastRunAt);
        return map;
    }

    private Map<String, Object> entityToMap(Project p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("name", p.getName());
        map.put("description", p.getDescription());
        map.put("repoUrl", p.getRepoUrl());
        map.put("defaultBranch", p.getDefaultBranch());
        map.put("createdAt", p.getCreatedAt());
        map.put("updatedAt", p.getUpdatedAt());
        return map;
    }
}
