package vn.vinfast.vfqc.api.model.testrun;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "test_results")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResult {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "run_id", nullable = false)
  private Long runId;

  @Column(name = "dataset_row_id", nullable = false)
  private Long datasetRowId;

  @Column(name = "case_index", nullable = false)
  private Integer caseIndex;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "input_data", nullable = false, columnDefinition = "jsonb")
  private String inputData;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "actual_output", columnDefinition = "jsonb")
  private String actualOutput;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 30)
  private TestCaseStatus status;

  @Column(name = "passed", nullable = false)
  private Boolean passed;

  @Column(name = "score", nullable = false, precision = 7, scale = 4)
  private BigDecimal score;

  @Column(name = "error_message")
  private String errorMessage;

  @Column(name = "latency_ms")
  private Long latencyMs;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "raw_target_response", columnDefinition = "jsonb")
  private String rawTargetResponse;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
