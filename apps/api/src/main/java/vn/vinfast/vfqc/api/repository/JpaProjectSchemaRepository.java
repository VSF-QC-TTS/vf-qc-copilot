package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaProjectSchemaRepository extends JpaRepository<ProjectSchema, Long> {

  Optional<ProjectSchema> findByProjectId(Long projectId);

  boolean existsByProjectId(Long projectId);
}
