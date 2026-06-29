package vn.vinfast.vfqc.api.model.targetconfig.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public record ExecuteCurlRequest(
    @NotBlank(message = "invalid-curl")
    @Schema(description = "The raw cURL command string to execute", example = "curl -X GET https://api.example.com")
    String curl,

    @Schema(description = "Optional override for the body template containing placeholders like {{prompt}}")
    String bodyTemplate
) {}
