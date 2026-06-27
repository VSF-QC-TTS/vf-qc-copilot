package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.dataset.DatasetJob;

public interface JpaDatasetJobRepository extends JpaRepository<DatasetJob, Long> {

  Optional<DatasetJob> findByPublicId(UUID publicId);

  List<DatasetJob> findByDatasetIdOrderByCreatedAtDesc(Long datasetId);
}
