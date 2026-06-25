package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.mapper.ProjectMapper;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.project.request.CreateProjectRequest;
import vn.vinfast.vfqc.api.model.project.request.UpdateProjectRequest;
import vn.vinfast.vfqc.api.model.project.response.ProjectResponse;
import vn.vinfast.vfqc.api.model.project.response.ProjectSetupStatus;
import vn.vinfast.vfqc.api.repository.DatasetSchemaVersionRepository;
import vn.vinfast.vfqc.api.repository.JudgeConfigRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.repository.VerificationConfigRepository;
import vn.vinfast.vfqc.api.service.ProjectService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;
import vn.vinfast.vfqc.api.shared.model.PageResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

  private final ProjectRepository projectRepository;
  private final ProjectMapper projectMapper;
  private final TargetConfigRepository targetConfigRepository;
  private final JudgeConfigRepository judgeConfigRepository;
  private final DatasetSchemaVersionRepository datasetSchemaRepository;
  private final VerificationConfigRepository verificationConfigRepository;

  @Override
  @Transactional
  public ProjectResponse create(CreateProjectRequest request, Long userId) {
    log.debug("Creating new project for user {}", userId);

    Project project =
        Project.builder()
            .name(request.name().trim())
            .description(request.description() != null ? request.description().trim() : null)
            .createdBy(userId)
            .build();

    Project saved = projectRepository.save(project);
    log.info("Created project {}", saved.getPublicId());

    return projectMapper.toResponse(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public PageResponse<ProjectResponse> listByUser(Long userId, int page, int size) {
    Page<Project> projectsPage =
        projectRepository.findByCreatedByAndDeletedAtIsNullOrderByUpdatedAtDesc(
            userId, PageRequest.of(page, size));
            
    return PageResponse.of(projectsPage.map(projectMapper::toResponse));
  }

  @Override
  @Transactional(readOnly = true)
  public ProjectResponse getByPublicId(UUID publicId) {
    Project project = getProjectEntityOrThrow(publicId);
    return projectMapper.toResponse(project);
  }

  @Override
  @Transactional
  public ProjectResponse update(UUID publicId, UpdateProjectRequest request) {
    Project project = getProjectEntityOrThrow(publicId);

    if (request.name() != null) {
      project.setName(request.name().trim());
    }

    if (request.description() != null) {
      project.setDescription(request.description().trim());
    }

    Project updated = projectRepository.save(project);
    log.info("Updated project {}", updated.getPublicId());

    return projectMapper.toResponse(updated);
  }

  @Override
  @Transactional
  public void softDelete(UUID publicId) {
    Project project = getProjectEntityOrThrow(publicId);

    project.setDeletedAt(OffsetDateTime.now());
    projectRepository.save(project);
    log.info("Soft deleted project {}", project.getPublicId());
  }

  @Override
  @Transactional(readOnly = true)
  public ProjectSetupStatus getSetupStatus(UUID publicId) {
    // Ensure project exists and is not deleted
    Project project = getProjectEntityOrThrow(publicId);
    Long projectId = project.getId();

    return new ProjectSetupStatus(
        targetConfigRepository.existsByProjectId(projectId),
        judgeConfigRepository.existsByProjectId(projectId),
        datasetSchemaRepository.existsByProjectId(projectId),
        verificationConfigRepository.existsByProjectId(projectId),
        false, // hasDatasets (Phase 2)
        0      // totalTestRuns (Phase 3)
    );
  }

  private Project getProjectEntityOrThrow(UUID publicId) {
    return projectRepository
        .findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> new ResourceException(ErrorCode.PROJECT_NOT_FOUND));
  }
}
