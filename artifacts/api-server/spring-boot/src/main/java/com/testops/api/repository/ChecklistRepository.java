package com.testops.api.repository;

import com.testops.api.entity.Checklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChecklistRepository extends JpaRepository<Checklist, Long> {
    List<Checklist> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    Optional<Checklist> findByIdAndProjectId(Long id, Long projectId);
    long countByProjectId(Long projectId);

    List<Checklist> findByGroupIdOrderByCreatedAtDesc(Long groupId);
    Optional<Checklist> findByIdAndGroupId(Long id, Long groupId);
}
