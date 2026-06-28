package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.TestResult;

public interface JpaTestResultRepository extends JpaRepository<TestResult, Long> {

  Page<TestResult> findByRunIdOrderByCaseIndexAsc(Long runId, Pageable pageable);

  List<TestResult> findByRunIdOrderByCaseIndexAsc(Long runId);

  Optional<TestResult> findByRunIdAndDatasetRowId(Long runId, Long datasetRowId);
}
