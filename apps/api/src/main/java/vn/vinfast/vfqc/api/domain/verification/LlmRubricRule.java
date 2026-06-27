package vn.vinfast.vfqc.api.domain.verification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * An LLM-based rubric verification rule that evaluates response quality
 * using the configured AI provider.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "llm_rubrics")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LlmRubricRule {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "verification_config_id", nullable = false)
  private Long verificationConfigId;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "target_path", length = 500)
  private String targetPath;

  @Column(name = "rubric", nullable = false)
  private String rubric;

  @Column(name = "threshold", precision = 5, scale = 4)
  @Builder.Default
  private BigDecimal threshold = new BigDecimal("0.7");

  @Column(name = "weight", nullable = false, precision = 5, scale = 4)
  @Builder.Default
  private BigDecimal weight = BigDecimal.ONE;

  @Column(name = "enabled", nullable = false)
  @Builder.Default
  private boolean enabled = true;

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
