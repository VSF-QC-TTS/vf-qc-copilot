package vn.vinfast.vfqc.api.model.project.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Schema(name = "ProjectResponse", description = "Public project payload")
public record ProjectResponse(
    @Schema(description = "Public project identifier.", example = "7b7b7d42-5f42-4c5a-9281-8d1d36f6f59d")
    UUID publicId,

    @Schema(description = "Project name.", example = "VinFast ViVi QC")
    String name,

    @Schema(description = "Project description.", example = "QC testing for ViVi voice assistant", nullable = true)
    String description,

    @Schema(description = "Project creation timestamp.", example = "2026-06-25T10:00:00Z")
    OffsetDateTime createdAt,

    @Schema(description = "Last update timestamp.", example = "2026-06-25T10:30:00Z")
    OffsetDateTime updatedAt) {}
