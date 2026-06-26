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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Entity
@Table(name = "target_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetConfig {

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

  @Column(name = "name", length = 255)
  private String name;

  @Column(name = "method", nullable = false, length = 10)
  private String method;

  @Column(name = "url", nullable = false, columnDefinition = "TEXT")
  private String url;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "headers", columnDefinition = "jsonb")
  private String headers;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "query_params", columnDefinition = "jsonb")
  private String queryParams;

  @Column(name = "body_template", columnDefinition = "TEXT")
  private String bodyTemplate;

  @Column(name = "response_path", length = 500)
  private String responsePath;

  @Column(name = "timeout_ms", nullable = false)
  @Builder.Default
  private Integer timeoutMs = 30000;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "request_field_snapshot", columnDefinition = "jsonb")
  private String requestFieldSnapshot;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "response_field_snapshot", columnDefinition = "jsonb")
  private String responseFieldSnapshot;

  @Column(name = "raw_curl", columnDefinition = "TEXT")
  private String rawCurl;

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
}
