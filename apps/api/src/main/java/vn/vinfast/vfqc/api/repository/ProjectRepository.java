package vn.vinfast.vfqc.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.project.Project;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public interface ProjectRepository extends JpaRepository<Project, Long> {

  /**
   * Finds a {@link Project} by public identifier, ignoring soft-deleted records.
   *
   * @param publicId public project identifier
   * @return {@link Optional} containing the matching {@link Project} when present
   */
  Optional<Project> findByPublicIdAndDeletedAtIsNull(UUID publicId);

  /**
   * Finds all non-deleted {@link Project}s created by the specified user, ordered by latest update first.
   *
   * @param createdBy the internal user id of the creator
   * @param pageable pagination information
   * @return paginated matching {@link Project}s
   */
  org.springframework.data.domain.Page<Project> findByCreatedByAndDeletedAtIsNullOrderByUpdatedAtDesc(Long createdBy, org.springframework.data.domain.Pageable pageable);

  /**
   * Checks whether a non-deleted {@link Project} exists by public identifier.
   *
   * @param publicId public project identifier
   * @return true when the project exists and is not soft-deleted
   */
  boolean existsByPublicIdAndDeletedAtIsNull(UUID publicId);
}
