package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.AssertionResult;

public interface JpaAssertionResultRepository extends JpaRepository<AssertionResult, Long> {

  List<AssertionResult> findByTestResultIdOrderByIdAsc(Long testResultId);

  List<AssertionResult> findByTestResultIdInOrderByTestResultIdAscIdAsc(List<Long> testResultIds);

  void deleteByTestResultId(Long testResultId);
}
