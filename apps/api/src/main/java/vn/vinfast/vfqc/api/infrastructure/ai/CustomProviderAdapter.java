package vn.vinfast.vfqc.api.infrastructure.ai;

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
import vn.vinfast.vfqc.api.domain.ai.AiConfig;
import vn.vinfast.vfqc.api.domain.ai.AiProvider;

/**
 * Custom OpenAI-compatible AI provider adapter.
 * Supports any server implementing the OpenAI Chat Completions API format
 * (e.g. vLLM, Ollama, LM Studio, LocalAI, Text Generation Inference).
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomProviderAdapter implements AiProviderPort {

  private static final String CHAT_COMPLETIONS_PATH = "/chat/completions";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public AiProvider getSupportedProvider() {
    return AiProvider.CUSTOM;
  }

  @Override
  public AiExecutionResult execute(AiRequest request) {
    long startTime = System.currentTimeMillis();
    AiConfig config = request.config();

    try {
      String endpoint = normalizeEndpoint(config.getBaseUrl());
      if (endpoint == null) {
        return new AiExecutionResult(null, 0, 0, 0, "Custom provider requires a baseUrl or endpointUrl", false);
      }

      String model = config.resolveModel(request.useCase());
      if (model == null || model.isBlank()) {
        return new AiExecutionResult(null, 0, 0, 0, "Custom provider model is required", false);
      }

      if (request.userMessage() == null || request.userMessage().isBlank()) {
        return new AiExecutionResult(null, 0, 0, 0, "Custom provider userMessage is required", false);
      }

      ObjectNode body = objectMapper.createObjectNode();
      body.put("model", model);
      body.put("temperature", config.getTemperature() != null ? config.getTemperature().doubleValue() : 0.0);

      if (config.getMaxTokens() != null) {
        body.put("max_tokens", config.getMaxTokens());
      }

      ArrayNode messages = body.putArray("messages");

      if (request.systemPrompt() != null && !request.systemPrompt().isBlank()) {
        ObjectNode sysMsg = messages.addObject();
        sysMsg.put("role", "system");
        sysMsg.put("content", request.systemPrompt());
      }

      ObjectNode userMsg = messages.addObject();
      userMsg.put("role", "user");
      userMsg.put("content", request.userMessage());

      RestClient client = restClientBuilder.build();
      var requestSpec = client.post()
          .uri(endpoint)
          .contentType(MediaType.APPLICATION_JSON);

      if (request.apiKey() != null && !request.apiKey().isBlank()) {
        requestSpec.header(HttpHeaders.AUTHORIZATION, "Bearer " + request.apiKey());
      }

      String responseStr = requestSpec
          .body(body)
          .retrieve()
          .body(String.class);

      long latency = System.currentTimeMillis() - startTime;

      if (responseStr == null || responseStr.isBlank()) {
        return new AiExecutionResult(null, 0, 0, latency, "Empty response from Custom provider", false);
      }

      JsonNode responseJson = objectMapper.readTree(responseStr);
      JsonNode choiceNode = responseJson.path("choices").path(0);
      String content = extractMessageContent(choiceNode);

      if (content == null || content.isBlank()) {
        String finishReason = choiceNode.path("finish_reason").asText(null);
        return new AiExecutionResult(null, 0, 0, latency, "Empty content. Finish reason: " + finishReason, false);
      }

      int promptTokens = responseJson.path("usage").path("prompt_tokens").asInt(0);
      int completionTokens = responseJson.path("usage").path("completion_tokens").asInt(0);

      return new AiExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (RestClientResponseException e) {
      long latency = System.currentTimeMillis() - startTime;
      log.error("Custom provider request failed. status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
      return new AiExecutionResult(
          null,
          0,
          0,
          latency,
          "Custom provider HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
          false
      );
    } catch (Exception e) {
      long latency = System.currentTimeMillis() - startTime;
      log.error("Failed to execute Custom provider request", e);
      return new AiExecutionResult(null, 0, 0, latency, e.getMessage(), false);
    }
  }

  private String normalizeEndpoint(String configuredUrl) {
    if (configuredUrl == null || configuredUrl.isBlank()) {
      return null;
    }

    String url = configuredUrl.trim().replaceAll("/+$", "");

    if (url.endsWith(CHAT_COMPLETIONS_PATH)) {
      return url;
    }

    if (url.endsWith("/v1")) {
      return url + CHAT_COMPLETIONS_PATH;
    }

    return url;
  }

  private String extractMessageContent(JsonNode choiceNode) {
    JsonNode contentNode = choiceNode.path("message").path("content");

    if (contentNode.isTextual()) {
      return contentNode.asText();
    }

    if (contentNode.isArray()) {
      StringBuilder sb = new StringBuilder();
      for (JsonNode item : contentNode) {
        String text = item.path("text").asText(null);
        if (text != null && !text.isBlank()) {
          if (!sb.isEmpty()) {
            sb.append('\n');
          }
          sb.append(text);
        }
      }
      return sb.toString();
    }

    return null;
  }
}
