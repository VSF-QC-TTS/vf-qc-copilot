package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.TestResultCustomValue;

public interface JpaTestResultCustomValueRepository extends JpaRepository<TestResultCustomValue, Long> {

  List<TestResultCustomValue> findByTestResultId(Long testResultId);

  List<TestResultCustomValue> findByTestResultIdIn(List<Long> testResultIds);

  Optional<TestResultCustomValue> findByTestResultIdAndCustomColumnId(Long testResultId, Long customColumnId);
}
