package com.testops.api.dto;

import java.time.Instant;

public class UpdateTestRunRequest {
    private String name;
    private String status;
    private String branch;
    private String commitHash;
    private String commitMessage;
    private String triggeredBy;
    private String ciProvider;
    private Integer totalTests;
    private Integer passedTests;
    private Integer failedTests;
    private Integer skippedTests;
    private Integer blockedTests;
    private Integer duration;
    private Instant startedAt;
    private Instant finishedAt;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getCommitHash() { return commitHash; }
    public void setCommitHash(String commitHash) { this.commitHash = commitHash; }
    public String getCommitMessage() { return commitMessage; }
    public void setCommitMessage(String commitMessage) { this.commitMessage = commitMessage; }
    public String getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(String triggeredBy) { this.triggeredBy = triggeredBy; }
    public String getCiProvider() { return ciProvider; }
    public void setCiProvider(String ciProvider) { this.ciProvider = ciProvider; }
    public Integer getTotalTests() { return totalTests; }
    public void setTotalTests(Integer totalTests) { this.totalTests = totalTests; }
    public Integer getPassedTests() { return passedTests; }
    public void setPassedTests(Integer passedTests) { this.passedTests = passedTests; }
    public Integer getFailedTests() { return failedTests; }
    public void setFailedTests(Integer failedTests) { this.failedTests = failedTests; }
    public Integer getSkippedTests() { return skippedTests; }
    public void setSkippedTests(Integer skippedTests) { this.skippedTests = skippedTests; }
    public Integer getBlockedTests() { return blockedTests; }
    public void setBlockedTests(Integer blockedTests) { this.blockedTests = blockedTests; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }
}
