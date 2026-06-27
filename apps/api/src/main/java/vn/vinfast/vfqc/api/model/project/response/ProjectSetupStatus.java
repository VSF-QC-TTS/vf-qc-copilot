package vn.vinfast.vfqc.api.model.project.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Schema(name = "ProjectSetupStatus", description = "Project configuration status overview")
public record ProjectSetupStatus(
    @Schema(description = "Indicates whether the Target Config (cURL) has been set up.")
    boolean hasTargetConfig,

    @Schema(description = "Indicates whether the AI Provider has been configured.")
    boolean hasAiConfig,

    @Schema(description = "Indicates whether the Project Schema has been configured.")
    boolean hasProjectSchema,

    @Schema(description = "Indicates whether the Verification rules have been configured.")
    boolean hasVerification,

    @Schema(description = "Indicates whether the project has any datasets.")
    boolean hasDatasets,

    @Schema(description = "Total number of test runs executed for this project.")
    int totalTestRuns) {}

