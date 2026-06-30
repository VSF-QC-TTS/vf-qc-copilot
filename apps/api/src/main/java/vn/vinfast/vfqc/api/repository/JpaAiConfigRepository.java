package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.ai.AiConfigType;
import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaAiConfigRepository extends JpaRepository<AiConfig, Long> {

  Optional<AiConfig> findByProjectIdAndType(Long projectId, AiConfigType type);

  Optional<AiConfig> findByProjectIdAndTypeAndName(Long projectId, AiConfigType type, String name);

  Optional<AiConfig> findByPublicIdAndProjectId(UUID publicId, Long projectId);

  List<AiConfig> findAllByProjectIdAndType(Long projectId, AiConfigType type);

  boolean existsByProjectIdAndType(Long projectId, AiConfigType type);
}
