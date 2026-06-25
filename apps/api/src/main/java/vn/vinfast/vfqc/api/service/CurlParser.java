package vn.vinfast.vfqc.api.service;

import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public interface CurlParser {

  /**
   * Parses a raw cURL command string into structured components (method, URL, headers, body, query params).
   *
   * @param curlString the raw cURL command string
   * @return the parsed cURL command
   * @throws vn.vinfast.vfqc.api.shared.error.ResourceException if the string is invalid or cannot be parsed
   */
  ParsedCurlCommand parse(String curlString);
}
