package vn.vinfast.vfqc.api.model.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Schema(name = "UpdateProjectRequest", description = "Update project name and/or description")
public record UpdateProjectRequest(
    @Schema(description = "New project name.", example = "ViVi QC v2", nullable = true)
    @Size(max = 255, message = "validation.project.name.max")
    String name,

    @Schema(description = "New project description.", nullable = true)
    @Size(max = 2000, message = "validation.project.description.max")
    String description) {}
