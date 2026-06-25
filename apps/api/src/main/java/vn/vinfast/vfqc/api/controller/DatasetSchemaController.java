package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.model.datasetschema.request.CreateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.request.UpdateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.response.DatasetSchemaResponse;
import vn.vinfast.vfqc.api.service.DatasetSchemaService;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@RestController
@RequestMapping(value = "/api/v1/projects/{publicId}/dataset-schema", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Dataset Schema", description = "Project Dataset Schema Versioning")
public class DatasetSchemaController {

  private final DatasetSchemaService datasetSchemaService;

  @Operation(summary = "Get Latest Schema", description = "Retrieves the latest dataset schema version for a project.")
  @GetMapping
  public DatasetSchemaResponse getLatestSchema(@PathVariable UUID publicId) {
    return datasetSchemaService.getLatestSchema(publicId);
  }

  @Operation(summary = "Add Column", description = "Adds a new column and creates a new schema version.")
  @PostMapping("/columns")
  public DatasetSchemaResponse addColumn(
      @PathVariable UUID publicId,
      @Valid @RequestBody CreateColumnRequest request) {
    return datasetSchemaService.addColumn(publicId, request);
  }

  @Operation(summary = "Update Column", description = "Updates an existing column and creates a new schema version.")
  @PatchMapping("/columns/{columnPublicId}")
  public DatasetSchemaResponse updateColumn(
      @PathVariable UUID publicId,
      @PathVariable UUID columnPublicId,
      @Valid @RequestBody UpdateColumnRequest request) {
    return datasetSchemaService.updateColumn(publicId, columnPublicId, request);
  }

  @Operation(summary = "Delete Column", description = "Deletes a column and creates a new schema version.")
  @DeleteMapping("/columns/{columnPublicId}")
  public DatasetSchemaResponse deleteColumn(
      @PathVariable UUID publicId,
      @PathVariable UUID columnPublicId) {
    return datasetSchemaService.deleteColumn(publicId, columnPublicId);
  }
}
