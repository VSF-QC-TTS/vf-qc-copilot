package vn.vinfast.vfqc.api.domain.ai;

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

/**
 * Stores encrypted API keys with scoped access (GLOBAL, PROJECT, USER).
 * Stub entity for Phase 2 — credential extraction from AiConfig.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "ai_credentials")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCredential {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Enumerated(EnumType.STRING)
  @Column(name = "scope", nullable = false, length = 20)
  private CredentialScope scope;

  @Column(name = "scope_owner_id")
  private Long scopeOwnerId;

  @Enumerated(EnumType.STRING)
  @Column(name = "provider", nullable = false, length = 50)
  private AiProvider provider;

  @Column(name = "encrypted_api_key", nullable = false)
  private String encryptedApiKey;

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
   * Checks if this credential is owned by the given user (USER scope only).
   */
  public boolean isOwnedBy(Long userId) {
    return scope == CredentialScope.USER && scopeOwnerId != null && scopeOwnerId.equals(userId);
  }

  /**
   * Checks if this credential matches the given resolution criteria.
   */
  public boolean matches(AiProvider targetProvider, CredentialScope targetScope, Long ownerId) {
    return provider == targetProvider
        && scope == targetScope
        && (scopeOwnerId == null ? ownerId == null : scopeOwnerId.equals(ownerId));
  }
}
