package vn.vinfast.vfqc.api.infrastructure.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.domain.ai.AiConfig;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaAiConfigRepository extends JpaRepository<AiConfig, Long> {

  Optional<AiConfig> findByProjectId(Long projectId);

  boolean existsByProjectId(Long projectId);
}
