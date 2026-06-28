package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.testrun.RunEvent;

public interface JpaRunEventRepository extends JpaRepository<RunEvent, Long> {

  List<RunEvent> findByRunIdOrderByCreatedAtAsc(Long runId);
}
