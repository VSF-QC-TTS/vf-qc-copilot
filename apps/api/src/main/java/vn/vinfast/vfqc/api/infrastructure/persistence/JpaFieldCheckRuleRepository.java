package vn.vinfast.vfqc.api.infrastructure.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.domain.verification.FieldCheckRule;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaFieldCheckRuleRepository extends JpaRepository<FieldCheckRule, Long> {

  List<FieldCheckRule> findByVerificationConfigIdOrderByDisplayOrderAsc(Long verificationConfigId);

  void deleteByVerificationConfigId(Long verificationConfigId);
}
