package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.schema.request.CreateSchemaColumnRequest;
import vn.vinfast.vfqc.api.model.schema.request.UpdateSchemaColumnRequest;
import vn.vinfast.vfqc.api.model.schema.response.ProjectSchemaResponse;

/**
 * Application service for managing the project-level dataset schema.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Validated
public interface ProjectSchemaService {

  ProjectSchemaResponse getLatestSchema(UUID projectPublicId);

  ProjectSchemaResponse addColumn(UUID projectPublicId, @Valid CreateSchemaColumnRequest request);

  ProjectSchemaResponse updateColumn(
      UUID projectPublicId, UUID columnPublicId, @Valid UpdateSchemaColumnRequest request);

  ProjectSchemaResponse deleteColumn(UUID projectPublicId, UUID columnPublicId);
}
