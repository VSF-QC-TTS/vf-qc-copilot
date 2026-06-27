package vn.vinfast.vfqc.api.model.ai;

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
 * Aggregate root for AI configuration per project. Supports both evaluation (judging) and
 * generation (test case creation) models.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "ai_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConfig {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "project_id", nullable = false, unique = true)
  private Long projectId;

  @Column(name = "version", nullable = false)
  @Builder.Default
  private Integer version = 1;

  @Enumerated(EnumType.STRING)
  @Column(name = "key_source", nullable = false, length = 20)
  @Builder.Default
  private KeySource keySource = KeySource.PLATFORM;

  @Enumerated(EnumType.STRING)
  @Column(name = "provider", nullable = false, length = 50)
  private AiProvider provider;

  @Column(name = "base_url", length = 500)
  private String baseUrl;

  @Column(name = "evaluation_model", nullable = false, length = 255)
  private String evaluationModel;

  @Column(name = "generation_model", length = 255)
  private String generationModel;

  @Column(name = "temperature", precision = 3, scale = 2)
  @Builder.Default
  private BigDecimal temperature = BigDecimal.ZERO;

  @Column(name = "max_tokens")
  @Builder.Default
  private Integer maxTokens = 4096;

  @Column(name = "timeout_ms", nullable = false)
  @Builder.Default
  private Integer timeoutMs = 60000;

  @Column(name = "retry_count", nullable = false)
  @Builder.Default
  private Integer retryCount = 2;

  @Column(name = "last_test_status", length = 30)
  private String lastTestStatus;

  @Column(name = "last_tested_at")
  private OffsetDateTime lastTestedAt;

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

  // ── Domain logic ───────────────────────────────────────────

  /**
   * Resolves the model string to use for a given AI use case. Falls back to evaluationModel if
   * generationModel is not configured.
   */
  public String resolveModel(AiUseCase useCase) {
    if (useCase == AiUseCase.EVALUATION) {
      return evaluationModel;
    }
    return generationModel != null && !generationModel.isBlank()
        ? generationModel
        : evaluationModel;
  }

  /** Returns true if this provider requires a custom base URL. */
  public boolean requiresCustomBaseUrl() {
    return provider == AiProvider.CUSTOM;
  }

  /** Increments the version number on configuration update. */
  public void bumpVersion() {
    this.version++;
  }

  /** Records the result of a connection test. */
  public void recordTestResult(String status, OffsetDateTime testedAt) {
    this.lastTestStatus = status;
    this.lastTestedAt = testedAt;
  }
}
