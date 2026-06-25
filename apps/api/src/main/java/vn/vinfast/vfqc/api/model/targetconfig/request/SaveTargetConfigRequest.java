package vn.vinfast.vfqc.api.model.targetconfig.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public record SaveTargetConfigRequest(
    @Schema(description = "Target API method", example = "POST")
    @NotBlank(message = "validation.not-blank")
    String method,

    @Schema(description = "Target API URL", example = "https://api.example.com/v1/data")
    @NotBlank(message = "validation.not-blank")
    String url,

    @Schema(description = "HTTP Headers")
    Map<String, String> headers,

    @Schema(description = "Query Parameters")
    Map<String, String> queryParams,

    @Schema(description = "Request Body template (can contain {{placeholders}})")
    String bodyTemplate,

    @Schema(description = "JSONPath to the main response data array/object")
    String responsePath,

    @Schema(description = "Timeout in milliseconds", example = "30000")
    @NotNull(message = "validation.not-null")
    @Min(value = 1000, message = "validation.min")
    Integer timeoutMs,

    @Schema(description = "Optional custom name for this target config")
    String name
) {}
