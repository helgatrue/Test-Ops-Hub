package com.testops.api.controller;

import com.testops.api.dto.CreateTestCaseRequest;
import com.testops.api.dto.UpdateTestCaseRequest;
import com.testops.api.entity.TestCase;
import com.testops.api.repository.TestCaseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestCaseController {

    private final TestCaseRepository testCaseRepo;

    public TestCaseController(TestCaseRepository testCaseRepo) {
        this.testCaseRepo = testCaseRepo;
    }

    @GetMapping("/projects/{projectId}/test-cases")
    public List<TestCase> listTestCases(@PathVariable Long projectId,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) String priority,
                                        @RequestParam(required = false) String search) {
        return testCaseRepo.findFiltered(projectId, status, priority, search);
    }

    @PostMapping("/projects/{projectId}/test-cases")
    public ResponseEntity<TestCase> createTestCase(@PathVariable Long projectId,
                                                    @RequestBody CreateTestCaseRequest req) {
        TestCase tc = new TestCase();
        tc.setProjectId(projectId);
        tc.setTitle(req.getTitle());
        tc.setDescription(req.getDescription());
        tc.setPriority(req.getPriority() != null ? req.getPriority() : "medium");
        tc.setStatus(req.getStatus() != null ? req.getStatus() : "draft");
        tc.setLabels(req.getLabels() != null ? req.getLabels() : new ArrayList<>());
        tc.setSteps(req.getSteps() != null ? req.getSteps() : new ArrayList<>());
        tc.setAutomationStatus(req.getAutomationStatus() != null ? req.getAutomationStatus() : "manual");
        return ResponseEntity.status(HttpStatus.CREATED).body(testCaseRepo.save(tc));
    }

    @GetMapping("/projects/{projectId}/test-cases/{testCaseId}")
    public ResponseEntity<TestCase> getTestCase(@PathVariable Long projectId,
                                                 @PathVariable Long testCaseId) {
        return testCaseRepo.findByIdAndProjectId(testCaseId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/projects/{projectId}/test-cases/{testCaseId}")
    public ResponseEntity<TestCase> updateTestCase(@PathVariable Long projectId,
                                                    @PathVariable Long testCaseId,
                                                    @RequestBody UpdateTestCaseRequest req) {
        return testCaseRepo.findByIdAndProjectId(testCaseId, projectId).map(tc -> {
            if (req.getTitle() != null) tc.setTitle(req.getTitle());
            if (req.getDescription() != null) tc.setDescription(req.getDescription());
            if (req.getPriority() != null) tc.setPriority(req.getPriority());
            if (req.getStatus() != null) tc.setStatus(req.getStatus());
            if (req.getLabels() != null) tc.setLabels(req.getLabels());
            if (req.getSteps() != null) tc.setSteps(req.getSteps());
            if (req.getAutomationStatus() != null) tc.setAutomationStatus(req.getAutomationStatus());
            tc.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(testCaseRepo.save(tc));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/projects/{projectId}/test-cases/{testCaseId}")
    public ResponseEntity<Void> deleteTestCase(@PathVariable Long projectId,
                                                @PathVariable Long testCaseId) {
        testCaseRepo.findByIdAndProjectId(testCaseId, projectId)
                .ifPresent(testCaseRepo::delete);
        return ResponseEntity.noContent().build();
    }
}
