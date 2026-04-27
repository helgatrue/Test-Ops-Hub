package com.testops.api.entity;

import com.testops.api.converter.StepListConverter;
import com.testops.api.converter.StringListConverter;
import com.testops.api.dto.Step;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_cases")
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private String priority = "medium";

    @Column(nullable = false)
    private String status = "draft";

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "jsonb")
    private List<String> labels = new ArrayList<>();

    @Convert(converter = StepListConverter.class)
    @Column(columnDefinition = "jsonb")
    private List<Step> steps = new ArrayList<>();

    @Column(name = "automation_status", nullable = false)
    private String automationStatus = "manual";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
