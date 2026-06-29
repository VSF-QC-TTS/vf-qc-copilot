package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.TestRunJob;

public interface JpaTestRunJobRepository extends JpaRepository<TestRunJob, Long> {

  Optional<TestRunJob> findByPublicId(UUID publicId);
}
