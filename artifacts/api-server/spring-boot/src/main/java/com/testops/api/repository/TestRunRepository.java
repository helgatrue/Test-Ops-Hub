package com.testops.api.repository;

import com.testops.api.entity.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, Long> {

    List<TestRun> findByProjectIdOrderByCreatedAtAsc(Long projectId);

    @Query("SELECT r FROM TestRun r WHERE r.projectId = :projectId " +
           "AND (:status IS NULL OR r.status = :status) ORDER BY r.createdAt ASC")
    List<TestRun> findFiltered(@Param("projectId") Long projectId,
                               @Param("status") String status);

    Optional<TestRun> findByIdAndProjectId(Long id, Long projectId);

    long countByProjectId(Long projectId);

    @Query("SELECT r FROM TestRun r ORDER BY r.createdAt DESC")
    List<TestRun> findAllOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
}
