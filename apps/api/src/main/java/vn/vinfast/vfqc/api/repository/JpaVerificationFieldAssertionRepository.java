package vn.vinfast.vfqc.api.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.verification.VerificationFieldAssertion;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public interface JpaVerificationFieldAssertionRepository
    extends JpaRepository<VerificationFieldAssertion, Long> {

  List<VerificationFieldAssertion> findByVerificationItemIdOrderByDisplayOrderAsc(
      Long verificationItemId);

  List<VerificationFieldAssertion> findByVerificationItemIdInOrderByDisplayOrderAsc(
      Collection<Long> verificationItemIds);
}
