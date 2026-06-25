package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetColumn;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public interface DatasetColumnRepository extends JpaRepository<DatasetColumn, Long> {

  List<DatasetColumn> findBySchemaVersionIdOrderByDisplayOrderAsc(Long schemaVersionId);

  Optional<DatasetColumn> findBySchemaVersionIdAndPublicId(Long schemaVersionId, UUID publicId);

  boolean existsBySchemaVersionIdAndColumnName(Long schemaVersionId, String columnName);
}
