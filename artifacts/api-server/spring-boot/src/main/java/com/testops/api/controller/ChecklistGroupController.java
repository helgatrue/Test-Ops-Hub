package com.testops.api.controller;

import com.testops.api.dto.CreateChecklistGroupRequest;
import com.testops.api.dto.UpdateChecklistGroupRequest;
import com.testops.api.dto.CreateChecklistRequest;
import com.testops.api.dto.UpdateChecklistRequest;
import com.testops.api.entity.Checklist;
import com.testops.api.entity.ChecklistGroup;
import com.testops.api.repository.ChecklistGroupRepository;
import com.testops.api.repository.ChecklistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/checklist-groups")
public class ChecklistGroupController {

    private final ChecklistGroupRepository groupRepo;
    private final ChecklistRepository checklistRepo;

    public ChecklistGroupController(ChecklistGroupRepository groupRepo, ChecklistRepository checklistRepo) {
        this.groupRepo = groupRepo;
        this.checklistRepo = checklistRepo;
    }

    // ── Groups ────────────────────────────────────────────────────────────────

    @GetMapping
    public List<ChecklistGroup> listGroups() {
        return groupRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<ChecklistGroup> createGroup(@RequestBody CreateChecklistGroupRequest req) {
        ChecklistGroup g = new ChecklistGroup();
        g.setName(req.getName());
        g.setDescription(req.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(groupRepo.save(g));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ChecklistGroup> getGroup(@PathVariable Long groupId) {
        return groupRepo.findById(groupId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<ChecklistGroup> updateGroup(@PathVariable Long groupId,
                                                       @RequestBody UpdateChecklistGroupRequest req) {
        return groupRepo.findById(groupId).map(g -> {
            if (req.getName() != null) g.setName(req.getName());
            if (req.getDescription() != null) g.setDescription(req.getDescription());
            g.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(groupRepo.save(g));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId) {
        groupRepo.findById(groupId).ifPresent(g -> {
            checklistRepo.findByGroupIdOrderByCreatedAtDesc(groupId).forEach(checklistRepo::delete);
            groupRepo.delete(g);
        });
        return ResponseEntity.noContent().build();
    }

    // ── Checklists within a group ─────────────────────────────────────────────

    @GetMapping("/{groupId}/checklists")
    public ResponseEntity<List<Checklist>> listChecklists(@PathVariable Long groupId) {
        if (!groupRepo.existsById(groupId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(checklistRepo.findByGroupIdOrderByCreatedAtDesc(groupId));
    }

    @PostMapping("/{groupId}/checklists")
    public ResponseEntity<Checklist> createChecklist(@PathVariable Long groupId,
                                                      @RequestBody CreateChecklistRequest req) {
        if (!groupRepo.existsById(groupId)) return ResponseEntity.notFound().build();
        Checklist cl = new Checklist();
        cl.setGroupId(groupId);
        cl.setTitle(req.getTitle());
        cl.setDescription(req.getDescription());
        cl.setItems(req.getItems() != null ? req.getItems() : new ArrayList<>());
        return ResponseEntity.status(HttpStatus.CREATED).body(checklistRepo.save(cl));
    }

    @GetMapping("/{groupId}/checklists/{checklistId}")
    public ResponseEntity<Checklist> getChecklist(@PathVariable Long groupId,
                                                   @PathVariable Long checklistId) {
        return checklistRepo.findByIdAndGroupId(checklistId, groupId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{groupId}/checklists/{checklistId}")
    public ResponseEntity<Checklist> updateChecklist(@PathVariable Long groupId,
                                                      @PathVariable Long checklistId,
                                                      @RequestBody UpdateChecklistRequest req) {
        return checklistRepo.findByIdAndGroupId(checklistId, groupId).map(cl -> {
            if (req.getTitle() != null) cl.setTitle(req.getTitle());
            if (req.getDescription() != null) cl.setDescription(req.getDescription());
            if (req.getStatus() != null) cl.setStatus(req.getStatus());
            if (req.getItems() != null) cl.setItems(req.getItems());
            cl.setUpdatedAt(Instant.now());
            return ResponseEntity.ok(checklistRepo.save(cl));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{groupId}/checklists/{checklistId}")
    public ResponseEntity<Void> deleteChecklist(@PathVariable Long groupId,
                                                 @PathVariable Long checklistId) {
        checklistRepo.findByIdAndGroupId(checklistId, groupId).ifPresent(checklistRepo::delete);
        return ResponseEntity.noContent().build();
    }
}
