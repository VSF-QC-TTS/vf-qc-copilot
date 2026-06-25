package vn.vinfast.vfqc.api.service.judge;

import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeExecutionResult;
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
public interface LlmProviderClient {

  LlmProvider getSupportedProvider();

  /**
   * Executes a prompt using the specific LLM provider.
   *
   * @param config the configuration
   * @param decryptedApiKey the decrypted API key
   * @param systemPrompt the system prompt
   * @param userMessage the user message
   * @return the execution result
   */
  JudgeExecutionResult execute(JudgeConfig config, String decryptedApiKey, String systemPrompt, String userMessage);
}
