package com.testops.api.dto;

import java.util.List;

public class UpdateChecklistRequest {
    private String title;
    private String description;
    private String status;
    private List<ChecklistItem> items;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<ChecklistItem> getItems() { return items; }
    public void setItems(List<ChecklistItem> items) { this.items = items; }
}
