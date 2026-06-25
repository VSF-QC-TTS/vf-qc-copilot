package vn.vinfast.vfqc.api.service.judge;

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
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeExecutionResult;

/**
 * Custom OpenAI-compatible provider client.
 * Supports any server that implements the OpenAI Chat Completions API format
 * (e.g. vLLM, Ollama, LM Studio, LocalAI, Text Generation Inference).
 * Requires the user to provide a baseUrl.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomProviderClient implements LlmProviderClient {

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public LlmProvider getSupportedProvider() {
    return LlmProvider.CUSTOM;
  }

  @Override
  public JudgeExecutionResult execute(JudgeConfig config, String decryptedApiKey, String systemPrompt, String userMessage) {
    long startTime = System.currentTimeMillis();
    try {
      if (config.getBaseUrl() == null || config.getBaseUrl().isBlank()) {
        return new JudgeExecutionResult(null, 0, 0, 0, "Custom provider requires a baseUrl", false);
      }

      String model = config.getCustomModelName() != null && !config.getCustomModelName().isBlank()
          ? config.getCustomModelName()
          : config.getModel();

      // Build OpenAI-compatible JSON body
      ObjectNode body = objectMapper.createObjectNode();
      if (model != null) {
        body.put("model", model);
      }
      body.put("temperature", config.getTemperature() != null ? config.getTemperature().doubleValue() : 0.0);
      if (config.getMaxTokens() != null) {
        body.put("max_tokens", config.getMaxTokens());
      }

      ArrayNode messages = body.putArray("messages");

      ObjectNode sysMsg = messages.addObject();
      sysMsg.put("role", "system");
      sysMsg.put("content", systemPrompt);

      ObjectNode userMsg = messages.addObject();
      userMsg.put("role", "user");
      userMsg.put("content", userMessage);

      RestClient client = restClientBuilder.build();
      var requestSpec = client.post()
          .uri(config.getBaseUrl())
          .contentType(MediaType.APPLICATION_JSON);

      // Only add auth header if API key is provided
      if (decryptedApiKey != null && !decryptedApiKey.isBlank()) {
        requestSpec.header(HttpHeaders.AUTHORIZATION, "Bearer " + decryptedApiKey);
      }

      String responseStr = requestSpec
          .body(body.toString())
          .retrieve()
          .body(String.class);

      long latency = System.currentTimeMillis() - startTime;
      JsonNode responseJson = objectMapper.readTree(responseStr);

      String content = responseJson.path("choices").path(0).path("message").path("content").asText();
      int promptTokens = responseJson.path("usage").path("prompt_tokens").asInt(0);
      int completionTokens = responseJson.path("usage").path("completion_tokens").asInt(0);

      return new JudgeExecutionResult(content, promptTokens, completionTokens, latency, null, true);

    } catch (Exception e) {
      log.error("Failed to execute Custom provider request", e);
      return new JudgeExecutionResult(null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
