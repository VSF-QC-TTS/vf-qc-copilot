package vn.vinfast.vfqc.api.domain.dataset;

/**
 * Lifecycle status of a dataset.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public enum DatasetStatus {
  /** Dataset is being prepared (import preview, AI generation review). */
  DRAFT,
  /** Dataset is ready for use in test runs. */
  ACTIVE,
  /** Dataset is archived and no longer available for new test runs. */
  ARCHIVED
}
