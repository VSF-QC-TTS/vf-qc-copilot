package vn.vinfast.vfqc.api.infrastructure.ai;

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
import vn.vinfast.vfqc.api.domain.ai.AiConfig;
import vn.vinfast.vfqc.api.domain.ai.AiProvider;

/**
 * Google Gemini AI provider adapter.
 * Uses the Gemini REST API with API key passed as query parameter.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiProviderAdapter implements AiProviderPort {

  private static final String DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
  private static final String DEFAULT_MODEL = "gemini-2.0-flash";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public AiProvider getSupportedProvider() {
    return AiProvider.GEMINI;
  }

  @Override
  public AiExecutionResult execute(AiRequest request) {
    long startTime = System.currentTimeMillis();
    AiConfig config = request.config();

    try {
      String userMessage = request.userMessage();
      if (userMessage == null || userMessage.isBlank()) {
        return new AiExecutionResult(null, 0, 0, 0, "Gemini userMessage is required", false);
      }

      String baseUrl = normalizeBaseUrl(config.getBaseUrl());
      String model = normalizeModel(config.resolveModel(request.useCase()));

      String url = baseUrl + "/models/" + model + ":generateContent";

      ObjectNode body = objectMapper.createObjectNode();

      if (request.systemPrompt() != null && !request.systemPrompt().isBlank()) {
        ObjectNode systemInstruction = body.putObject("system_instruction");
        ObjectNode sysPart = systemInstruction.putArray("parts").addObject();
        sysPart.put("text", request.systemPrompt());
      }

      ArrayNode contents = body.putArray("contents");
      ObjectNode userContent = contents.addObject();
      userContent.put("role", "user");

      ObjectNode userPart = userContent.putArray("parts").addObject();
      userPart.put("text", userMessage);

      ObjectNode generationConfig = body.putObject("generationConfig");
      if (config.getTemperature() != null) {
        generationConfig.put("temperature", config.getTemperature().doubleValue());
      }
      if (config.getMaxTokens() != null) {
        generationConfig.put("maxOutputTokens", config.getMaxTokens());
      }

      RestClient client = restClientBuilder.build();
      String responseStr = client.post()
          .uri(url)
          .header("x-goog-api-key", request.apiKey())
          .contentType(MediaType.APPLICATION_JSON)
          .body(body)
          .retrieve()
          .body(String.class);

      long latency = System.currentTimeMillis() - startTime;

      if (responseStr == null || responseStr.isBlank()) {
        return new AiExecutionResult(null, 0, 0, latency, "Empty response from Gemini", false);
      }

      JsonNode responseJson = objectMapper.readTree(responseStr);

      int promptTokens = responseJson.path("usageMetadata").path("promptTokenCount").asInt(0);
      int completionTokens = responseJson.path("usageMetadata").path("candidatesTokenCount").asInt(0);

      JsonNode candidates = responseJson.path("candidates");
      if (!candidates.isArray() || candidates.isEmpty()) {
        String blockReason = responseJson.path("promptFeedback").path("blockReason").asText(null);
        return new AiExecutionResult(
            null,
            promptTokens,
            completionTokens,
            latency,
            "Gemini returned no candidates. blockReason=" + blockReason,
            false
        );
      }

      JsonNode candidate = candidates.get(0);
      String content = extractText(candidate);

      if (content == null || content.isBlank()) {
        String finishReason = candidate.path("finishReason").asText(null);
        String finishMessage = candidate.path("finishMessage").asText(null);

        return new AiExecutionResult(
            null,
            promptTokens,
            completionTokens,
            latency,
            "Empty Gemini content. finishReason=" + finishReason + ", finishMessage=" + finishMessage,
            false
        );
      }

      return new AiExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (RestClientResponseException e) {
      long latency = System.currentTimeMillis() - startTime;
      log.error("Gemini request failed. status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
      return new AiExecutionResult(
          null,
          0,
          0,
          latency,
          "Gemini HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
          false
      );
    } catch (Exception e) {
      long latency = System.currentTimeMillis() - startTime;
      log.error("Failed to execute Gemini request", e);
      return new AiExecutionResult(null, 0, 0, latency, e.getMessage(), false);
    }
  }

  private String normalizeBaseUrl(String configuredBaseUrl) {
    if (configuredBaseUrl == null || configuredBaseUrl.isBlank()) {
      return DEFAULT_BASE_URL;
    }

    String trimmed = configuredBaseUrl.trim();

    if (trimmed.endsWith(":generateContent")) {
      int modelsIndex = trimmed.indexOf("/models/");
      if (modelsIndex > 0) {
        trimmed = trimmed.substring(0, modelsIndex);
      }
    }

    return trimmed.replaceAll("/+$", "");
  }

  private String normalizeModel(String configuredModel) {
    if (configuredModel == null || configuredModel.isBlank()) {
      return DEFAULT_MODEL;
    }

    String model = configuredModel.trim();

    if (model.startsWith("models/")) {
      return model.substring("models/".length());
    }

    return model;
  }

  private String extractText(JsonNode candidate) {
    JsonNode parts = candidate.path("content").path("parts");
    if (!parts.isArray()) {
      return null;
    }

    StringBuilder sb = new StringBuilder();

    for (JsonNode part : parts) {
      String text = part.path("text").asText(null);
      if (text != null && !text.isBlank()) {
        if (!sb.isEmpty()) {
          sb.append('\n');
        }
        sb.append(text);
      }
    }

    return sb.toString();
  }
}