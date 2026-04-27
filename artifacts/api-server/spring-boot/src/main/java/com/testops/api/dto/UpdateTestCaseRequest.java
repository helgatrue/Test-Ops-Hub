package com.testops.api.dto;

import java.util.List;

public class UpdateTestCaseRequest {
    private String title;
    private String description;
    private String priority;
    private String status;
    private List<String> labels;
    private List<Step> steps;
    private String automationStatus;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }
    public List<Step> getSteps() { return steps; }
    public void setSteps(List<Step> steps) { this.steps = steps; }
    public String getAutomationStatus() { return automationStatus; }
    public void setAutomationStatus(String automationStatus) { this.automationStatus = automationStatus; }
}
