package vn.vinfast.vfqc.api.model.ai;

/**
 * Scope levels for AI credential access.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public enum CredentialScope {
  /** System-wide default, managed by admin. */
  GLOBAL,
  /** Project-level override. */
  PROJECT,
  /** User-owned personal key. */
  USER
}
