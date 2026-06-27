package vn.vinfast.vfqc.api.model.ai;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * AI provider types supported by the platform.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Getter
@RequiredArgsConstructor
public enum AiProvider {
  OPENAI("OpenAI"),
  GEMINI("Google Gemini"),
  ANTHROPIC("Anthropic"),
  AZURE_OPENAI("Azure OpenAI"),
  CUSTOM("Custom");

  private final String displayName;
}
