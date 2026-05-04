package com.testops.api.dto;

public class ChecklistItem {
    private String id;
    private String title;
    private boolean checked;
    private int order;

    public ChecklistItem() {}

    public ChecklistItem(String id, String title, boolean checked, int order) {
        this.id = id;
        this.title = title;
        this.checked = checked;
        this.order = order;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isChecked() { return checked; }
    public void setChecked(boolean checked) { this.checked = checked; }
    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
}
