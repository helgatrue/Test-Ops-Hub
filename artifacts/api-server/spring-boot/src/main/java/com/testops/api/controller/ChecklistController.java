package com.testops.api.controller;

import com.testops.api.dto.CreateChecklistRequest;
import com.testops.api.dto.UpdateChecklistRequest;
import com.testops.api.entity.Checklist;
import com.testops.api.repository.ChecklistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ChecklistController {

    private final ChecklistRepository checklistRepo;

    public ChecklistController(ChecklistRepository checklistRepo) {
        this.checklistRepo = checklistRepo;
    }

    @GetMapping("/projects/{projectId}/checklists")
    public List<Checklist> listChecklists(@PathVariable Long projectId) {
        return checklistRepo.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    @PostMapping("/projects/{projectId}/checklists")
    public ResponseEntity<Checklist> createChecklist(@PathVariable Long projectId,
                                                      @RequestBody CreateChecklistRequest req) {
        Checklist cl = new Checklist();
        cl.setProjectId(projectId);
        cl.setTitle(req.getTitle());
        cl.setDescription(req.getDescription());
        cl.setItems(req.getItems() != null ? req.getItems() : new ArrayList<>());
        return ResponseEntity.status(HttpStatus.CREATED).body(checklistRepo.save(cl));
    }

    @GetMapping("/projects/{projectId}/checklists/{checklistId}")
    public ResponseEntity<Checklist> getChecklist(@PathVariable Long projectId,
                                                   @PathVariable Long checklistId) {
        return checklistRepo.findByIdAndProjectId(checklistId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/projects/{projectId}/checklists/{checklistId}")
    public ResponseEntity<Checklist> updateChecklist(@PathVariable Long projectId,
                                                      @PathVariable Long checklistId,
                                                      @RequestBody UpdateChecklistRequest req) {
        return checklistRepo.findByIdAndProjectId(checklistId, projectId).map(cl -> {
            if (req.getTitle() != null) cl.setTitle(req.getTitle());
            if (req.getDescription() != null) cl.setDescription(req.getDescription());
            if (req.getStatus() != null) cl.setStatus(req.getStatus());
            if (req.getItems() != null) cl.setItems(req.getItems());
            cl.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(checklistRepo.save(cl));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/projects/{projectId}/checklists/{checklistId}")
    public ResponseEntity<Void> deleteChecklist(@PathVariable Long projectId,
                                                 @PathVariable Long checklistId) {
        checklistRepo.findByIdAndProjectId(checklistId, projectId)
                .ifPresent(checklistRepo::delete);
        return ResponseEntity.noContent().build();
    }
}
