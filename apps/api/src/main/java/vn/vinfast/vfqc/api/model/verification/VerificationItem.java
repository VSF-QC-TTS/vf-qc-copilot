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
 * One evaluation item within a verification config. Field assertion details and LLM criteria are
 * stored in child tables.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
@Entity
@Table(name = "verification_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "verification_config_id", nullable = false)
  private Long verificationConfigId;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 40)
  private VerificationItemType type;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "enabled", nullable = false)
  @Builder.Default
  private boolean enabled = true;

  @Column(name = "critical", nullable = false)
  @Builder.Default
  private boolean critical = false;

  @Column(name = "weight", nullable = false, precision = 8, scale = 4)
  @Builder.Default
  private BigDecimal weight = BigDecimal.ONE;

  @Column(name = "threshold", precision = 5, scale = 4)
  private BigDecimal threshold;

  @Column(name = "display_order", nullable = false)
  @Builder.Default
  private Integer displayOrder = 0;

  @Enumerated(EnumType.STRING)
  @Column(name = "aggregation", length = 30)
  private FieldAggregation aggregation;

  @Column(name = "min_pass_count")
  private Integer minPassCount;

  @Column(name = "target_paths", columnDefinition = "jsonb")
  private String targetPaths;

  @Column(name = "reference_column_keys", columnDefinition = "jsonb")
  private String referenceColumnKeys;

  @Column(name = "rubric")
  private String rubric;

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
