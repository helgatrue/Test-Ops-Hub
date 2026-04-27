package com.testops.api.controller;

import com.testops.api.entity.TestRun;
import com.testops.api.repository.ProjectRepository;
import com.testops.api.repository.TestCaseRepository;
import com.testops.api.repository.TestResultRepository;
import com.testops.api.repository.TestRunRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ProjectRepository projectRepo;
    private final TestCaseRepository testCaseRepo;
    private final TestRunRepository testRunRepo;
    private final TestResultRepository testResultRepo;

    public DashboardController(ProjectRepository projectRepo,
                                TestCaseRepository testCaseRepo,
                                TestRunRepository testRunRepo,
                                TestResultRepository testResultRepo) {
        this.projectRepo = projectRepo;
        this.testCaseRepo = testCaseRepo;
        this.testRunRepo = testRunRepo;
        this.testResultRepo = testResultRepo;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        long totalProjects = projectRepo.count();
        long totalTestCases = testCaseRepo.count();
        long totalRuns = testRunRepo.count();

        List<TestRun> allRuns = testRunRepo.findAll();
        long activeRuns = allRuns.stream().filter(r -> "running".equals(r.getStatus())).count();

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long passedLast7 = allRuns.stream()
                .filter(r -> "passed".equals(r.getStatus()) && r.getCreatedAt().isAfter(sevenDaysAgo))
                .count();
        long failedLast7 = allRuns.stream()
                .filter(r -> "failed".equals(r.getStatus()) && r.getCreatedAt().isAfter(sevenDaysAgo))
                .count();

        List<TestRun> completedRuns = allRuns.stream()
                .filter(r -> ("passed".equals(r.getStatus()) || "failed".equals(r.getStatus()))
                        && r.getTotalTests() > 0)
                .toList();

        double overallPassRate = completedRuns.isEmpty() ? 0.0 :
                completedRuns.stream()
                        .mapToDouble(r -> (double) r.getPassedTests() / r.getTotalTests() * 100)
                        .average().orElse(0.0);

        OptionalDouble avgDuration = allRuns.stream()
                .filter(r -> r.getDuration() != null)
                .mapToInt(TestRun::getDuration)
                .average();

        Map<String, Object> result = new HashMap<>();
        result.put("totalProjects", totalProjects);
        result.put("totalTestCases", totalTestCases);
        result.put("totalRuns", totalRuns);
        result.put("activeRuns", activeRuns);
        result.put("overallPassRate", Math.round(overallPassRate * 10.0) / 10.0);
        result.put("passedLast7Days", passedLast7);
        result.put("failedLast7Days", failedLast7);
        result.put("avgDuration", avgDuration.isPresent() ? (long) avgDuration.getAsDouble() : null);
        return result;
    }

    @GetMapping("/recent-runs")
    public List<Map<String, Object>> recentRuns(@RequestParam(defaultValue = "10") int limit) {
        int safeLimit = Math.min(limit, 50);
        return testRunRepo.findAllOrderByCreatedAtDesc(PageRequest.of(0, safeLimit)).stream()
                .map(run -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", run.getId());
                    map.put("name", run.getName());
                    map.put("projectId", run.getProjectId());
                    map.put("status", run.getStatus());
                    map.put("totalTests", run.getTotalTests());
                    map.put("passedTests", run.getPassedTests());
                    map.put("failedTests", run.getFailedTests());
                    map.put("duration", run.getDuration());
                    map.put("createdAt", run.getCreatedAt());
                    // fetch project name
                    map.put("projectName", projectRepo.findById(run.getProjectId())
                            .map(p -> p.getName()).orElse(""));
                    return map;
                }).toList();
    }

    @GetMapping("/pass-rate-trend")
    public List<Map<String, Object>> passRateTrend() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<TestRun> runs = testRunRepo.findAll().stream()
                .filter(r -> ("passed".equals(r.getStatus()) || "failed".equals(r.getStatus()))
                        && r.getCreatedAt().isAfter(thirtyDaysAgo))
                .toList();

        Map<String, int[]> byDate = new TreeMap<>();
        for (TestRun run : runs) {
            String date = run.getCreatedAt().toString().substring(0, 10);
            byDate.computeIfAbsent(date, k -> new int[]{0, 0, 0});
            byDate.get(date)[0] += run.getTotalTests();
            byDate.get(date)[1] += run.getPassedTests();
            byDate.get(date)[2] += 1;
        }

        return byDate.entrySet().stream().map(e -> {
            int[] v = e.getValue();
            Map<String, Object> map = new HashMap<>();
            map.put("date", e.getKey());
            map.put("passRate", v[0] > 0 ? Math.round((double) v[1] / v[0] * 1000.0) / 10.0 : 0.0);
            map.put("totalRuns", v[2]);
            return map;
        }).collect(Collectors.toList());
    }

    @GetMapping("/top-failing-tests")
    public List<Map<String, Object>> topFailingTests(@RequestParam(defaultValue = "5") int limit) {
        int safeLimit = Math.min(limit, 20);
        Map<Long, Long> failureCounts = testResultRepo.findAll().stream()
                .filter(r -> "failed".equals(r.getStatus()))
                .collect(Collectors.groupingBy(r -> r.getTestCaseId(), Collectors.counting()));

        return failureCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(safeLimit)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("testCaseId", e.getKey());
                    map.put("failureCount", e.getValue());
                    testCaseRepo.findById(e.getKey()).ifPresent(tc -> {
                        map.put("testCaseTitle", tc.getTitle());
                        map.put("projectId", tc.getProjectId());
                        projectRepo.findById(tc.getProjectId())
                                .ifPresent(p -> map.put("projectName", p.getName()));
                    });
                    return map;
                }).collect(Collectors.toList());
    }
}
