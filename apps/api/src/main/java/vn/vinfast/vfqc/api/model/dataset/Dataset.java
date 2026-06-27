package vn.vinfast.vfqc.api.model.dataset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Aggregate root for a dataset — a collection of test case rows created via import, AI generation,
 * or manual entry.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "datasets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dataset {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "name", nullable = false, length = 255)
  private String name;

  @Column(name = "description")
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "source", nullable = false, length = 30)
  private DatasetSource source;

  @Column(name = "schema_version_id", nullable = false)
  private Long schemaVersionId;

  @Column(name = "total_rows", nullable = false)
  @Builder.Default
  private Integer totalRows = 0;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  @Builder.Default
  private DatasetStatus status = DatasetStatus.DRAFT;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();

  @Column(name = "updated_at", nullable = false)
  @Builder.Default
  private OffsetDateTime updatedAt = OffsetDateTime.now();

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }

  // ── Domain logic ───────────────────────────────────────────

  /**
   * Transitions the dataset from DRAFT to ACTIVE.
   *
   * @throws IllegalStateException if the dataset is not in DRAFT status
   */
  public void activate() {
    if (status != DatasetStatus.DRAFT) {
      throw new IllegalStateException("Only DRAFT datasets can be activated. Current: " + status);
    }
    this.status = DatasetStatus.ACTIVE;
  }

  /**
   * Transitions the dataset from ACTIVE to ARCHIVED.
   *
   * @throws IllegalStateException if the dataset is not in ACTIVE status
   */
  public void archive() {
    if (status != DatasetStatus.ACTIVE) {
      throw new IllegalStateException("Only ACTIVE datasets can be archived. Current: " + status);
    }
    this.status = DatasetStatus.ARCHIVED;
  }
}
