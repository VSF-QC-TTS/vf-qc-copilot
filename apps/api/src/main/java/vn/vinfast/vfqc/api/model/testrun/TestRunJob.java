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
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;

@Entity
@Table(name = "test_run_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRunJob {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "run_id", nullable = false)
  private Long runId;

  @Column(name = "type", nullable = false, length = 30)
  private String type;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 30)
  @Builder.Default
  private DatasetJobStatus status = DatasetJobStatus.QUEUED;

  @Column(name = "progress", nullable = false)
  @Builder.Default
  private Integer progress = 0;

  @Column(name = "message")
  private String message;

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

  @Column(name = "completed_at")
  private OffsetDateTime completedAt;

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }
}
