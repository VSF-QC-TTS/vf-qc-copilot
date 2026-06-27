package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.verification.LlmRubricRule;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaLlmRubricRuleRepository extends JpaRepository<LlmRubricRule, Long> {

  List<LlmRubricRule> findByVerificationConfigIdOrderByDisplayOrderAsc(Long verificationConfigId);

  void deleteByVerificationConfigId(Long verificationConfigId);
}
