package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.dataset.Dataset;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersion;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersionStatus;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.testrun.RunEvent;
import vn.vinfast.vfqc.api.model.testrun.AssertionResult;
import vn.vinfast.vfqc.api.model.testrun.TestResult;
import vn.vinfast.vfqc.api.model.testrun.TestRun;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;
import vn.vinfast.vfqc.api.model.testrun.request.AddCustomColumnRequest;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.request.OverrideResultRequest;
import vn.vinfast.vfqc.api.model.testrun.request.SaveCustomValueRequest;
import vn.vinfast.vfqc.api.model.testrun.response.AssertionResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.CustomColumnResponse;
import vn.vinfast.vfqc.api.model.testrun.response.CustomValueResponse;
import vn.vinfast.vfqc.api.model.testrun.response.RunEventResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultOverrideResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunResponse;
import vn.vinfast.vfqc.api.model.testrun.TestRunCustomColumn;
import vn.vinfast.vfqc.api.model.testrun.TestResultCustomValue;
import vn.vinfast.vfqc.api.model.testrun.TestResultOverride;
import vn.vinfast.vfqc.api.model.testrun.TestRunJob;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunJobResponse;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;
import vn.vinfast.vfqc.api.repository.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaAssertionResultRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetVersionRepository;
import vn.vinfast.vfqc.api.repository.JpaProjectSchemaRepository;
import vn.vinfast.vfqc.api.repository.JpaRunEventRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunCustomColumnRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultCustomValueRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultOverrideRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunJobRepository;
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
  private final JpaAssertionResultRepository assertionResultRepository;
  private final JpaTestRunCustomColumnRepository testRunCustomColumnRepository;
  private final JpaTestResultCustomValueRepository testResultCustomValueRepository;
  private final JpaTestResultOverrideRepository testResultOverrideRepository;
  private final JpaTestRunJobRepository testRunJobRepository;
  private final Executor taskExecutor;
  private final TransactionTemplate transactionTemplate;

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
      JpaRunEventRepository runEventRepository,
      JpaAssertionResultRepository assertionResultRepository,
      JpaTestRunCustomColumnRepository testRunCustomColumnRepository,
      JpaTestResultCustomValueRepository testResultCustomValueRepository,
      JpaTestResultOverrideRepository testResultOverrideRepository,
      JpaTestRunJobRepository testRunJobRepository,
      Executor taskExecutor,
      TransactionTemplate transactionTemplate) {
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
    this.assertionResultRepository = assertionResultRepository;
    this.testRunCustomColumnRepository = testRunCustomColumnRepository;
    this.testResultCustomValueRepository = testResultCustomValueRepository;
    this.testResultOverrideRepository = testResultOverrideRepository;
    this.testRunJobRepository = testRunJobRepository;
    this.taskExecutor = taskExecutor;
    this.transactionTemplate = transactionTemplate;
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
    Page<TestResult> resultPage =
        testResultRepository.findByRunIdOrderByCaseIndexAsc(run.getId(), PageRequest.of(page, size));
    
    List<TestResult> resultsList = resultPage.getContent();
    Map<Long, List<AssertionResult>> assertionsByResultId = loadAssertionsByResultId(resultsList);
    
    List<Long> resultIds = resultsList.stream().map(TestResult::getId).toList();
    
    // Load custom columns for this run
    List<TestRunCustomColumn> customColumns = testRunCustomColumnRepository.findByRunId(run.getId());
    Map<Long, UUID> columnPublicIdMap = customColumns.stream()
        .collect(Collectors.toMap(TestRunCustomColumn::getId, TestRunCustomColumn::getPublicId));
        
    // Load custom values
    Map<Long, List<TestResultCustomValue>> customValuesByResultId = Map.of();
    if (!resultIds.isEmpty()) {
      customValuesByResultId = testResultCustomValueRepository.findByTestResultIdIn(resultIds).stream()
          .collect(Collectors.groupingBy(TestResultCustomValue::getTestResultId));
    }
    
    // Load overrides and user correctors
    Map<Long, TestResultOverride> overridesByResultId = Map.of();
    Map<Long, User> usersById = Map.of();
    if (!resultIds.isEmpty()) {
      List<TestResultOverride> overrides = testResultOverrideRepository.findByTestResultIdIn(resultIds);
      overridesByResultId = overrides.stream()
          .collect(Collectors.toMap(TestResultOverride::getTestResultId, o -> o));
      List<Long> userIds = overrides.stream().map(TestResultOverride::getCorrectedBy).distinct().toList();
      if (!userIds.isEmpty()) {
        usersById = userRepository.findAllById(userIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));
      }
    }
    
    final Map<Long, List<TestResultCustomValue>> finalCustomValues = customValuesByResultId;
    final Map<Long, TestResultOverride> finalOverrides = overridesByResultId;
    final Map<Long, User> finalUsers = usersById;
    
    return PageResponse.of(resultPage.map(result -> toResultResponse(
        run,
        result,
        assertionsByResultId,
        finalCustomValues,
        finalOverrides,
        finalUsers,
        columnPublicIdMap
    )));
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

  private Map<Long, List<AssertionResult>> loadAssertionsByResultId(List<TestResult> results) {
    if (results.isEmpty()) {
      return Map.of();
    }
    List<Long> resultIds = results.stream().map(TestResult::getId).toList();
    return assertionResultRepository.findByTestResultIdInOrderByTestResultIdAscIdAsc(resultIds).stream()
        .collect(Collectors.groupingBy(AssertionResult::getTestResultId));
  }

  private TestResultResponse toResultResponse(
      TestRun run,
      TestResult result,
      Map<Long, List<AssertionResult>> assertionsByResultId,
      Map<Long, List<TestResultCustomValue>> customValuesByResultId,
      Map<Long, TestResultOverride> overridesByResultId,
      Map<Long, User> usersById,
      Map<Long, UUID> columnPublicIdMap) {
      
    List<CustomValueResponse> customValues = customValuesByResultId.getOrDefault(result.getId(), List.of()).stream()
        .map(cv -> new CustomValueResponse(columnPublicIdMap.get(cv.getCustomColumnId()), cv.getValue()))
        .filter(cv -> cv.customColumnPublicId() != null)
        .toList();
        
    TestResultOverride overrideEntity = overridesByResultId.get(result.getId());
    TestResultOverrideResponse overrideResponse = null;
    if (overrideEntity != null) {
      User user = usersById.get(overrideEntity.getCorrectedBy());
      String email = user != null ? user.getEmail() : "system";
      overrideResponse = new TestResultOverrideResponse(
          overrideEntity.getPublicId(),
          overrideEntity.getOverriddenStatus(),
          overrideEntity.getOverriddenScore(),
          overrideEntity.getCorrectedReason(),
          email,
          overrideEntity.getCreatedAt());
    }

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
        assertionsByResultId.getOrDefault(result.getId(), List.of()).stream()
            .map(this::toAssertionResponse)
            .toList(),
        customValues,
        overrideResponse,
        result.getCreatedAt());
  }

  private AssertionResultResponse toAssertionResponse(AssertionResult assertion) {
    return new AssertionResultResponse(
        assertion.getPublicId(),
        assertion.getAssertionName(),
        assertion.getAssertionType(),
        assertion.getResponsePath(),
        assertion.getPassed(),
        assertion.getScore(),
        assertion.getReason(),
        assertion.getExpectedValue(),
        assertion.getActualValue(),
        assertion.getCreatedAt());
  }

  private RunEventResponse toEventResponse(TestRun run, RunEvent event) {
    return new RunEventResponse(
        event.getPublicId(), run.getPublicId(), event.getEventType(), event.getPayload(), event.getCreatedAt());
  }

  @Override
  @Transactional(readOnly = true)
  public List<CustomColumnResponse> listCustomColumns(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    return testRunCustomColumnRepository.findByRunId(run.getId()).stream()
        .map(c -> new CustomColumnResponse(c.getPublicId(), c.getColumnName(), c.getDataType()))
        .toList();
  }

  @Override
  @Transactional
  public CustomColumnResponse addCustomColumn(UUID runPublicId, AddCustomColumnRequest request) {
    TestRun run = getRun(runPublicId);
    TestRunCustomColumn col = TestRunCustomColumn.builder()
        .runId(run.getId())
        .columnName(request.columnName())
        .dataType(request.dataType())
        .build();
    TestRunCustomColumn saved = testRunCustomColumnRepository.save(col);
    return new CustomColumnResponse(saved.getPublicId(), saved.getColumnName(), saved.getDataType());
  }

  @Override
  @Transactional
  public void saveCustomValue(UUID resultPublicId, SaveCustomValueRequest request) {
    TestResult result = testResultRepository.findByPublicId(resultPublicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
    TestRunCustomColumn column = testRunCustomColumnRepository.findByPublicId(request.customColumnPublicId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));

    Optional<TestResultCustomValue> existing = testResultCustomValueRepository
        .findByTestResultIdAndCustomColumnId(result.getId(), column.getId());

    if (existing.isPresent()) {
      TestResultCustomValue value = existing.get();
      value.setValue(request.value());
      testResultCustomValueRepository.save(value);
    } else {
      TestResultCustomValue newValue = TestResultCustomValue.builder()
          .testResultId(result.getId())
          .customColumnId(column.getId())
          .value(request.value())
          .build();
      testResultCustomValueRepository.save(newValue);
    }
  }

  @Override
  @Transactional
  public TestResultOverrideResponse overrideResult(UUID resultPublicId, OverrideResultRequest request, String userEmail) {
    TestResult result = testResultRepository.findByPublicId(resultPublicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
    User user = getUser(userEmail);

    Optional<TestResultOverride> existing = testResultOverrideRepository.findByTestResultId(result.getId());
    TestResultOverride override;
    
    if (existing.isPresent()) {
      override = existing.get();
      override.setOverriddenStatus(request.overriddenStatus());
      override.setOverriddenScore(request.overriddenScore());
      override.setCorrectedReason(request.correctedReason());
      override.setCorrectedBy(user.getId());
      override = testResultOverrideRepository.save(override);
    } else {
      override = TestResultOverride.builder()
          .testResultId(result.getId())
          .overriddenStatus(request.overriddenStatus())
          .overriddenScore(request.overriddenScore())
          .correctedReason(request.correctedReason())
          .correctedBy(user.getId())
          .build();
      override = testResultOverrideRepository.save(override);
    }

    return new TestResultOverrideResponse(
        override.getPublicId(),
        override.getOverriddenStatus(),
        override.getOverriddenScore(),
        override.getCorrectedReason(),
        user.getEmail(),
        override.getCreatedAt()
    );
  }

  @Override
  @Transactional
  public TestRunJobResponse startExport(UUID runPublicId, String email) {
    TestRun run = getRun(runPublicId);
    User user = getUser(email);
    
    TestRunJob job = testRunJobRepository.save(
        TestRunJob.builder()
            .projectId(run.getProjectId())
            .runId(run.getId())
            .type("EXPORT_EXCEL")
            .createdBy(user.getId())
            .message("Queued Excel export")
            .build()
    );
    
    executeAfterCommit(() -> runExport(job.getPublicId()));
    return toJobResponse(job);
  }

  @Override
  @Transactional(readOnly = true)
  public TestRunJobResponse getJobEvent(UUID jobPublicId) {
    TestRunJob job = testRunJobRepository.findByPublicId(jobPublicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
    return toJobResponse(job);
  }

  @Override
  @Transactional(readOnly = true)
  public ResponseEntity<byte[]> downloadExcel(UUID runPublicId, UUID jobPublicId) {
    TestRun run = getRun(runPublicId);
    TestRunJob job = testRunJobRepository.findByPublicId(jobPublicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
        
    if (!job.getRunId().equals(run.getId()) || job.getStatus() != DatasetJobStatus.COMPLETED) {
      throw ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND);
    }
    
    byte[] bytes = buildWorkbookBytes(run);
    String filename = "test-run-" + run.getPublicId() + ".xlsx";
    return ResponseEntity.ok()
        .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .body(bytes);
  }

  private void runExport(UUID jobPublicId) {
    log.info("[TEST RUN EXPORT] Starting: jobId={}", jobPublicId);
    transactionTemplate.executeWithoutResult(status -> {
      TestRunJob job = testRunJobRepository.findByPublicId(jobPublicId).orElse(null);
      if (job == null) return;
      
      job.setStatus(DatasetJobStatus.RUNNING);
      job.setProgress(40);
      job.setMessage("Preparing Excel report");
      testRunJobRepository.save(job);
      
      try {
        TestRun run = testRunRepository.findById(job.getRunId()).orElse(null);
        if (run == null) {
          throw new Exception("Test run not found");
        }
        buildWorkbookBytes(run); // validate build
        
        job.setStatus(DatasetJobStatus.COMPLETED);
        job.setProgress(100);
        job.setMessage("Export ready");
        job.setCompletedAt(OffsetDateTime.now());
        testRunJobRepository.save(job);
        log.info("[TEST RUN EXPORT] Completed: jobId={}", jobPublicId);
      } catch (Exception ex) {
        log.error("[TEST RUN EXPORT] Failed: jobId={}", jobPublicId, ex);
        status.setRollbackOnly();
        transactionTemplate.executeWithoutResult(s -> {
          TestRunJob failedJob = testRunJobRepository.findByPublicId(jobPublicId).orElse(null);
          if (failedJob != null) {
            failedJob.setStatus(DatasetJobStatus.FAILED);
            failedJob.setMessage("Export failed: " + ex.getMessage());
            testRunJobRepository.save(failedJob);
          }
        });
      }
    });
  }

  private byte[] buildWorkbookBytes(TestRun run) {
    List<TestResult> results = testResultRepository.findByRunIdOrderByCaseIndexAsc(run.getId());
    List<TestRunCustomColumn> customColumns = testRunCustomColumnRepository.findByRunId(run.getId());
    List<Long> resultIds = results.stream().map(TestResult::getId).toList();
    
    // Load overrides
    Map<Long, TestResultOverride> overridesByResultId = Map.of();
    Map<Long, User> usersById = Map.of();
    if (!resultIds.isEmpty()) {
      List<TestResultOverride> overrides = testResultOverrideRepository.findByTestResultIdIn(resultIds);
      overridesByResultId = overrides.stream()
          .collect(Collectors.toMap(TestResultOverride::getTestResultId, o -> o));
      List<Long> userIds = overrides.stream().map(TestResultOverride::getCorrectedBy).distinct().toList();
      if (!userIds.isEmpty()) {
        usersById = userRepository.findAllById(userIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));
      }
    }

    // Load custom values
    Map<Long, Map<Long, String>> customValuesByCell = Map.of();
    if (!resultIds.isEmpty()) {
      customValuesByCell = testResultCustomValueRepository.findByTestResultIdIn(resultIds).stream()
          .collect(Collectors.groupingBy(
              TestResultCustomValue::getTestResultId,
              Collectors.toMap(TestResultCustomValue::getCustomColumnId, TestResultCustomValue::getValue)
          ));
    }

    try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
         var out = new java.io.ByteArrayOutputStream()) {
      var sheet = workbook.createSheet("Test Run Report");
      
      // Build Headers
      org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
      int colIndex = 0;
      header.createCell(colIndex++).setCellValue("Case Index");
      header.createCell(colIndex++).setCellValue("Status");
      header.createCell(colIndex++).setCellValue("Passed");
      header.createCell(colIndex++).setCellValue("Score (%)");
      header.createCell(colIndex++).setCellValue("Latency (ms)");
      header.createCell(colIndex++).setCellValue("AI Status");
      header.createCell(colIndex++).setCellValue("AI Score (%)");
      header.createCell(colIndex++).setCellValue("Corrected By");
      header.createCell(colIndex++).setCellValue("Correction Reason");
      header.createCell(colIndex++).setCellValue("Error Message");
      
      // Add custom columns to headers
      for (TestRunCustomColumn col : customColumns) {
        header.createCell(colIndex++).setCellValue(col.getColumnName());
      }
      
      header.createCell(colIndex++).setCellValue("Input Data");
      header.createCell(colIndex++).setCellValue("Actual Output");
      
      // Fill Data Rows
      for (int r = 0; r < results.size(); r++) {
        TestResult res = results.get(r);
        org.apache.poi.ss.usermodel.Row excelRow = sheet.createRow(r + 1);
        
        TestResultOverride ovr = overridesByResultId.get(res.getId());
        String status = ovr != null ? ovr.getOverriddenStatus() : res.getStatus().name();
        boolean passed = ovr != null ? "PASSED".equalsIgnoreCase(ovr.getOverriddenStatus()) : res.getPassed();
        java.math.BigDecimal score = ovr != null ? ovr.getOverriddenScore() : res.getScore();
        
        int cellIdx = 0;
        excelRow.createCell(cellIdx++).setCellValue(res.getCaseIndex());
        excelRow.createCell(cellIdx++).setCellValue(status);
        excelRow.createCell(cellIdx++).setCellValue(passed ? "Yes" : "No");
        excelRow.createCell(cellIdx++).setCellValue(score.multiply(java.math.BigDecimal.valueOf(100)).doubleValue());
        excelRow.createCell(cellIdx++).setCellValue(res.getLatencyMs() != null ? res.getLatencyMs() : 0);
        excelRow.createCell(cellIdx++).setCellValue(res.getStatus().name());
        excelRow.createCell(cellIdx++).setCellValue(res.getScore().multiply(java.math.BigDecimal.valueOf(100)).doubleValue());
        
        if (ovr != null) {
          User user = usersById.get(ovr.getCorrectedBy());
          excelRow.createCell(cellIdx++).setCellValue(user != null ? user.getEmail() : "system");
          excelRow.createCell(cellIdx++).setCellValue(ovr.getCorrectedReason());
        } else {
          excelRow.createCell(cellIdx++).setCellValue("");
          excelRow.createCell(cellIdx++).setCellValue("");
        }
        
        excelRow.createCell(cellIdx++).setCellValue(res.getErrorMessage() != null ? res.getErrorMessage() : "");
        
        // Fill custom column values
        Map<Long, String> cellValues = customValuesByCell.getOrDefault(res.getId(), Map.of());
        for (int c = 0; c < customColumns.size(); c++) {
          TestRunCustomColumn col = customColumns.get(c);
          String cellVal = cellValues.get(col.getId());
          excelRow.createCell(cellIdx++).setCellValue(cellVal != null ? cellVal : "");
        }
        
        excelRow.createCell(cellIdx++).setCellValue(res.getInputData());
        excelRow.createCell(cellIdx++).setCellValue(res.getActualOutput() != null ? res.getActualOutput() : "");
      }
      
      workbook.write(out);
      return out.toByteArray();
    } catch (java.io.IOException ex) {
      throw ResourceException.of(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to build Excel export.");
    }
  }

  private void executeAfterCommit(Runnable task) {
    if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
      org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
          new org.springframework.transaction.support.TransactionSynchronization() {
            @Override
            public void afterCommit() {
              taskExecutor.execute(task);
            }
          });
    } else {
      taskExecutor.execute(task);
    }
  }

  private TestRunJobResponse toJobResponse(TestRunJob job) {
    return new TestRunJobResponse(
        job.getPublicId(),
        testRunRepository.findById(job.getRunId()).map(TestRun::getPublicId).orElse(null),
        job.getType(),
        job.getStatus(),
        job.getProgress(),
        job.getMessage(),
        job.getErrorMessage(),
        job.getCreatedAt(),
        job.getUpdatedAt(),
        job.getCompletedAt()
    );
  }
}
