package vn.vinfast.vfqc.api.model.testrun;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "assertion_results")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssertionResult {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "test_result_id", nullable = false)
  private Long testResultId;

  @Column(name = "assertion_name", nullable = false, length = 255)
  private String assertionName;

  @Column(name = "assertion_type", nullable = false, length = 50)
  private String assertionType;

  @Column(name = "response_path", length = 500)
  private String responsePath;

  @Column(name = "passed", nullable = false)
  private Boolean passed;

  @Column(name = "score", nullable = false, precision = 7, scale = 4)
  private BigDecimal score;

  @Column(name = "reason")
  private String reason;

  @Column(name = "expected_value", columnDefinition = "TEXT")
  private String expectedValue;

  @Column(name = "actual_value", columnDefinition = "TEXT")
  private String actualValue;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
