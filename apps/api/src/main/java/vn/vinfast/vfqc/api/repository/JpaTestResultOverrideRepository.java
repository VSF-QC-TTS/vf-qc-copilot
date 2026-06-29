package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.TestResultOverride;

public interface JpaTestResultOverrideRepository extends JpaRepository<TestResultOverride, Long> {

  Optional<TestResultOverride> findByTestResultId(Long testResultId);

  List<TestResultOverride> findByTestResultIdIn(List<Long> testResultIds);

  Optional<TestResultOverride> findByPublicId(UUID publicId);
}
