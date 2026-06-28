package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.TestRun;

public interface JpaTestRunRepository extends JpaRepository<TestRun, Long> {

  Optional<TestRun> findByPublicId(UUID publicId);

  Page<TestRun> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);

  long countByProjectId(Long projectId);
}
