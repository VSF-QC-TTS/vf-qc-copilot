package vn.vinfast.vfqc.api.model.targetconfig.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.SecretDetection;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.TestExecutionResult;

/**
 * Combined response for the connect endpoint (parse + execute + save in one call).
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public record ConnectResponse(
    @Schema(description = "The saved target configuration")
    TargetConfigResponse config,

    @Schema(description = "Information about detected and sanitized secrets")
    List<SecretDetection> secretsDetected,

    @Schema(description = "Result of the test execution")
    TestExecutionResult testResult
) {}
