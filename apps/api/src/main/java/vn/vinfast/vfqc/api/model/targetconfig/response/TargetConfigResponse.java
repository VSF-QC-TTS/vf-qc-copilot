package vn.vinfast.vfqc.api.model.targetconfig.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public record TargetConfigResponse(
    @Schema(description = "Public ID of the target config")
    UUID publicId,

    @Schema(description = "Current version number")
    Integer version,

    @Schema(description = "Optional name")
    String name,

    @Schema(description = "HTTP Method")
    String method,

    @Schema(description = "Target URL")
    String url,

    @Schema(description = "HTTP Headers with secrets masked")
    Map<String, String> maskedHeaders,

    @Schema(description = "Query Parameters with secrets masked")
    Map<String, String> maskedQueryParams,

    @Schema(description = "Request body template")
    String bodyTemplate,

    @Schema(description = "Response path extracted from successful test")
    String responsePath,

    @Schema(description = "Timeout in ms")
    Integer timeoutMs,

    @Schema(description = "JSON schema snapshot of the request fields")
    String requestFieldSnapshot,

    @Schema(description = "JSON schema snapshot of the response fields")
    String responseFieldSnapshot,

    @Schema(description = "Original cURL command pasted by user")
    String rawCurl,

    @Schema(description = "Last test execution status (e.g. SUCCESS, FAILED)")
    String lastTestStatus,

    @Schema(description = "Timestamp of the last test execution")
    OffsetDateTime lastTestedAt,

    @Schema(description = "Creation timestamp")
    OffsetDateTime createdAt,

    @Schema(description = "Last update timestamp")
    OffsetDateTime updatedAt
) {}
