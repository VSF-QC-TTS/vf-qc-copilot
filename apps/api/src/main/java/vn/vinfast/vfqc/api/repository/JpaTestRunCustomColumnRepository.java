package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.TestRunCustomColumn;

public interface JpaTestRunCustomColumnRepository extends JpaRepository<TestRunCustomColumn, Long> {

  List<TestRunCustomColumn> findByRunId(Long runId);

  Optional<TestRunCustomColumn> findByPublicId(UUID publicId);
}
