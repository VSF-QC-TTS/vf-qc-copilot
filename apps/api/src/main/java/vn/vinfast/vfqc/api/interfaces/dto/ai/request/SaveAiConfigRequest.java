package vn.vinfast.vfqc.api.interfaces.dto.ai.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import vn.vinfast.vfqc.api.domain.ai.AiProvider;
import vn.vinfast.vfqc.api.domain.ai.KeySource;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public record SaveAiConfigRequest(
    @Schema(description = "The AI Provider")
    @NotNull(message = "validation.not-null")
    AiProvider provider,

    @Schema(description = "Optional base URL to override provider's default (e.g. for Azure)")
    String baseUrl,

    @Schema(description = "The secret API Key for this provider", example = "sk-xxxx")
    String apiKey,

    @Schema(description = "Key source: PLATFORM or PERSONAL", example = "PLATFORM")
    @NotNull(message = "validation.not-null")
    KeySource keySource,

    @Schema(description = "Model for evaluation/judging", example = "gpt-4o")
    @NotBlank(message = "validation.not-blank")
    String evaluationModel,

    @Schema(description = "Model for AI generation (optional, falls back to evaluationModel)", example = "gpt-4o-mini")
    String generationModel,

    @Schema(description = "Temperature setting (0.0 to 2.0)", example = "0.0")
    @Min(value = 0, message = "validation.min")
    @Max(value = 2, message = "validation.max")
    BigDecimal temperature,

    @Schema(description = "Maximum tokens for the response")
    @Min(value = 1, message = "validation.min")
    Integer maxTokens,

    @Schema(description = "Timeout in milliseconds")
    @NotNull(message = "validation.not-null")
    @Min(value = 1000, message = "validation.min")
    Integer timeoutMs,

    @Schema(description = "Number of retries on failure")
    @NotNull(message = "validation.not-null")
    @Min(value = 0, message = "validation.min")
    Integer retryCount
) {}
