package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.datasetschema.request.CreateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.request.UpdateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.response.DatasetSchemaResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Validated
public interface DatasetSchemaService {

  /**
   * Retrieves the latest dataset schema version for a project.
   */
  DatasetSchemaResponse getLatestSchema(UUID projectPublicId);

  /**
   * Adds a new column to the dataset schema.
   * This creates a new schema version containing the new column and all existing columns.
   */
  DatasetSchemaResponse addColumn(UUID projectPublicId, @Valid CreateColumnRequest request);

  /**
   * Updates an existing column in the dataset schema.
   * This creates a new schema version with the updated column.
   */
  DatasetSchemaResponse updateColumn(UUID projectPublicId, UUID columnPublicId, @Valid UpdateColumnRequest request);

  /**
   * Deletes a column from the dataset schema.
   * This creates a new schema version without the deleted column.
   */
  DatasetSchemaResponse deleteColumn(UUID projectPublicId, UUID columnPublicId);
}
