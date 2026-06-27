package vn.vinfast.vfqc.api.domain.ai;

/**
 * Source of the API key for AI operations.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public enum KeySource {
  /** Platform-managed key with token budget. */
  PLATFORM,
  /** User-provided personal key, no budget limit. */
  PERSONAL
}
