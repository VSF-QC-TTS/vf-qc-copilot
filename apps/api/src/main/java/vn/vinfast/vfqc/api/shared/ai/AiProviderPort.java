package vn.vinfast.vfqc.api.shared.ai;

import vn.vinfast.vfqc.api.model.ai.AiProvider;

/**
 * Port interface for AI provider adapters (Ports & Adapters pattern). Each adapter implements this
 * for a specific AI provider.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface AiProviderPort {

  /** Returns the provider this adapter handles. */
  AiProvider getSupportedProvider();

  /**
   * Executes a prompt using the AI provider.
   *
   * @param request the execution request containing config, key and prompts
   * @return the execution result
   */
  AiExecutionResult execute(AiRequest request);
}
