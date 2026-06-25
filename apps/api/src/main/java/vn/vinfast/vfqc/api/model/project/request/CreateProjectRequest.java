package vn.vinfast.vfqc.api.model.project.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Schema(name = "CreateProjectRequest", description = "Create a new QC project")
public record CreateProjectRequest(
    @Schema(description = "Project name.", example = "VinFast ViVi QC")
    @NotBlank(message = "validation.project.name.required")
    @Size(max = 255, message = "validation.project.name.max")
    String name,

    @Schema(
            description = "Project description.",
            example = "QC testing for ViVi voice assistant",
            nullable = true)
    @Size(max = 2000, message = "validation.project.description.max")
    String description) {}
