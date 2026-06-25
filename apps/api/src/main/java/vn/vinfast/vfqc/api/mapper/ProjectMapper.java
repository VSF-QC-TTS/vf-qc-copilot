package vn.vinfast.vfqc.api.mapper;

import org.mapstruct.Mapper;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.project.response.ProjectResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Mapper(componentModel = "spring")
public interface ProjectMapper {

  /**
   * Maps an internal {@link Project} entity to a public API response.
   *
   * @param project internal {@link Project} entity
   * @return public {@link ProjectResponse}
   */
  ProjectResponse toResponse(Project project);
}
