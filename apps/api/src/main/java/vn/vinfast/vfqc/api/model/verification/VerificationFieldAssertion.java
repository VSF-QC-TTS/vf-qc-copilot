package vn.vinfast.vfqc.api.model.verification;

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

/**
 * Primitive deterministic assertion. A top-level field item has one assertion; a group item has
 * multiple assertions.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
@Entity
@Table(name = "verification_field_assertions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationFieldAssertion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "verification_item_id", nullable = false)
  private Long verificationItemId;

  @Column(name = "actual_path", nullable = false, length = 500)
  private String actualPath;

  @Enumerated(EnumType.STRING)
  @Column(name = "operator", nullable = false, length = 50)
  private CheckOperator operator;

  @Enumerated(EnumType.STRING)
  @Column(name = "expected_source", length = 30)
  private ExpectedSource expectedSource;

  @Column(name = "expected_column_key")
  private UUID expectedColumnKey;

  @Column(name = "expected_value")
  private String expectedValue;

  @Column(name = "expected_template")
  private String expectedTemplate;

  @Column(name = "threshold", precision = 5, scale = 4)
  private BigDecimal threshold;

  @Column(name = "weight", nullable = false, precision = 8, scale = 4)
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
