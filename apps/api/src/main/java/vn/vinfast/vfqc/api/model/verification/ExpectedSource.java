package vn.vinfast.vfqc.api.model.verification;

/**
 * Source of the expected value for a field check.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public enum ExpectedSource {
  /** Expected value comes from a dataset column. */
  DATASET_COLUMN,
  /** Expected value is a hardcoded static value. */
  STATIC_VALUE,
  /** Expected value is a template that may include dataset placeholders. */
  TEMPLATE
}
