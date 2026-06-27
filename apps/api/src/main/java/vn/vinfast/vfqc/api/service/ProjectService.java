package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;

import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.project.request.CreateProjectRequest;
import vn.vinfast.vfqc.api.model.project.request.UpdateProjectRequest;
import vn.vinfast.vfqc.api.model.project.response.ProjectResponse;
import vn.vinfast.vfqc.api.model.project.response.ProjectSetupStatus;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Validated
public interface ProjectService {

  /**
   * Creates a new QC project.
   *
   * @param request validated {@link CreateProjectRequest}
   * @param userId internal user ID of the creator
   * @return public {@link ProjectResponse}
   */
  ProjectResponse create(@Valid CreateProjectRequest request, Long userId);

  /**
   * Lists all non-deleted projects created by a user with pagination.
   *
   * @param userId internal user ID of the creator
   * @param page page number (0-indexed)
   * @param size page size
   * @return paginated {@link ProjectResponse}
   */
  PageResponse<ProjectResponse> listByUser(Long userId, int page, int size);

  /**
   * Gets a project by its public identifier.
   *
   * @param publicId public project identifier
   * @return public {@link ProjectResponse}
   */
  ProjectResponse getByPublicId(UUID publicId);

  /**
   * Updates an existing project's metadata.
   *
   * @param publicId public project identifier
   * @param request validated {@link UpdateProjectRequest}
   * @return updated {@link ProjectResponse}
   */
  ProjectResponse update(UUID publicId, @Valid UpdateProjectRequest request);

  /**
   * Soft deletes a project by setting its deletedAt timestamp.
   *
   * @param publicId public project identifier
   */
  void softDelete(UUID publicId);

  /**
   * Gets the setup status overview for a project.
   *
   * @param publicId public project identifier
   * @return {@link ProjectSetupStatus}
   */
  ProjectSetupStatus getSetupStatus(UUID publicId);
}
