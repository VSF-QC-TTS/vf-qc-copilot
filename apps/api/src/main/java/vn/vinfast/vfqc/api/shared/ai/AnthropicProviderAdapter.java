package vn.vinfast.vfqc.api.shared.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.ai.AiProvider;

/**
 * Anthropic (Claude) AI provider adapter. Uses the Anthropic Messages API with x-api-key header
 * authentication.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnthropicProviderAdapter implements AiProviderPort {

  private static final String DEFAULT_BASE_URL = "https://api.anthropic.com/v1/messages";
  private static final String API_VERSION = "2023-06-01";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public AiProvider getSupportedProvider() {
    return AiProvider.ANTHROPIC;
  }

  @Override
  public AiExecutionResult execute(AiRequest request) {
    long startTime = System.currentTimeMillis();
    AiConfig config = request.config();

    try {
      String baseUrl =
          config.getBaseUrl() != null && !config.getBaseUrl().isBlank()
              ? config.getBaseUrl()
              : DEFAULT_BASE_URL;

      String model = config.resolveModel(request.useCase());
      if (model == null || model.isBlank()) {
        model =
            "claude-sonnet-4-20250514"; // Default or fallback model for Anthropic if not specified
      }

      ObjectNode body = objectMapper.createObjectNode();
      body.put("model", model);
      body.put("max_tokens", config.getMaxTokens() != null ? config.getMaxTokens() : 1024);

      if (request.systemPrompt() != null && !request.systemPrompt().isBlank()) {
        body.put("system", request.systemPrompt());
      }

      if (config.getTemperature() != null) {
        body.put("temperature", config.getTemperature().doubleValue());
      }

      ArrayNode messages = body.putArray("messages");
      ObjectNode userMsg = messages.addObject();
      userMsg.put("role", "user");
      userMsg.put("content", request.userMessage());

      RestClient client = restClientBuilder.build();
      String responseStr =
          client
              .post()
              .uri(baseUrl)
              .header("x-api-key", request.apiKey())
              .header("anthropic-version", API_VERSION)
              .contentType(MediaType.APPLICATION_JSON)
              .body(body)
              .retrieve()
              .body(String.class);

      long latency = System.currentTimeMillis() - startTime;

      if (responseStr == null || responseStr.isBlank()) {
        return new AiExecutionResult(null, 0, 0, latency, "Empty response from Anthropic", false);
      }

      JsonNode responseJson = objectMapper.readTree(responseStr);
      String content = responseJson.path("content").path(0).path("text").asText();

      if (content == null || content.isBlank()) {
        String stopReason = responseJson.path("stop_reason").asText();
        return new AiExecutionResult(
            null, 0, 0, latency, "Empty content. Stop reason: " + stopReason, false);
      }

      int promptTokens = responseJson.path("usage").path("input_tokens").asInt(0);
      int completionTokens = responseJson.path("usage").path("output_tokens").asInt(0);

      return new AiExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (RestClientResponseException e) {
      long latency = System.currentTimeMillis() - startTime;
      log.error(
          "Anthropic request failed. status={}, body={}",
          e.getStatusCode(),
          e.getResponseBodyAsString(),
          e);
      return new AiExecutionResult(
          null,
          0,
          0,
          latency,
          "Anthropic HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
          false);
    } catch (Exception e) {
      log.error("Failed to execute Anthropic request", e);
      return new AiExecutionResult(
          null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
