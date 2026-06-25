package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public interface JudgeConfigRepository extends JpaRepository<JudgeConfig, Long> {

  Optional<JudgeConfig> findByProjectId(Long projectId);

  boolean existsByProjectId(Long projectId);
}
