package vn.vinfast.vfqc.api.model.targetconfig.request;

import java.util.Map;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public record ParsedCurlCommand(
    String method,
    String url,
    Map<String, String> headers,
    Map<String, String> queryParams,
    String body
) {}
