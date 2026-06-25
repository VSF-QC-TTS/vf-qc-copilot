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
 * Anthropic (Claude) provider client.
 * Uses the Anthropic Messages API with x-api-key header authentication.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnthropicProviderClient implements LlmProviderClient {

  private static final String DEFAULT_BASE_URL = "https://api.anthropic.com/v1/messages";
  private static final String API_VERSION = "2023-06-01";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public LlmProvider getSupportedProvider() {
    return LlmProvider.ANTHROPIC;
  }

  @Override
  public JudgeExecutionResult execute(JudgeConfig config, String decryptedApiKey, String systemPrompt, String userMessage) {
    long startTime = System.currentTimeMillis();
    try {
      String baseUrl = config.getBaseUrl() != null && !config.getBaseUrl().isBlank()
          ? config.getBaseUrl()
          : DEFAULT_BASE_URL;

      // Build Anthropic-specific JSON body
      ObjectNode body = objectMapper.createObjectNode();
      body.put("model", config.getModel() != null ? config.getModel() : "claude-sonnet-4-20250514");
      body.put("max_tokens", config.getMaxTokens() != null ? config.getMaxTokens() : 1024);
      body.put("system", systemPrompt);

      if (config.getTemperature() != null) {
        body.put("temperature", config.getTemperature().doubleValue());
      }

      ArrayNode messages = body.putArray("messages");
      ObjectNode userMsg = messages.addObject();
      userMsg.put("role", "user");
      userMsg.put("content", userMessage);

      RestClient client = restClientBuilder.build();
      String responseStr = client.post()
          .uri(baseUrl)
          .header("x-api-key", decryptedApiKey)
          .header("anthropic-version", API_VERSION)
          .contentType(MediaType.APPLICATION_JSON)
          .body(body.toString())
          .retrieve()
          .body(String.class);

      long latency = System.currentTimeMillis() - startTime;
      JsonNode responseJson = objectMapper.readTree(responseStr);

      // Anthropic returns content as array of blocks
      String content = responseJson.path("content").path(0).path("text").asText();

      int promptTokens = responseJson.path("usage").path("input_tokens").asInt(0);
      int completionTokens = responseJson.path("usage").path("output_tokens").asInt(0);

      return new JudgeExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (Exception e) {
      log.error("Failed to execute Anthropic request", e);
      return new JudgeExecutionResult(null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
