package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaVerificationConfigRepository extends JpaRepository<VerificationConfig, Long> {

  Optional<VerificationConfig> findByProjectId(Long projectId);

  boolean existsByProjectId(Long projectId);
}
