package vn.vinfast.vfqc.api.infrastructure.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.domain.dataset.Dataset;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaDatasetRepository extends JpaRepository<Dataset, Long> {

  List<Dataset> findByProjectIdOrderByCreatedAtDesc(Long projectId);

  boolean existsByProjectId(Long projectId);
}
