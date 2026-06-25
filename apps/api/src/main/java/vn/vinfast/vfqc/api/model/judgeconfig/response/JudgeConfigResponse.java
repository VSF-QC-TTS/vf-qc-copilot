package vn.vinfast.vfqc.api.model.judgeconfig.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record JudgeConfigResponse(
    @Schema(description = "Public ID of the judge config")
    UUID publicId,

    @Schema(description = "Current version number")
    Integer version,

    @Schema(description = "The LLM Provider")
    LlmProvider provider,

    @Schema(description = "Base URL (if configured)")
    String baseUrl,

    @Schema(description = "Indicates if an API key is currently saved")
    boolean hasApiKey,

    @Schema(description = "Model ID")
    String model,

    @Schema(description = "Custom model name")
    String customModelName,

    @Schema(description = "Temperature setting")
    BigDecimal temperature,

    @Schema(description = "Maximum tokens")
    Integer maxTokens,

    @Schema(description = "Timeout in ms")
    Integer timeoutMs,

    @Schema(description = "Retry count")
    Integer retryCount,

    @Schema(description = "Last test execution status (e.g. SUCCESS, FAILED)")
    String lastTestStatus,

    @Schema(description = "Timestamp of the last test execution")
    OffsetDateTime lastTestedAt,

    @Schema(description = "Creation timestamp")
    OffsetDateTime createdAt,

    @Schema(description = "Last update timestamp")
    OffsetDateTime updatedAt
) {}
