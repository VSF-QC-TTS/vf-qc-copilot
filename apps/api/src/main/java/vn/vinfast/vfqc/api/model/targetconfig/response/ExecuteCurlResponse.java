package vn.vinfast.vfqc.api.model.targetconfig.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.util.Map;
import vn.vinfast.vfqc.api.model.targetconfig.request.SaveTargetConfigRequest;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public record ExecuteCurlResponse(
    @Schema(description = "The parsed cURL command mapped to a config request format")
    SaveTargetConfigRequest parsedConfig,

    @Schema(description = "Information about detected and sanitized secrets")
    List<SecretDetection> secretsDetected,

    @Schema(description = "Result of the execution")
    TestExecutionResult testResult
) {
  public record SecretDetection(
      String location,
      String keyName,
      String action
  ) {}

  public record TestExecutionResult(
      int httpStatus,
      long latencyMs,
      String responseBody,
      String errorMessage,
      Map<String, Object> responseFieldTree
  ) {}
}
