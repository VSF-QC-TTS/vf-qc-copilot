package vn.vinfast.vfqc.api.model.user;

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
import lombok.*;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column(name = "display_name", nullable = false)
  private String displayName;

  @Column(name = "avatar_url", length = 512)
  private String avatarUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  @Builder.Default
  private Role role = Role.QC_MEMBER;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  @Builder.Default
  private UserStatus status = UserStatus.ACTIVE;

  @Column(name = "last_login_at")
  private OffsetDateTime lastLoginAt;

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
