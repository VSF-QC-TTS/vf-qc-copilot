package vn.vinfast.vfqc.api.infrastructure.ai;

import vn.vinfast.vfqc.api.domain.ai.AiConfig;
import vn.vinfast.vfqc.api.domain.ai.AiUseCase;

/**
 * Record representing an AI execution request.
 * Encapsulates the configuration, credentials, and prompt.
 *
 * @author nghlong3004
 * @since 6/27/2026
 */
public record AiRequest(
    AiConfig config,
    String apiKey,
    AiUseCase useCase,
    String systemPrompt,
    String userMessage
) {}
