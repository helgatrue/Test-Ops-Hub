package com.testops.api.dto;

public class Step {
    private int order;
    private String action;
    private String expected;

    public Step() {}

    public Step(int order, String action, String expected) {
        this.order = order;
        this.action = action;
        this.expected = expected;
    }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getExpected() { return expected; }
    public void setExpected(String expected) { this.expected = expected; }
}
