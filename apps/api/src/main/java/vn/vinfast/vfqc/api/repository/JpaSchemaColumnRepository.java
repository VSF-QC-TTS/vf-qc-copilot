package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaSchemaColumnRepository extends JpaRepository<SchemaColumn, Long> {

  List<SchemaColumn> findBySchemaVersionIdOrderByIdAsc(Long schemaVersionId);

  void deleteBySchemaVersionId(Long schemaVersionId);
}
