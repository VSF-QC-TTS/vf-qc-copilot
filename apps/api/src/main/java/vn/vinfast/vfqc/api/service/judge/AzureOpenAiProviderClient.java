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
 * Azure OpenAI provider client.
 * Uses the Azure-specific endpoint format with api-key header authentication.
 * URL format: {baseUrl}/openai/deployments/{model}/chat/completions?api-version=2024-02-01
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AzureOpenAiProviderClient implements LlmProviderClient {

  private static final String API_VERSION = "2024-02-01";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public LlmProvider getSupportedProvider() {
    return LlmProvider.AZURE_OPENAI;
  }

  @Override
  public JudgeExecutionResult execute(JudgeConfig config, String decryptedApiKey, String systemPrompt, String userMessage) {
    long startTime = System.currentTimeMillis();
    try {
      if (config.getBaseUrl() == null || config.getBaseUrl().isBlank()) {
        return new JudgeExecutionResult(null, 0, 0, 0, "Azure OpenAI requires a baseUrl (e.g. https://{resource}.openai.azure.com)", false);
      }

      String deployment = config.getModel() != null ? config.getModel() : config.getCustomModelName();
      if (deployment == null || deployment.isBlank()) {
        return new JudgeExecutionResult(null, 0, 0, 0, "Azure OpenAI requires a deployment name in the model field", false);
      }

      String url = config.getBaseUrl().replaceAll("/+$", "")
          + "/openai/deployments/" + deployment
          + "/chat/completions?api-version=" + API_VERSION;

      // Build OpenAI-compatible JSON body (Azure uses same format)
      ObjectNode body = objectMapper.createObjectNode();
      body.put("temperature", config.getTemperature() != null ? config.getTemperature().doubleValue() : 0.0);
      body.put("max_tokens", config.getMaxTokens());

      ArrayNode messages = body.putArray("messages");

      ObjectNode sysMsg = messages.addObject();
      sysMsg.put("role", "system");
      sysMsg.put("content", systemPrompt);

      ObjectNode userMsg = messages.addObject();
      userMsg.put("role", "user");
      userMsg.put("content", userMessage);

      RestClient client = restClientBuilder.build();
      String responseStr = client.post()
          .uri(url)
          .header("api-key", decryptedApiKey)
          .contentType(MediaType.APPLICATION_JSON)
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
      log.error("Failed to execute Azure OpenAI request", e);
      return new JudgeExecutionResult(null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
