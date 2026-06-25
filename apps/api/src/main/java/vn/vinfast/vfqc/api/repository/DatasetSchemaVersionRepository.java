package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetSchemaVersion;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public interface DatasetSchemaVersionRepository extends JpaRepository<DatasetSchemaVersion, Long> {

  Optional<DatasetSchemaVersion> findTopByProjectIdOrderByVersionDesc(Long projectId);

  boolean existsByProjectId(Long projectId);
}
