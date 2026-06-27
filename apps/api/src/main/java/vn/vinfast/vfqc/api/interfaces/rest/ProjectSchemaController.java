package vn.vinfast.vfqc.api.interfaces.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.application.schema.ProjectSchemaService;
import vn.vinfast.vfqc.api.interfaces.dto.schema.request.CreateSchemaColumnRequest;
import vn.vinfast.vfqc.api.interfaces.dto.schema.request.UpdateSchemaColumnRequest;
import vn.vinfast.vfqc.api.interfaces.dto.schema.response.ProjectSchemaResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@RestController
@RequestMapping(value = "/api/v1/projects/{publicId}/config/schema", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Project Schema", description = "Project Dataset Schema Management")
public class ProjectSchemaController {

  private final ProjectSchemaService projectSchemaService;

  @Operation(summary = "Get Schema", description = "Gets the current project schema with all columns.")
  @GetMapping
  public ProjectSchemaResponse get(@PathVariable UUID publicId) {
    return projectSchemaService.getLatestSchema(publicId);
  }

  @Operation(summary = "Add Column", description = "Adds a new column to the schema.")
  @PostMapping("/columns")
  public ProjectSchemaResponse addColumn(
      @PathVariable UUID publicId,
      @Valid @RequestBody CreateSchemaColumnRequest request) {
    return projectSchemaService.addColumn(publicId, request);
  }

  @Operation(summary = "Update Column", description = "Updates an existing column.")
  @PutMapping("/columns/{columnPublicId}")
  public ProjectSchemaResponse updateColumn(
      @PathVariable UUID publicId,
      @PathVariable UUID columnPublicId,
      @Valid @RequestBody UpdateSchemaColumnRequest request) {
    return projectSchemaService.updateColumn(publicId, columnPublicId, request);
  }

  @Operation(summary = "Delete Column", description = "Deletes a column from the schema.")
  @DeleteMapping("/columns/{columnPublicId}")
  public ProjectSchemaResponse deleteColumn(
      @PathVariable UUID publicId,
      @PathVariable UUID columnPublicId) {
    return projectSchemaService.deleteColumn(publicId, columnPublicId);
  }
}
