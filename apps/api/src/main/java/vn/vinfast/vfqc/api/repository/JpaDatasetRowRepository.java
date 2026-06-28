package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.dataset.DatasetRow;

public interface JpaDatasetRowRepository extends JpaRepository<DatasetRow, Long> {

  Page<DatasetRow> findByDatasetVersionIdOrderByRowIndexAsc(Long datasetVersionId, Pageable pageable);

  List<DatasetRow> findByDatasetVersionIdOrderByRowIndexAsc(Long datasetVersionId);

  Optional<DatasetRow> findByPublicId(UUID publicId);
}
