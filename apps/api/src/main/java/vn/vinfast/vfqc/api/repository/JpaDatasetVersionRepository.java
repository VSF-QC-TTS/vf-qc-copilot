package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersion;

public interface JpaDatasetVersionRepository extends JpaRepository<DatasetVersion, Long> {

  Optional<DatasetVersion> findByPublicId(UUID publicId);

  List<DatasetVersion> findByDatasetIdOrderByVersionNumberDesc(Long datasetId);

  Optional<DatasetVersion> findTopByDatasetIdOrderByVersionNumberDesc(Long datasetId);
}
