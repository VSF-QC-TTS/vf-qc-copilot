package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.verification.VerificationItem;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
public interface JpaVerificationItemRepository extends JpaRepository<VerificationItem, Long> {

  List<VerificationItem> findByVerificationConfigIdOrderByDisplayOrderAsc(Long verificationConfigId);

  void deleteByVerificationConfigId(Long verificationConfigId);
}
