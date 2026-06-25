package vn.vinfast.vfqc.api.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.TestExecutionResult;

import vn.vinfast.vfqc.api.service.TargetHttpExecutor;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TargetHttpExecutorImpl implements TargetHttpExecutor {

  private final ObjectMapper objectMapper;
  private final RestClient.Builder restClientBuilder;

  /**
   * Executes a parsed cURL command.
   */
  public TestExecutionResult execute(ParsedCurlCommand parsed, Integer timeoutMs) {
    log.debug("Executing HTTP {} to {}", parsed.method(), parsed.url());
    long startTime = System.currentTimeMillis();
    int status = 0;
    String responseBody = null;
    String errorMessage = null;

    try {
      RestClient restClient = restClientBuilder.build();
      
      // Build URI
      UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(parsed.url());
      if (parsed.queryParams() != null) {
        parsed.queryParams().forEach(uriBuilder::queryParam);
      }
      URI uri = uriBuilder.build().toUri();

      // Build Headers
      HttpHeaders httpHeaders = new HttpHeaders();
      if (parsed.headers() != null) {
        parsed.headers().forEach(httpHeaders::add);
      }

      RestClient.RequestBodySpec requestSpec = restClient
          .method(HttpMethod.valueOf(parsed.method()))
          .uri(uri)
          .headers(h -> h.addAll(httpHeaders));

      if (parsed.body() != null && !parsed.body().isBlank()) {
        requestSpec.body(parsed.body());
      }

      var response = requestSpec.exchange((req, res) -> handleResponse(res));
      status = response.status();
      responseBody = response.body();

    } catch (Exception e) {
      log.error("Failed to execute target request", e);
      status = 502; // Bad Gateway
      errorMessage = e.getMessage();
    }

    long latencyMs = System.currentTimeMillis() - startTime;
    return new TestExecutionResult(status, latencyMs, responseBody, errorMessage, extractTree(responseBody));
  }

  /**
   * Executes a saved TargetConfig with optional substituted inputs.
   */
  public TestExecutionResult execute(TargetConfig config, Map<String, String> decryptedSecrets, Map<String, String> sampleInput) {
    log.info("Executing saved target config URL: {}", config.getUrl());
    // Map JSON fields
    Map<String, String> headers = parseJsonMap(config.getHeaders());
    Map<String, String> queryParams = parseJsonMap(config.getQueryParams());

    // Inject decrypted secrets into headers/params
    if (decryptedSecrets != null) {
      for (Map.Entry<String, String> entry : decryptedSecrets.entrySet()) {
        if (headers.containsKey(entry.getKey()) && "SECRET_REDACTED".equals(headers.get(entry.getKey()))) {
          headers.put(entry.getKey(), entry.getValue());
        }
        if (queryParams.containsKey(entry.getKey()) && "SECRET_REDACTED".equals(queryParams.get(entry.getKey()))) {
          queryParams.put(entry.getKey(), entry.getValue());
        }
      }
    }

    // Substitute body placeholders
    String body = config.getBodyTemplate();
    if (body != null && sampleInput != null) {
      for (Map.Entry<String, String> entry : sampleInput.entrySet()) {
        body = body.replace("{{" + entry.getKey() + "}}", entry.getValue());
      }
    }

    ParsedCurlCommand parsed = new ParsedCurlCommand(
        config.getMethod(),
        config.getUrl(),
        headers,
        queryParams,
        body
    );

    return execute(parsed, config.getTimeoutMs());
  }

  private Map<String, String> parseJsonMap(String json) {
    if (json == null || json.isBlank()) return new HashMap<>();
    try {
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (JsonProcessingException e) {
      return new HashMap<>();
    }
  }

  private Map<String, Object> extractTree(String responseBody) {
    if (responseBody == null || responseBody.isBlank()) return null;
    try {
      return objectMapper.readValue(responseBody, new TypeReference<>() {});
    } catch (Exception e) {
      return null;
    }
  }
  
  private record SimpleResponse(int status, String body) {}
  
  private SimpleResponse handleResponse(ClientHttpResponse res) throws java.io.IOException {
    int status = res.getStatusCode().value();
    byte[] bodyBytes = res.getBody().readAllBytes();
    String body = new String(bodyBytes);
    return new SimpleResponse(status, body);
  }
}
