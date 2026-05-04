package com.testops.api.repository;

import com.testops.api.entity.ChecklistGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChecklistGroupRepository extends JpaRepository<ChecklistGroup, Long> {
}
