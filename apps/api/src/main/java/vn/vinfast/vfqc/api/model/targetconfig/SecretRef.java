package vn.vinfast.vfqc.api.model.targetconfig;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Entity
@Table(name = "secret_refs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecretRef {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, updatable = false, unique = true)
  @Builder.Default
  private UUID publicId = UUID.randomUUID();

  @Column(name = "project_id", nullable = false, updatable = false)
  private Long projectId;

  @Column(name = "owner_type", nullable = false, updatable = false, length = 50)
  private String ownerType;

  @Column(name = "owner_id", nullable = false, updatable = false)
  private Long ownerId;

  @Column(name = "secret_name", nullable = false, length = 255)
  private String secretName;

  @Column(name = "secret_location", nullable = false, length = 50)
  private String secretLocation;

  @Column(name = "secret_path", length = 500)
  private String secretPath;

  @Column(name = "encrypted_value", nullable = false, columnDefinition = "TEXT")
  private String encryptedValue;

  @Column(name = "masked_value", nullable = false, length = 255)
  private String maskedValue;

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
