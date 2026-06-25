package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.verificationconfig.LlmRubric;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public interface LlmRubricRepository extends JpaRepository<LlmRubric, Long> {

  List<LlmRubric> findByVerificationConfigIdOrderByDisplayOrderAsc(Long verificationConfigId);

  void deleteByVerificationConfigId(Long verificationConfigId);
}
