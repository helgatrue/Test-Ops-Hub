package com.testops.api.controller;

import com.testops.api.dto.CreateTestRunRequest;
import com.testops.api.dto.UpdateTestRunRequest;
import com.testops.api.entity.TestResult;
import com.testops.api.entity.TestRun;
import com.testops.api.repository.TestCaseRepository;
import com.testops.api.repository.TestResultRepository;
import com.testops.api.repository.TestRunRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestRunController {

    private final TestRunRepository testRunRepo;
    private final TestResultRepository testResultRepo;
    private final TestCaseRepository testCaseRepo;

    public TestRunController(TestRunRepository testRunRepo,
                              TestResultRepository testResultRepo,
                              TestCaseRepository testCaseRepo) {
        this.testRunRepo = testRunRepo;
        this.testResultRepo = testResultRepo;
        this.testCaseRepo = testCaseRepo;
    }

    @GetMapping("/projects/{projectId}/test-runs")
    public List<TestRun> listTestRuns(@PathVariable Long projectId,
                                       @RequestParam(required = false) String status) {
        return testRunRepo.findFiltered(projectId, status);
    }

    @PostMapping("/projects/{projectId}/test-runs")
    public ResponseEntity<TestRun> createTestRun(@PathVariable Long projectId,
                                                  @RequestBody CreateTestRunRequest req) {
        List<Long> tcIds = req.getTestCaseIds() != null ? req.getTestCaseIds() : List.of();

        TestRun run = new TestRun();
        run.setProjectId(projectId);
        run.setName(req.getName());
        run.setBranch(req.getBranch());
        run.setCommitHash(req.getCommitHash());
        run.setCommitMessage(req.getCommitMessage());
        run.setTriggeredBy(req.getTriggeredBy());
        run.setCiProvider(req.getCiProvider());
        run.setStatus("pending");
        run.setTotalTests(tcIds.size());
        run.setPassedTests(0);
        run.setFailedTests(0);
        run.setSkippedTests(0);
        run.setBlockedTests(0);
        TestRun saved = testRunRepo.save(run);

        if (!tcIds.isEmpty()) {
            List<TestResult> results = tcIds.stream().map(tcId -> {
                TestResult r = new TestResult();
                r.setTestRunId(saved.getId());
                r.setTestCaseId(tcId);
                r.setStatus("pending");
                r.setRetries(0);
                return r;
            }).toList();
            testResultRepo.saveAll(results);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/projects/{projectId}/test-runs/{testRunId}")
    public ResponseEntity<Map<String, Object>> getTestRun(@PathVariable Long projectId,
                                                           @PathVariable Long testRunId) {
        return testRunRepo.findByIdAndProjectId(testRunId, projectId).map(run -> {
            List<TestResult> rawResults = testResultRepo.findByTestRunId(testRunId);
            List<Map<String, Object>> results = rawResults.stream().map(r -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("testRunId", r.getTestRunId());
                map.put("testCaseId", r.getTestCaseId());
                map.put("status", r.getStatus());
                map.put("errorMessage", r.getErrorMessage());
                map.put("stackTrace", r.getStackTrace());
                map.put("duration", r.getDuration());
                map.put("retries", r.getRetries());
                map.put("createdAt", r.getCreatedAt());
                map.put("updatedAt", r.getUpdatedAt());
                // fetch test case title
                map.put("testCaseTitle", testCaseRepo.findById(r.getTestCaseId())
                        .map(tc -> tc.getTitle()).orElse(""));
                return map;
            }).toList();

            Map<String, Object> response = runToMap(run);
            response.put("results", results);
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/projects/{projectId}/test-runs/{testRunId}")
    public ResponseEntity<TestRun> updateTestRun(@PathVariable Long projectId,
                                                  @PathVariable Long testRunId,
                                                  @RequestBody UpdateTestRunRequest req) {
        return testRunRepo.findByIdAndProjectId(testRunId, projectId).map(run -> {
            if (req.getName() != null) run.setName(req.getName());
            if (req.getStatus() != null) run.setStatus(req.getStatus());
            if (req.getBranch() != null) run.setBranch(req.getBranch());
            if (req.getCommitHash() != null) run.setCommitHash(req.getCommitHash());
            if (req.getCommitMessage() != null) run.setCommitMessage(req.getCommitMessage());
            if (req.getTriggeredBy() != null) run.setTriggeredBy(req.getTriggeredBy());
            if (req.getCiProvider() != null) run.setCiProvider(req.getCiProvider());
            if (req.getTotalTests() != null) run.setTotalTests(req.getTotalTests());
            if (req.getPassedTests() != null) run.setPassedTests(req.getPassedTests());
            if (req.getFailedTests() != null) run.setFailedTests(req.getFailedTests());
            if (req.getSkippedTests() != null) run.setSkippedTests(req.getSkippedTests());
            if (req.getBlockedTests() != null) run.setBlockedTests(req.getBlockedTests());
            if (req.getDuration() != null) run.setDuration(req.getDuration());
            if (req.getStartedAt() != null) run.setStartedAt(req.getStartedAt());
            if (req.getFinishedAt() != null) run.setFinishedAt(req.getFinishedAt());
            run.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(testRunRepo.save(run));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/projects/{projectId}/test-runs/{testRunId}")
    public ResponseEntity<Void> deleteTestRun(@PathVariable Long projectId,
                                               @PathVariable Long testRunId) {
        testRunRepo.findByIdAndProjectId(testRunId, projectId)
                .ifPresent(testRunRepo::delete);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> runToMap(TestRun r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("projectId", r.getProjectId());
        map.put("name", r.getName());
        map.put("status", r.getStatus());
        map.put("branch", r.getBranch());
        map.put("commitHash", r.getCommitHash());
        map.put("commitMessage", r.getCommitMessage());
        map.put("triggeredBy", r.getTriggeredBy());
        map.put("ciProvider", r.getCiProvider());
        map.put("totalTests", r.getTotalTests());
        map.put("passedTests", r.getPassedTests());
        map.put("failedTests", r.getFailedTests());
        map.put("skippedTests", r.getSkippedTests());
        map.put("blockedTests", r.getBlockedTests());
        map.put("duration", r.getDuration());
        map.put("startedAt", r.getStartedAt());
        map.put("finishedAt", r.getFinishedAt());
        map.put("createdAt", r.getCreatedAt());
        map.put("updatedAt", r.getUpdatedAt());
        return map;
    }
}
