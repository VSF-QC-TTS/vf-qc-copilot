package vn.vinfast.vfqc.api.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

import vn.vinfast.vfqc.api.service.CurlParser;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Component
public class CurlParserImpl implements CurlParser {

  private static final Pattern HEADER_PATTERN = Pattern.compile("-H\\s+['\"]([^:]+):\\s*(.*?)['\"]");
  private static final Pattern DATA_PATTERN = Pattern.compile("--data(?:-raw|-binary)?\\s+(?:'(.*?)'|\"(.*?)\")", Pattern.DOTALL);
  private static final Pattern URL_PATTERN = Pattern.compile("['\"]?(https?://[^\\s'\"]+)['\"]?");
  private static final Pattern METHOD_PATTERN = Pattern.compile("-X\\s+([A-Z]+)");

  public ParsedCurlCommand parse(String curlString) {
    if (curlString == null || curlString.isBlank() || !curlString.trim().startsWith("curl")) {
      throw ResourceException.of(ErrorCode.INVALID_CURL, "String must start with 'curl'");
    }

    String method = extractMethod(curlString);
    String url = extractUrl(curlString);
    Map<String, String> headers = extractHeaders(curlString);
    String body = extractBody(curlString);
    
    // Automatically infer POST if there is a body but no -X
    if (method.equals("GET") && body != null && !body.isBlank()) {
      method = "POST";
    }
    
    // Extract query params from URL
    Map<String, String> queryParams = new HashMap<>();
    if (url.contains("?")) {
      String[] parts = url.split("\\?", 2);
      url = parts[0];
      String[] params = parts[1].split("&");
      for (String param : params) {
        String[] kv = param.split("=", 2);
        if (kv.length == 2) {
          queryParams.put(kv[0], kv[1]);
        } else if (kv.length == 1) {
          queryParams.put(kv[0], "");
        }
      }
    }

    return new ParsedCurlCommand(method, url, headers, queryParams, body);
  }

  private String extractMethod(String curl) {
    Matcher m = METHOD_PATTERN.matcher(curl);
    if (m.find()) {
      return m.group(1);
    }
    return "GET"; // default
  }

  private String extractUrl(String curl) {
    Matcher m = URL_PATTERN.matcher(curl);
    if (m.find()) {
      return m.group(1);
    }
    throw ResourceException.of(ErrorCode.INVALID_CURL, "Missing valid URL");
  }

  private Map<String, String> extractHeaders(String curl) {
    Map<String, String> headers = new HashMap<>();
    Matcher m = HEADER_PATTERN.matcher(curl);
    while (m.find()) {
      headers.put(m.group(1).trim(), m.group(2).trim());
    }
    return headers;
  }

  private String extractBody(String curl) {
    Matcher m = DATA_PATTERN.matcher(curl);
    if (m.find()) {
      return m.group(1) != null ? m.group(1) : m.group(2);
    }
    return null;
  }
}
