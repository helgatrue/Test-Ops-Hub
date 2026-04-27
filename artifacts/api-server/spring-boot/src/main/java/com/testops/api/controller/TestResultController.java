package com.testops.api.controller;

import com.testops.api.dto.CreateTestResultRequest;
import com.testops.api.dto.UpdateTestResultRequest;
import com.testops.api.entity.TestResult;
import com.testops.api.entity.TestRun;
import com.testops.api.repository.TestCaseRepository;
import com.testops.api.repository.TestResultRepository;
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
public class TestResultController {

    private final TestResultRepository testResultRepo;
    private final TestRunRepository testRunRepo;
    private final TestCaseRepository testCaseRepo;

    public TestResultController(TestResultRepository testResultRepo,
                                 TestRunRepository testRunRepo,
                                 TestCaseRepository testCaseRepo) {
        this.testResultRepo = testResultRepo;
        this.testRunRepo = testRunRepo;
        this.testCaseRepo = testCaseRepo;
    }

    @GetMapping("/projects/{projectId}/test-runs/{testRunId}/results")
    public List<Map<String, Object>> listResults(@PathVariable Long projectId,
                                                  @PathVariable Long testRunId,
                                                  @RequestParam(required = false) String status) {
        return testResultRepo.findFiltered(testRunId, status).stream()
                .map(this::enrichResult)
                .toList();
    }

    @PostMapping("/projects/{projectId}/test-runs/{testRunId}/results")
    public ResponseEntity<Map<String, Object>> createResult(@PathVariable Long projectId,
                                                             @PathVariable Long testRunId,
                                                             @RequestBody CreateTestResultRequest req) {
        TestResult result = new TestResult();
        result.setTestRunId(testRunId);
        result.setTestCaseId(req.getTestCaseId());
        result.setStatus(req.getStatus() != null ? req.getStatus() : "pending");
        result.setErrorMessage(req.getErrorMessage());
        result.setStackTrace(req.getStackTrace());
        result.setDuration(req.getDuration());
        result.setRetries(req.getRetries() != null ? req.getRetries() : 0);
        TestResult saved = testResultRepo.save(result);

        updateRunCounts(testRunId);

        return ResponseEntity.status(HttpStatus.CREATED).body(enrichResult(saved));
    }

    @PatchMapping("/projects/{projectId}/test-runs/{testRunId}/results/{resultId}")
    public ResponseEntity<Map<String, Object>> updateResult(@PathVariable Long projectId,
                                                             @PathVariable Long testRunId,
                                                             @PathVariable Long resultId,
                                                             @RequestBody UpdateTestResultRequest req) {
        return testResultRepo.findById(resultId).map(result -> {
            if (req.getStatus() != null) result.setStatus(req.getStatus());
            if (req.getErrorMessage() != null) result.setErrorMessage(req.getErrorMessage());
            if (req.getStackTrace() != null) result.setStackTrace(req.getStackTrace());
            if (req.getDuration() != null) result.setDuration(req.getDuration());
            if (req.getRetries() != null) result.setRetries(req.getRetries());
            result.setUpdatedAt(Instant.now());
            TestResult saved = testResultRepo.save(result);
            updateRunCounts(testRunId);
            return ResponseEntity.ok(enrichResult(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    private void updateRunCounts(Long testRunId) {
        List<TestResult> results = testResultRepo.findByTestRunId(testRunId);
        int passed = (int) results.stream().filter(r -> "passed".equals(r.getStatus())).count();
        int failed = (int) results.stream().filter(r -> "failed".equals(r.getStatus())).count();
        int skipped = (int) results.stream().filter(r -> "skipped".equals(r.getStatus())).count();
        int blocked = (int) results.stream().filter(r -> "blocked".equals(r.getStatus())).count();
        boolean allDone = results.stream().noneMatch(r -> "pending".equals(r.getStatus()));

        testRunRepo.findById(testRunId).ifPresent(run -> {
            run.setTotalTests(results.size());
            run.setPassedTests(passed);
            run.setFailedTests(failed);
            run.setSkippedTests(skipped);
            run.setBlockedTests(blocked);
            if (allDone) {
                run.setStatus(failed > 0 ? "failed" : "passed");
            }
            run.setUpdatedAt(Instant.now());
            testRunRepo.save(run);
        });
    }

    private Map<String, Object> enrichResult(TestResult r) {
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
        map.put("testCaseTitle", testCaseRepo.findById(r.getTestCaseId())
                .map(tc -> tc.getTitle()).orElse(""));
        return map;
    }
}
