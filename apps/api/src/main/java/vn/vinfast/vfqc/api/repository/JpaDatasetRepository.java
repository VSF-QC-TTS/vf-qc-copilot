package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.dataset.Dataset;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
public interface JpaDatasetRepository extends JpaRepository<Dataset, Long> {

  List<Dataset> findByProjectIdOrderByCreatedAtDesc(Long projectId);

  List<Dataset> findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long projectId);

  Page<Dataset> findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long projectId, Pageable pageable);

  Optional<Dataset> findByPublicId(UUID publicId);

  boolean existsByProjectId(Long projectId);
}
