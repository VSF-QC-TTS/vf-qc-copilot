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
 * A field-level verification rule that checks a specific response path against an expected value or
 * dataset column. Uses expectedColumnKey (UUID) for stable column reference that survives renames.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "field_checks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldCheckRule {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "verification_config_id", nullable = false)
  private Long verificationConfigId;

  @Column(name = "response_path", nullable = false, length = 500)
  private String responsePath;

  @Enumerated(EnumType.STRING)
  @Column(name = "operator", nullable = false, length = 50)
  private CheckOperator operator;

  @Enumerated(EnumType.STRING)
  @Column(name = "expected_source", nullable = false, length = 30)
  private ExpectedSource expectedSource;

  /** Stable reference to SchemaColumn.publicId — survives column renames. */
  @Column(name = "expected_column_key")
  private UUID expectedColumnKey;

  @Column(name = "expected_value")
  private String expectedValue;

  @Column(name = "threshold", precision = 5, scale = 4)
  private BigDecimal threshold;

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
