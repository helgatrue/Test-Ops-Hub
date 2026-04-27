package com.testops.api.dto;

import java.util.List;

public class CreateTestRunRequest {
    private String name;
    private String branch;
    private String commitHash;
    private String commitMessage;
    private String triggeredBy;
    private String ciProvider;
    private List<Long> testCaseIds;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
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
    public List<Long> getTestCaseIds() { return testCaseIds; }
    public void setTestCaseIds(List<Long> testCaseIds) { this.testCaseIds = testCaseIds; }
}
