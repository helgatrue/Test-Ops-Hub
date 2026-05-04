package com.testops.api.repository;

import com.testops.api.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {

    List<TestCase> findByProjectIdOrderByCreatedAtAsc(Long projectId);

    @Query("SELECT tc FROM TestCase tc WHERE tc.projectId = :projectId " +
           "AND (cast(:status as string) IS NULL OR tc.status = cast(:status as string)) " +
           "AND (cast(:priority as string) IS NULL OR tc.priority = cast(:priority as string)) " +
           "AND (cast(:search as string) IS NULL OR LOWER(tc.title) LIKE LOWER(CONCAT('%', cast(:search as string), '%')))" +
           " ORDER BY tc.createdAt ASC")
    List<TestCase> findFiltered(@Param("projectId") Long projectId,
                                @Param("status") String status,
                                @Param("priority") String priority,
                                @Param("search") String search);

    Optional<TestCase> findByIdAndProjectId(Long id, Long projectId);

    long countByProjectId(Long projectId);
}
