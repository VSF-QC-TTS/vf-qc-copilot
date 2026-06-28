package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.dataset.Dataset;
import vn.vinfast.vfqc.api.model.dataset.DatasetStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersion;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersionStatus;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.testrun.RunEvent;
import vn.vinfast.vfqc.api.model.testrun.TestResult;
import vn.vinfast.vfqc.api.model.testrun.TestRun;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.response.RunEventResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunResponse;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;
import vn.vinfast.vfqc.api.repository.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetVersionRepository;
import vn.vinfast.vfqc.api.repository.JpaProjectSchemaRepository;
import vn.vinfast.vfqc.api.repository.JpaRunEventRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationConfigRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.TestRunService;
import vn.vinfast.vfqc.api.service.runner.EvalJobPublisher;
import vn.vinfast.vfqc.api.service.runner.EvalRunJobMessage;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@Slf4j
@Service
public class TestRunServiceImpl implements TestRunService {

  private final ProjectRepository projectRepository;
  private final UserRepository userRepository;
  private final TargetConfigRepository targetConfigRepository;
  private final JpaAiConfigRepository aiConfigRepository;
  private final JpaProjectSchemaRepository schemaRepository;
  private final JpaDatasetRepository datasetRepository;
  private final JpaDatasetVersionRepository datasetVersionRepository;
  private final JpaVerificationConfigRepository verificationConfigRepository;
  private final JpaTestRunRepository testRunRepository;
  private final EvalJobPublisher evalJobPublisher;
  private final JpaTestResultRepository testResultRepository;
  private final JpaRunEventRepository runEventRepository;

  @Autowired
  public TestRunServiceImpl(
      ProjectRepository projectRepository,
      UserRepository userRepository,
      TargetConfigRepository targetConfigRepository,
      JpaAiConfigRepository aiConfigRepository,
      JpaProjectSchemaRepository schemaRepository,
      JpaDatasetRepository datasetRepository,
      JpaDatasetVersionRepository datasetVersionRepository,
      JpaVerificationConfigRepository verificationConfigRepository,
      JpaTestRunRepository testRunRepository,
      EvalJobPublisher evalJobPublisher,
      JpaTestResultRepository testResultRepository,
      JpaRunEventRepository runEventRepository) {
    this.projectRepository = projectRepository;
    this.userRepository = userRepository;
    this.targetConfigRepository = targetConfigRepository;
    this.aiConfigRepository = aiConfigRepository;
    this.schemaRepository = schemaRepository;
    this.datasetRepository = datasetRepository;
    this.datasetVersionRepository = datasetVersionRepository;
    this.verificationConfigRepository = verificationConfigRepository;
    this.testRunRepository = testRunRepository;
    this.evalJobPublisher = evalJobPublisher;
    this.testResultRepository = testResultRepository;
    this.runEventRepository = runEventRepository;
  }

  TestRunServiceImpl(
      ProjectRepository projectRepository,
      UserRepository userRepository,
      TargetConfigRepository targetConfigRepository,
      JpaAiConfigRepository aiConfigRepository,
      JpaProjectSchemaRepository schemaRepository,
      JpaDatasetRepository datasetRepository,
      JpaDatasetVersionRepository datasetVersionRepository,
      JpaVerificationConfigRepository verificationConfigRepository,
      JpaTestRunRepository testRunRepository,
      EvalJobPublisher evalJobPublisher) {
    this(
        projectRepository,
        userRepository,
        targetConfigRepository,
        aiConfigRepository,
        schemaRepository,
        datasetRepository,
        datasetVersionRepository,
        verificationConfigRepository,
        testRunRepository,
        evalJobPublisher,
        null,
        null);
  }

  @Override
  @Transactional(readOnly = true)
  public PageResponse<TestRunResponse> list(UUID projectPublicId, int page, int size) {
    Project project = getProject(projectPublicId);
    return PageResponse.of(
        testRunRepository
            .findByProjectIdOrderByCreatedAtDesc(project.getId(), PageRequest.of(page, size))
            .map(this::toResponse));
  }

