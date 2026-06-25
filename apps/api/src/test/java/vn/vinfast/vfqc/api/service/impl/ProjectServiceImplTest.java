package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;
import vn.vinfast.vfqc.api.shared.model.PageResponse;

@ExtendWith(MockitoExtension.class)
class ProjectServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private ProjectMapper projectMapper;
  @Mock private TargetConfigRepository targetConfigRepository;
  @Mock private JudgeConfigRepository judgeConfigRepository;
  @Mock private DatasetSchemaVersionRepository datasetSchemaRepository;
  @Mock private VerificationConfigRepository verificationConfigRepository;

  private ProjectServiceImpl service;

  @BeforeEach
  void setUp() {
    service = new ProjectServiceImpl(
        projectRepository, projectMapper, targetConfigRepository, 
        judgeConfigRepository, datasetSchemaRepository, verificationConfigRepository
    );
  }

  @Test
  void createProjectSavesAndReturnsResponse() {
    CreateProjectRequest request = new CreateProjectRequest(" ViVi QC ", " QC test  ");
    Project savedProject = project();
    ProjectResponse expectedResponse = new ProjectResponse(savedProject.getPublicId(), "ViVi QC", "QC test", null, null);

    when(projectRepository.save(any(Project.class))).thenReturn(savedProject);
    when(projectMapper.toResponse(savedProject)).thenReturn(expectedResponse);

    ProjectResponse actualResponse = service.create(request, 1L);

    assertThat(actualResponse).isEqualTo(expectedResponse);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectRepository).save(captor.capture());
    Project captured = captor.getValue();
    assertThat(captured.getName()).isEqualTo("ViVi QC");
    assertThat(captured.getDescription()).isEqualTo("QC test");
  }

  @Test
  void createProjectSetsCreatedByFromUserId() {
    CreateProjectRequest request = new CreateProjectRequest("ViVi QC", null);
    when(projectRepository.save(any(Project.class))).thenReturn(project());

    service.create(request, 99L);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectRepository).save(captor.capture());
    assertThat(captor.getValue().getCreatedBy()).isEqualTo(99L);
  }

  @Test
  void listByUserReturnsOnlyNonDeletedProjects() {
    Project project = project();
    ProjectResponse response = new ProjectResponse(project.getPublicId(), project.getName(), null, null, null);

    Page<Project> page = new PageImpl<>(java.util.List.of(project));

    when(projectRepository.findByCreatedByAndDeletedAtIsNullOrderByUpdatedAtDesc(1L, PageRequest.of(0, 20)))
        .thenReturn(page);
    when(projectMapper.toResponse(project)).thenReturn(response);

    PageResponse<ProjectResponse> result = service.listByUser(1L, 0, 20);

    assertThat(result.content()).hasSize(1);
    assertThat(result.content().get(0)).isEqualTo(response);
    assertThat(result.totalElements()).isEqualTo(1);
  }

  @Test
  void listByUserReturnsEmptyListWhenNoProjects() {
    Page<Project> emptyPage = Page.empty();
    when(projectRepository.findByCreatedByAndDeletedAtIsNullOrderByUpdatedAtDesc(1L, PageRequest.of(0, 20)))
        .thenReturn(emptyPage);

    PageResponse<ProjectResponse> result = service.listByUser(1L, 0, 20);

    assertThat(result.content()).isEmpty();
    assertThat(result.totalElements()).isZero();
  }

  @Test
  void getByPublicIdReturnsProjectWhenExists() {
    Project project = project();
    ProjectResponse response = new ProjectResponse(project.getPublicId(), project.getName(), null, null, null);

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(project.getPublicId()))
        .thenReturn(Optional.of(project));
    when(projectMapper.toResponse(project)).thenReturn(response);

    ProjectResponse result = service.getByPublicId(project.getPublicId());

    assertThat(result).isEqualTo(response);
  }

  @Test
  void getByPublicIdThrowsWhenNotFound() {
    UUID publicId = UUID.randomUUID();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)).thenReturn(Optional.empty());

    assertResourceCode(() -> service.getByPublicId(publicId), ErrorCode.PROJECT_NOT_FOUND);
  }

  @Test
  void updateProjectUpdatesOnlyNonNullFields() {
    Project project = project();
    UUID publicId = project.getPublicId();
    UpdateProjectRequest request = new UpdateProjectRequest(" New Name ", null);

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId))
        .thenReturn(Optional.of(project));
    when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

    service.update(publicId, request);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectRepository).save(captor.capture());
    Project captured = captor.getValue();
    assertThat(captured.getName()).isEqualTo("New Name");
    assertThat(captured.getDescription()).isEqualTo("QC for ViVi voice assistant"); // Should remain unchanged
  }

  @Test
  void updateProjectThrowsWhenNotFound() {
    UUID publicId = UUID.randomUUID();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)).thenReturn(Optional.empty());

    assertResourceCode(
        () -> service.update(publicId, new UpdateProjectRequest("Name", null)),
        ErrorCode.PROJECT_NOT_FOUND);
  }

  @Test
  void softDeleteSetsDeletedAt() {
    Project project = project();
    UUID publicId = project.getPublicId();

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId))
        .thenReturn(Optional.of(project));

    service.softDelete(publicId);

    ArgumentCaptor<Project> captor = ArgumentCaptor.forClass(Project.class);
    verify(projectRepository).save(captor.capture());
    Project captured = captor.getValue();
    assertThat(captured.getDeletedAt()).isNotNull();
  }

  @Test
  void softDeleteThrowsWhenNotFound() {
    UUID publicId = UUID.randomUUID();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)).thenReturn(Optional.empty());

    assertResourceCode(() -> service.softDelete(publicId), ErrorCode.PROJECT_NOT_FOUND);
  }

  @Test
  void getSetupStatusReturnsCorrectStatus() {
    Project project = project();
    UUID publicId = project.getPublicId();

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId))
        .thenReturn(Optional.of(project));
        
    when(targetConfigRepository.existsByProjectId(1L)).thenReturn(true);
    when(judgeConfigRepository.existsByProjectId(1L)).thenReturn(false);
    when(datasetSchemaRepository.existsByProjectId(1L)).thenReturn(true);
    when(verificationConfigRepository.existsByProjectId(1L)).thenReturn(false);

    ProjectSetupStatus status = service.getSetupStatus(publicId);

    assertThat(status.hasTargetConfig()).isTrue();
    assertThat(status.hasJudgeConfig()).isFalse();
    assertThat(status.hasDatasetSchema()).isTrue();
    assertThat(status.hasVerification()).isFalse();
    assertThat(status.hasDatasets()).isFalse();
    assertThat(status.totalTestRuns()).isZero();
  }

  private static void assertResourceCode(Runnable action, ErrorCode expectedCode) {
    assertThatThrownBy(action::run)
        .isInstanceOf(ResourceException.class)
        .extracting("errorCode")
        .isEqualTo(expectedCode);
  }

  private static Project project() {
    return Project.builder()
        .id(1L)
        .publicId(UUID.randomUUID())
        .name("ViVi QC")
        .description("QC for ViVi voice assistant")
        .createdBy(1L)
        .build();
  }
}
