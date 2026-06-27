package vn.vinfast.vfqc.api.domain.ai;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Append-only log of AI API usage for token tracking and budgeting.
 * Stub entity for Phase 2 — active logging deferred.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "ai_usage_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "project_id", nullable = false)
  private Long projectId;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "use_case", nullable = false, length = 30)
  private AiUseCase useCase;

  @Enumerated(EnumType.STRING)
  @Column(name = "provider", nullable = false, length = 50)
  private AiProvider provider;

  @Column(name = "model", nullable = false, length = 255)
  private String model;

  @Column(name = "input_tokens", nullable = false)
  @Builder.Default
  private Integer inputTokens = 0;

  @Column(name = "output_tokens", nullable = false)
  @Builder.Default
  private Integer outputTokens = 0;

  @Column(name = "total_tokens", nullable = false)
  @Builder.Default
  private Integer totalTokens = 0;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private UsageStatus status;

  @Column(name = "error_message")
  private String errorMessage;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
