package vn.vinfast.vfqc.api.model.testrun;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "test_runs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRun {

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

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 30)
  @Builder.Default
  private TestRunStatus status = TestRunStatus.QUEUED;

  @Column(name = "target_config_id", nullable = false)
  private Long targetConfigId;

  @Column(name = "target_config_version", nullable = false)
  private Integer targetConfigVersion;

  @Column(name = "ai_config_id")
  private Long aiConfigId;

  @Column(name = "ai_config_version")
  private Integer aiConfigVersion;

  @Column(name = "project_schema_id", nullable = false)
  private Long projectSchemaId;

  @Column(name = "project_schema_version", nullable = false)
  private Integer projectSchemaVersion;

  @Column(name = "dataset_id", nullable = false)
  private Long datasetId;

  @Column(name = "dataset_version_id", nullable = false)
  private Long datasetVersionId;

  @Column(name = "dataset_version_number", nullable = false)
  private Integer datasetVersionNumber;

  @Column(name = "verification_config_id", nullable = false)
  private Long verificationConfigId;

  @Column(name = "verification_config_version", nullable = false)
  private Integer verificationConfigVersion;

  @Column(name = "total_cases", nullable = false)
  @Builder.Default
  private Integer totalCases = 0;

  @Column(name = "passed_cases", nullable = false)
  @Builder.Default
  private Integer passedCases = 0;

  @Column(name = "failed_cases", nullable = false)
  @Builder.Default
  private Integer failedCases = 0;

  @Column(name = "error_cases", nullable = false)
  @Builder.Default
  private Integer errorCases = 0;

  @Column(name = "score", nullable = false, precision = 7, scale = 4)
  @Builder.Default
  private BigDecimal score = BigDecimal.ZERO;

  @Column(name = "queued_at", nullable = false)
  @Builder.Default
  private OffsetDateTime queuedAt = OffsetDateTime.now();

  @Column(name = "started_at")
  private OffsetDateTime startedAt;

  @Column(name = "finished_at")
  private OffsetDateTime finishedAt;

  @Column(name = "duration_ms")
  private Long durationMs;

  @Column(name = "cancellation_requested", nullable = false)
  @Builder.Default
  private Boolean cancellationRequested = false;

  @Column(name = "error_message")
  private String errorMessage;

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

  public boolean isTerminal() {
    return status == TestRunStatus.COMPLETED || status == TestRunStatus.ERROR || status == TestRunStatus.CANCELLED;
  }
}
