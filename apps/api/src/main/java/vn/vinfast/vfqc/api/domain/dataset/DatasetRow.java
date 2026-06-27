package vn.vinfast.vfqc.api.domain.dataset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A single row in a dataset. Data is stored as JSONB keyed by column names.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Entity
@Table(name = "dataset_rows")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasetRow {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "dataset_id", nullable = false)
  private Long datasetId;

  @Column(name = "row_index", nullable = false)
  private Integer rowIndex;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "data", nullable = false, columnDefinition = "jsonb")
  private String data;

  @Column(name = "created_at", nullable = false, updatable = false)
  @Builder.Default
  private OffsetDateTime createdAt = OffsetDateTime.now();
}
