package vn.vinfast.vfqc.api.model.dataset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dataset_versions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetVersion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "dataset_id", nullable = false)
  private Long datasetId;

  @Column(name = "schema_version_id", nullable = false)
  private Long schemaVersionId;

  @Column(name = "version_number", nullable = false)
  private Integer versionNumber;

  @Enumerated(EnumType.STRING)
  @Column(name = "source", nullable = false, length = 30)
  private DatasetSource source;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  @Builder.Default
  private DatasetVersionStatus status = DatasetVersionStatus.DRAFT;

  @Column(name = "total_rows", nullable = false)
  @Builder.Default
  private Integer totalRows = 0;

  @Column(name = "valid_rows", nullable = false)
  @Builder.Default
  private Integer validRows = 0;

  @Column(name = "invalid_rows", nullable = false)
  @Builder.Default
  private Integer invalidRows = 0;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
