package vn.vinfast.vfqc.api.domain.verification;

/**
 * Source of the expected value for a field check.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public enum ExpectedSource {
  /** Expected value is a hardcoded literal. */
  LITERAL,
  /** Expected value comes from a dataset column. */
  DATASET_COLUMN
}
