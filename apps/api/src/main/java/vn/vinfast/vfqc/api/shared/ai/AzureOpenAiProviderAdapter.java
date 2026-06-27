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
 * Azure OpenAI AI provider adapter. Uses Azure-specific endpoint format with api-key header
 * authentication.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AzureOpenAiProviderAdapter implements AiProviderPort {

  private static final String API_VERSION = "2024-02-01";

  private final RestClient.Builder restClientBuilder;
  private final ObjectMapper objectMapper;

  @Override
  public AiProvider getSupportedProvider() {
    return AiProvider.AZURE_OPENAI;
  }

  @Override
  public AiExecutionResult execute(AiRequest request) {
    long startTime = System.currentTimeMillis();
    AiConfig config = request.config();

    try {
      if (config.getBaseUrl() == null || config.getBaseUrl().isBlank()) {
        return new AiExecutionResult(
            null,
            0,
            0,
            0,
            "Azure OpenAI requires a baseUrl (e.g. https://{resource}.openai.azure.com)",
            false);
      }

      String deployment = config.resolveModel(request.useCase());
      if (deployment == null || deployment.isBlank()) {
        return new AiExecutionResult(
            null, 0, 0, 0, "Azure OpenAI requires a deployment name in the model field", false);
      }

      String url =
          config.getBaseUrl().replaceAll("/+$", "")
              + "/openai/deployments/"
              + deployment
              + "/chat/completions?api-version="
              + API_VERSION;

      ObjectNode body = objectMapper.createObjectNode();
      body.put(
          "temperature",
          config.getTemperature() != null ? config.getTemperature().doubleValue() : 0.0);
      if (config.getMaxTokens() != null) {
        body.put("max_tokens", config.getMaxTokens());
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

      RestClient client = restClientBuilder.build();
      String responseStr =
          client
              .post()
              .uri(url)
              .header("api-key", request.apiKey())
              .contentType(MediaType.APPLICATION_JSON)
              .body(body)
              .retrieve()
              .body(String.class);

      long latency = System.currentTimeMillis() - startTime;

      if (responseStr == null || responseStr.isBlank()) {
        return new AiExecutionResult(
            null, 0, 0, latency, "Empty response from Azure OpenAI", false);
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
          "Azure OpenAI request failed. status={}, body={}",
          e.getStatusCode(),
          e.getResponseBodyAsString(),
          e);
      return new AiExecutionResult(
          null,
          0,
          0,
          latency,
          "Azure OpenAI HTTP error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
          false);
    } catch (Exception e) {
      log.error("Failed to execute Azure OpenAI request", e);
      return new AiExecutionResult(
          null, 0, 0, System.currentTimeMillis() - startTime, e.getMessage(), false);
    }
  }
}
