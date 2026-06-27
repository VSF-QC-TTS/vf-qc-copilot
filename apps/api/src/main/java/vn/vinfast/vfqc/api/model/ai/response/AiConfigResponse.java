package vn.vinfast.vfqc.api.model.ai.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.ai.AiProvider;
import vn.vinfast.vfqc.api.model.ai.KeySource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record AiConfigResponse(
    @Schema(description = "Public ID of the AI config") UUID publicId,
    @Schema(description = "Current version number") Integer version,
    @Schema(description = "The AI Provider") AiProvider provider,
    @Schema(description = "Base URL (if configured)") String baseUrl,
    @Schema(description = "Key source: PLATFORM or PERSONAL") KeySource keySource,
    @Schema(description = "Indicates if an API key is currently saved") boolean hasApiKey,
    @Schema(description = "Model for evaluation/judging") String evaluationModel,
    @Schema(description = "Model for AI generation") String generationModel,
    @Schema(description = "Temperature setting") BigDecimal temperature,
    @Schema(description = "Maximum tokens") Integer maxTokens,
    @Schema(description = "Timeout in ms") Integer timeoutMs,
    @Schema(description = "Retry count") Integer retryCount,
    @Schema(description = "Last test execution status (e.g. SUCCESS, FAILED)")
        String lastTestStatus,
    @Schema(description = "Timestamp of the last test execution") OffsetDateTime lastTestedAt,
    @Schema(description = "Creation timestamp") OffsetDateTime createdAt,
    @Schema(description = "Last update timestamp") OffsetDateTime updatedAt) {}
