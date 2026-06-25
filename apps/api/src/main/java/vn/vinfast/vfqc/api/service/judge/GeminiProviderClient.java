package vn.vinfast.vfqc.api.service.judge;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeExecutionResult;

/**
 * Google Gemini provider client.
 * Uses the Gemini REST API with API key passed as query parameter.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiProviderClient implements LlmProviderClient {

  private static final String DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public LlmProvider getSupportedProvider() {
    return LlmProvider.GEMINI;
  }

  @Override
  public JudgeExecutionResult execute(JudgeConfig config, String decryptedApiKey, String systemPrompt, String userMessage) {
    long startTime = System.currentTimeMillis();
    try {
      String baseUrl = config.getBaseUrl() != null && !config.getBaseUrl().isBlank()
          ? config.getBaseUrl()
          : DEFAULT_BASE_URL;

      String model = config.getModel() != null ? config.getModel() : "gemini-2.0-flash";
      String url = baseUrl + "/models/" + model + ":generateContent?key=" + decryptedApiKey;

      // Build Gemini-specific JSON body
      ObjectNode body = objectMapper.createObjectNode();

      // System instruction
      ObjectNode systemInstruction = body.putObject("system_instruction");
      ObjectNode sysPart = systemInstruction.putArray("parts").addObject();
      sysPart.put("text", systemPrompt);

      // User content
      ArrayNode contents = body.putArray("contents");
      ObjectNode userContent = contents.addObject();
      userContent.put("role", "user");
      ObjectNode userPart = userContent.putArray("parts").addObject();
      userPart.put("text", userMessage);

      // Generation config
      ObjectNode generationConfig = body.putObject("generationConfig");
      generationConfig.put("temperature", config.getTemperature() != null ? config.getTemperature().doubleValue() : 0.0);
      if (config.getMaxTokens() != null) {
        generationConfig.put("maxOutputTokens", config.getMaxTokens());
      }

      RestClient client = restClientBuilder.build();
      String responseStr = client.post()
          .uri(url)
          .contentType(MediaType.APPLICATION_JSON)
          .body(body.toString())
          .retrieve()
          .body(String.class);

      long latency = System.currentTimeMillis() - startTime;
      JsonNode responseJson = objectMapper.readTree(responseStr);

      String content = responseJson
          .path("candidates").path(0)
          .path("content").path("parts").path(0)
          .path("text").asText();

      int promptTokens = responseJson.path("usageMetadata").path("promptTokenCount").asInt(0);
      int completionTokens = responseJson.path("usageMetadata").path("candidatesTokenCount").asInt(0);

      return new JudgeExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (Exception e) {
      log.error("Failed to execute Gemini request", e);
      return new JudgeExecutionResult(null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
