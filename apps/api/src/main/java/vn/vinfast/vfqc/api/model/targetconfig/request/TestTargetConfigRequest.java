package vn.vinfast.vfqc.api.model.targetconfig.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Map;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public record TestTargetConfigRequest(
    @Schema(description = "Key-value pairs to substitute placeholders in the bodyTemplate or URL")
    Map<String, String> sampleInput
) {}
