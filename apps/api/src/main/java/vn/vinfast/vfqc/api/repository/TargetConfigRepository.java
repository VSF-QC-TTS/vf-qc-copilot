package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public interface TargetConfigRepository extends JpaRepository<TargetConfig, Long> {

  Optional<TargetConfig> findByProjectId(Long projectId);

  boolean existsByProjectId(Long projectId);
}
