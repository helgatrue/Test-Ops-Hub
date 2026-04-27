package com.testops.api.repository;

import com.testops.api.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    List<TestResult> findByTestRunId(Long testRunId);

    @Query("SELECT r FROM TestResult r WHERE r.testRunId = :runId " +
           "AND (:status IS NULL OR r.status = :status)")
    List<TestResult> findFiltered(@Param("runId") Long runId, @Param("status") String status);

    long countByTestRunId(Long testRunId);
}
