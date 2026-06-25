package vn.vinfast.vfqc.api.model.datasetschema;

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
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Entity
@Table(name = "dataset_columns")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetColumn {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "schema_version_id", nullable = false)
  private Long schemaVersionId;

  @Column(name = "column_name", nullable = false)
  private String columnName;

  @Column(name = "display_name")
  private String displayName;

  @Enumerated(EnumType.STRING)
  @Column(name = "data_type", nullable = false, length = 30)
  private ColumnDataType dataType;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false, length = 30)
  private ColumnRole role;

  @Column(name = "required", nullable = false)
  @Builder.Default
  private boolean required = false;

  @Column(name = "sample_value")
  private String sampleValue;

  @Column(name = "description")
  private String description;

  @Column(name = "display_order", nullable = false)
  @Builder.Default
  private Integer displayOrder = 0;

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
}
