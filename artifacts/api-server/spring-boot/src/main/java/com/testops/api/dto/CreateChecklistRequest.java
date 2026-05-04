package com.testops.api.dto;

import java.util.List;

public class CreateChecklistRequest {
    private String title;
    private String description;
    private List<ChecklistItem> items;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<ChecklistItem> getItems() { return items; }
    public void setItems(List<ChecklistItem> items) { this.items = items; }
}
