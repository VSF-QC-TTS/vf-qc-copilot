package vn.vinfast.vfqc.api.model.ai;

/**
 * Types of AI operations performed in the platform.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public enum AiUseCase {
  /** Evaluating test results using LLM rubric/semantic judging. */
  EVALUATION,
  /** Generating test case datasets via AI. */
  GENERATION,
  /** AI-suggested schema columns from a description. */
  SCHEMA_SUGGESTION
}
