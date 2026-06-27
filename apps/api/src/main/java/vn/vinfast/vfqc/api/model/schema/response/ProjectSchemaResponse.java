package vn.vinfast.vfqc.api.model.schema.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record ProjectSchemaResponse(
    @Schema(description = "Public ID of the schema version") UUID publicId,
    @Schema(description = "Schema version number") Integer version,
    @Schema(description = "List of columns in the schema") List<SchemaColumnResponse> columns,
    @Schema(description = "Creation timestamp") OffsetDateTime createdAt) {
  public static ProjectSchemaResponse empty() {
    return new ProjectSchemaResponse(null, 0, List.of(), null);
  }
}