  @Override
  @Transactional
  public TestRunResponse create(UUID projectPublicId, CreateTestRunRequest request, String email) {
    Project project = getProject(projectPublicId);
    Long projectId = project.getId();

    TargetConfig targetConfig =
        targetConfigRepository
            .findByProjectId(projectId)
            .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_TARGET_CONFIG));
    ProjectSchema schema =
        schemaRepository
            .findByProjectId(projectId)
            .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_DATASET_SCHEMA));
    Dataset dataset = resolveDataset(projectId, request);
    DatasetVersion datasetVersion = resolveActiveVersion(dataset);
    VerificationConfig verificationConfig =
        verificationConfigRepository
            .findByProjectId(projectId)
            .orElseThrow(() -> ResourceException.of(ErrorCode.VERIFICATION_CONFIG_NOT_FOUND));
    Optional<AiConfig> aiConfig = resolveAiConfig(projectId, verificationConfig);
    User user = getUser(email);

    TestRun run =
        TestRun.builder()
            .projectId(projectId)
            .name(resolveRunName(request))
            .status(TestRunStatus.QUEUED)
            .targetConfigId(targetConfig.getId())
            .targetConfigVersion(targetConfig.getVersion())
            .aiConfigId(aiConfig.map(AiConfig::getId).orElse(null))
            .aiConfigVersion(aiConfig.map(AiConfig::getVersion).orElse(null))
            .projectSchemaId(schema.getId())
            .projectSchemaVersion(schema.getVersion())
            .datasetId(dataset.getId())
            .datasetVersionId(datasetVersion.getId())
            .datasetVersionNumber(datasetVersion.getVersionNumber())
            .verificationConfigId(verificationConfig.getId())
            .verificationConfigVersion(verificationConfig.getVersion())
            .totalCases(datasetVersion.getTotalRows())
            .createdBy(user.getId())
            .build();

    TestRun saved = testRunRepository.save(run);
    evalJobPublisher.publish(EvalRunJobMessage.requested(saved.getPublicId(), saved.getId(), saved.getProjectId()));
    return toResponse(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public TestRunResponse get(UUID runPublicId) {
    return toResponse(getRun(runPublicId));
  }

  @Override
  @Transactional(readOnly = true)
  public PageResponse<TestResultResponse> listResults(UUID runPublicId, int page, int size) {
    TestRun run = getRun(runPublicId);
    return PageResponse.of(
        testResultRepository
            .findByRunIdOrderByCaseIndexAsc(run.getId(), PageRequest.of(page, size))
            .map(result -> toResultResponse(run, result)));
  }

  @Override
  @Transactional(readOnly = true)
  public List<RunEventResponse> listEvents(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    return runEventRepository.findByRunIdOrderByCreatedAtAsc(run.getId()).stream()
        .map(event -> toEventResponse(run, event))
        .toList();
  }

  @Override
  @Transactional
  public TestRunResponse cancel(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    if (run.isTerminal()) {
      return toResponse(run);
    }
    run.setCancellationRequested(true);
    return toResponse(testRunRepository.save(run));
  }

  private Dataset resolveDataset(Long projectId, CreateTestRunRequest request) {
    if (request != null && request.datasetPublicId() != null) {
      Dataset dataset =
          datasetRepository
              .findByPublicId(request.datasetPublicId())
              .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_NOT_FOUND));
      if (!dataset.getProjectId().equals(projectId) || dataset.getActiveVersionId() == null) {
        throw ResourceException.of(ErrorCode.MISSING_DATASET);
      }
      return dataset;
    }

    return datasetRepository.findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(projectId).stream()
        .filter(dataset -> dataset.getStatus() == DatasetStatus.ACTIVE)
        .filter(dataset -> dataset.getActiveVersionId() != null)
        .max(Comparator.comparing(Dataset::getUpdatedAt))
        .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_DATASET));
  }

  private DatasetVersion resolveActiveVersion(Dataset dataset) {
    DatasetVersion version =
        datasetVersionRepository
            .findById(dataset.getActiveVersionId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_DATASET));
    if (version.getStatus() != DatasetVersionStatus.ACTIVE || version.getTotalRows() <= 0) {
      throw ResourceException.of(ErrorCode.MISSING_DATASET);
    }
    return version;
  }

  private Optional<AiConfig> resolveAiConfig(Long projectId, VerificationConfig verificationConfig) {
    if (requiresAi(verificationConfig)) {
      return Optional.of(
          aiConfigRepository
              .findByProjectId(projectId)
              .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_AI_CONFIG)));
    }
    return Optional.empty();
  }

  private boolean requiresAi(VerificationConfig verificationConfig) {
    return verificationConfig.getMode() == VerificationMode.LLM_JUDGE
        || verificationConfig.getMode() == VerificationMode.COMBINED;
  }

  private String resolveRunName(CreateTestRunRequest request) {
    if (request != null && StringUtils.hasText(request.name())) {
      return request.name().trim();
    }
    return "Test run " + OffsetDateTime.now();
  }

  private Project getProject(UUID publicId) {
    return projectRepository
        .findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private User getUser(String email) {
    return userRepository
        .findByEmail(email.toLowerCase())
        .orElseThrow(() -> ResourceException.of(ErrorCode.USER_NOT_FOUND));
  }

  private TestRun getRun(UUID publicId) {
    return testRunRepository
        .findByPublicId(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.TEST_RUN_NOT_FOUND));
  }

  private TestRunResponse toResponse(TestRun run) {
    return new TestRunResponse(
        run.getPublicId(),
        run.getName(),
        run.getStatus(),
        run.getProjectId(),
        run.getTargetConfigId(),
        run.getTargetConfigVersion(),
        run.getAiConfigId(),
        run.getAiConfigVersion(),
        run.getProjectSchemaId(),
        run.getProjectSchemaVersion(),
        run.getDatasetId(),
        run.getDatasetVersionId(),
        run.getDatasetVersionNumber(),
        run.getVerificationConfigId(),
        run.getVerificationConfigVersion(),
        run.getTotalCases(),
        run.getPassedCases(),
        run.getFailedCases(),
        run.getErrorCases(),
        run.getScore(),
        run.getQueuedAt(),
        run.getStartedAt(),
        run.getFinishedAt(),
        run.getDurationMs(),
        run.getCancellationRequested(),
        run.getErrorMessage(),
        run.getCreatedAt());
  }

  private TestResultResponse toResultResponse(TestRun run, TestResult result) {
    return new TestResultResponse(
        result.getPublicId(),
        run.getPublicId(),
        result.getDatasetRowId(),
        result.getCaseIndex(),
        result.getInputData(),
        result.getActualOutput(),
        result.getStatus(),
        result.getPassed(),
        result.getScore(),
        result.getErrorMessage(),
        result.getLatencyMs(),
        result.getCreatedAt());
  }

  private RunEventResponse toEventResponse(TestRun run, RunEvent event) {
    return new RunEventResponse(
        event.getPublicId(), run.getPublicId(), event.getEventType(), event.getPayload(), event.getCreatedAt());
  }
}
