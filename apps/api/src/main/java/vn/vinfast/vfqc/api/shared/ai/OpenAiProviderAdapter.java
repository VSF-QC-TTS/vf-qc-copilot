package vn.vinfast.vfqc.api.shared.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.ai.AiProvider;

/**
 * AI provider adapter for OpenAI-compatible APIs.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiProviderAdapter implements AiProviderPort {

  private static final String DEFAULT_BASE_URL = "https://api.openai.com/v1";
  private static final String CHAT_COMPLETIONS_PATH = "/chat/completions";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public AiProvider getSupportedProvider() {
    return AiProvider.OPENAI;
  }

  private String normalizeBaseUrl(String baseUrl) {
    if (baseUrl == null || baseUrl.isBlank()) {
      return DEFAULT_BASE_URL;
    }
    String normalized = baseUrl.trim();
    if (normalized.endsWith(CHAT_COMPLETIONS_PATH)) {
      normalized = normalized.substring(0, normalized.length() - CHAT_COMPLETIONS_PATH.length());
    }
    if (normalized.endsWith("/")) {
      normalized = normalized.substring(0, normalized.length() - 1);
    }
    return normalized;
  }

  @Override
  public AiExecutionResult execute(AiRequest request) {
    long startTime = System.currentTimeMillis();
    AiConfig config = request.config();

    try {
      String baseUrl = normalizeBaseUrl(config.getBaseUrl());
      String model = config.resolveModel(request.useCase());

      ObjectNode body = objectMapper.createObjectNode();
      body.put("model", model);
      body.put(
          "temperature",
          config.getTemperature() != null ? config.getTemperature().doubleValue() : 0.0);

      if (config.getMaxTokens() != null) {
        body.put("max_completion_tokens", config.getMaxTokens());
      }
      body.put("store", false);

      ArrayNode messages = body.putArray("messages");

      if (request.systemPrompt() != null && !request.systemPrompt().isBlank()) {
        ObjectNode sysMsg = messages.addObject();
        sysMsg.put("role", "system");
        sysMsg.put("content", request.systemPrompt());
      }

      ObjectNode userMsg = messages.addObject();
      userMsg.put("role", "user");
      userMsg.put("content", request.userMessage());

      RestClient client =
          restClientBuilder
              .baseUrl(baseUrl)
              .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + request.apiKey())
              .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
              .build();

      String responseStr =
          client
              .post()
              .uri(CHAT_COMPLETIONS_PATH)
              .contentType(MediaType.APPLICATION_JSON)
              .body(body.toString())
              .retrieve()
              .body(String.class);

      long latency = System.currentTimeMillis() - startTime;

      if (responseStr == null || responseStr.isBlank()) {
        return new AiExecutionResult(null, 0, 0, latency, "Empty response from OpenAI", false);
      }

      JsonNode responseJson = objectMapper.readTree(responseStr);
      JsonNode choiceNode = responseJson.path("choices").path(0);
      String content = choiceNode.path("message").path("content").asText();

      if (content == null || content.isBlank()) {
        String finishReason = choiceNode.path("finish_reason").asText();
        return new AiExecutionResult(
            null, 0, 0, latency, "Empty content. Finish reason: " + finishReason, false);
      }

      int promptTokens = responseJson.path("usage").path("prompt_tokens").asInt(0);
      int completionTokens = responseJson.path("usage").path("completion_tokens").asInt(0);

      return new AiExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (RestClientResponseException e) {
      long latency = System.currentTimeMillis() - startTime;
      log.error(
          "OpenAI request failed. status={}, body={}",
          e.getStatusCode(),
          e.getResponseBodyAsString(),
          e);
      return new AiExecutionResult(
          null,
          0,
          0,
          latency,
          "OpenAI HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
          false);
    } catch (Exception e) {
      log.error("Failed to execute OpenAI request", e);
      return new AiExecutionResult(
          null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
