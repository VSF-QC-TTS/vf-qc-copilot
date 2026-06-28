package vn.vinfast.vfqc.api.service.runner;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.dataset.DatasetRow;
import vn.vinfast.vfqc.api.model.runner.CancelStatusResponse;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.AiConfigPayload;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.DatasetRowPayload;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.FieldAssertionPayload;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.SchemaColumnPayload;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.TargetConfigPayload;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.VerificationItemPayload;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse.VerificationPayload;
import vn.vinfast.vfqc.api.model.runner.RunnerAssertionResultRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseResultRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseStartedRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerFailureRequest;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.testrun.AssertionResult;
import vn.vinfast.vfqc.api.model.testrun.RunEvent;
import vn.vinfast.vfqc.api.model.testrun.RunEventType;
import vn.vinfast.vfqc.api.model.testrun.TestCaseStatus;
import vn.vinfast.vfqc.api.model.testrun.TestResult;
import vn.vinfast.vfqc.api.model.testrun.TestRun;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationFieldAssertion;
import vn.vinfast.vfqc.api.model.verification.VerificationItem;
import vn.vinfast.vfqc.api.repository.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaAssertionResultRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRowRepository;
import vn.vinfast.vfqc.api.repository.JpaRunEventRepository;
import vn.vinfast.vfqc.api.repository.JpaSchemaColumnRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationFieldAssertionRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationItemRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@Service
@RequiredArgsConstructor
public class InternalRunServiceImpl implements InternalRunService {

  private static final BigDecimal ZERO = new BigDecimal("0.0000");

  private final JpaTestRunRepository testRunRepository;
  private final TargetConfigRepository targetConfigRepository;
  private final JpaAiConfigRepository aiConfigRepository;
  private final JpaDatasetRowRepository datasetRowRepository;
  private final JpaSchemaColumnRepository schemaColumnRepository;
  private final JpaVerificationConfigRepository verificationConfigRepository;
  private final JpaVerificationItemRepository itemRepository;
  private final JpaVerificationFieldAssertionRepository fieldAssertionRepository;
  private final JpaTestResultRepository testResultRepository;
  private final JpaAssertionResultRepository assertionResultRepository;
  private final JpaRunEventRepository runEventRepository;
  private final SecretManager secretManager;
  private final ObjectMapper objectMapper;

  @Override
  @Transactional(readOnly = true)
  public EvalRunRequestResponse getEvalRequest(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    TargetConfig targetConfig =
        targetConfigRepository
            .findById(run.getTargetConfigId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.TARGET_CONFIG_NOT_FOUND));
    VerificationConfig verification =
        verificationConfigRepository
            .findById(run.getVerificationConfigId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.VERIFICATION_CONFIG_NOT_FOUND));

    return new EvalRunRequestResponse(
        run.getPublicId(),
        run.getId(),
        toTargetPayload(run, targetConfig),
        toAiPayload(run),
        datasetRowRepository.findByDatasetVersionIdOrderByRowIndexAsc(run.getDatasetVersionId()).stream()
            .map(row -> new DatasetRowPayload(row.getPublicId(), row.getId(), row.getRowIndex(), row.getData()))
            .toList(),
        schemaColumnRepository.findBySchemaVersionIdOrderByIdAsc(run.getProjectSchemaId()).stream()
            .map(this::toColumnPayload)
            .toList(),
        toVerificationPayload(verification));
  }

  @Override
  @Transactional
  public void markStarted(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    if (run.isTerminal()) {
      return;
    }
    run.setStatus(TestRunStatus.RUNNING);
    run.setStartedAt(run.getStartedAt() == null ? OffsetDateTime.now() : run.getStartedAt());
    recordEvent(run, RunEventType.RUN_STARTED, Map.of("runId", run.getPublicId()));
    testRunRepository.save(run);
  }

  @Override
  @Transactional
  public void markCaseStarted(UUID runPublicId, RunnerCaseStartedRequest request) {
    TestRun run = getRun(runPublicId);
    if (!run.isTerminal()) {
      recordEvent(run, RunEventType.CASE_STARTED, request);
    }
  }

  @Override
  @Transactional
  public void saveCaseResult(UUID runPublicId, RunnerCaseResultRequest request) {
    TestRun run = getRun(runPublicId);
    if (run.isTerminal()) {
      return;
    }
    DatasetRow row =
        datasetRowRepository
            .findByPublicId(request.datasetRowPublicId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_NOT_FOUND));
    TestResult result =
        testResultRepository
            .findByRunIdAndDatasetRowId(run.getId(), row.getId())
            .orElseGet(() -> TestResult.builder().runId(run.getId()).datasetRowId(row.getId()).build());

    result.setCaseIndex(request.caseIndex());
    result.setInputData(jsonPayload(request.inputData()));
    result.setActualOutput(jsonPayload(request.actualOutput()));
    result.setRawTargetResponse(jsonPayload(request.rawTargetResponse()));
    result.setStatus(request.status());
    result.setPassed(Boolean.TRUE.equals(request.passed()));
    result.setScore(request.score() == null ? ZERO : request.score());
    result.setErrorMessage(request.errorMessage());
    result.setLatencyMs(request.latencyMs());

    TestResult saved = testResultRepository.save(result);
    assertionResultRepository.deleteByTestResultId(saved.getId());
    for (RunnerAssertionResultRequest assertion : safeAssertions(request.assertions())) {
      assertionResultRepository.save(toAssertionResult(saved.getId(), assertion));
    }
    recordEvent(
        run,
        request.status() == TestCaseStatus.ERROR ? RunEventType.CASE_FAILED : RunEventType.CASE_COMPLETED,
        Map.of("caseIndex", request.caseIndex(), "status", request.status().name()));
  }

  @Override
  @Transactional
  public void complete(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    if (run.isTerminal()) {
      return;
    }
    aggregateAndFinish(run, TestRunStatus.COMPLETED, null);
    recordEvent(run, RunEventType.RUN_COMPLETED, Map.of("score", run.getScore()));
    testRunRepository.save(run);
  }

  @Override
  @Transactional
  public void fail(UUID runPublicId, RunnerFailureRequest request) {
    TestRun run = getRun(runPublicId);
    if (run.isTerminal()) {
      return;
    }
    aggregateAndFinish(run, TestRunStatus.ERROR, request == null ? null : request.message());
    recordEvent(run, RunEventType.RUN_FAILED, Map.of("error", run.getErrorMessage()));
    testRunRepository.save(run);
  }

  @Override
  @Transactional
  public void cancel(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    if (run.isTerminal()) {
      return;
    }
    aggregateAndFinish(run, TestRunStatus.CANCELLED, null);
    recordEvent(run, RunEventType.RUN_CANCELLED, Map.of("runId", run.getPublicId()));
    testRunRepository.save(run);
  }

  @Override
  @Transactional(readOnly = true)
  public CancelStatusResponse getCancelStatus(UUID runPublicId) {
    TestRun run = getRun(runPublicId);
    return new CancelStatusResponse(Boolean.TRUE.equals(run.getCancellationRequested()) || run.isTerminal());
  }

  private TargetConfigPayload toTargetPayload(TestRun run, TargetConfig targetConfig) {
    return new TargetConfigPayload(
        targetConfig.getMethod(),
        targetConfig.getUrl(),
        targetConfig.getHeaders(),
        targetConfig.getQueryParams(),
        targetConfig.getBodyTemplate(),
        targetConfig.getResponsePath(),
        targetConfig.getTimeoutMs(),
        secretManager.decryptForOwner("TARGET_CONFIG", run.getProjectId()));
  }

  private AiConfigPayload toAiPayload(TestRun run) {
    if (run.getAiConfigId() == null) {
      return null;
    }
    AiConfig aiConfig =
        aiConfigRepository
            .findById(run.getAiConfigId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));
    return new AiConfigPayload(
        aiConfig.getProvider(),
        aiConfig.getBaseUrl(),
        aiConfig.getEvaluationModel(),
        aiConfig.getTemperature(),
        aiConfig.getMaxTokens(),
        aiConfig.getTimeoutMs(),
        aiConfig.getRetryCount(),
        secretManager.decryptForOwner("AI_CONFIG", run.getProjectId()).get("API_KEY"));
  }

  private SchemaColumnPayload toColumnPayload(SchemaColumn column) {
    return new SchemaColumnPayload(column.getPublicId(), column.getColumnName(), column.getDataType(), column.getRole());
  }

  private VerificationPayload toVerificationPayload(VerificationConfig verification) {
    List<VerificationItem> items = itemRepository.findByVerificationConfigIdOrderByIdAsc(verification.getId());
    List<Long> itemIds = items.stream().map(VerificationItem::getId).toList();
    Map<Long, List<VerificationFieldAssertion>> assertions =
        itemIds.isEmpty()
            ? Map.of()
            : fieldAssertionRepository.findByVerificationItemIdInOrderByIdAsc(itemIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(VerificationFieldAssertion::getVerificationItemId));

    return new VerificationPayload(
        verification.getMode(),
        verification.getVersion(),
        items.stream().map(item -> toItemPayload(item, assertions)).toList());
  }

  private VerificationItemPayload toItemPayload(
      VerificationItem item, Map<Long, List<VerificationFieldAssertion>> assertions) {
    VerificationFieldAssertion assertion = assertions.getOrDefault(item.getId(), List.of()).stream().findFirst().orElse(null);
    return new VerificationItemPayload(
        item.getPublicId(),
        item.getId(),
        item.getType(),
        item.getTargetPaths(),
        item.getReferenceColumnKeys(),
        item.getRubric(),
        assertion == null
            ? null
            : new FieldAssertionPayload(assertion.getActualPath(), assertion.getOperator(), assertion.getExpectedColumnKey()));
  }

  private void aggregateAndFinish(TestRun run, TestRunStatus status, String errorMessage) {
    List<TestResult> results = testResultRepository.findByRunIdOrderByCaseIndexAsc(run.getId());
    int passed = (int) results.stream().filter(result -> result.getStatus() == TestCaseStatus.PASSED).count();
    int failed = (int) results.stream().filter(result -> result.getStatus() == TestCaseStatus.FAILED).count();
    int errors = (int) results.stream().filter(result -> result.getStatus() == TestCaseStatus.ERROR).count();
    BigDecimal score =
        results.isEmpty()
            ? ZERO
            : results.stream()
                .map(TestResult::getScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(results.size()), 4, RoundingMode.HALF_UP);

    OffsetDateTime finishedAt = OffsetDateTime.now();
    run.setPassedCases(passed);
    run.setFailedCases(failed);
    run.setErrorCases(errors);
    run.setScore(score);
    run.setStatus(status);
    run.setFinishedAt(finishedAt);
    run.setErrorMessage(errorMessage);
    if (run.getStartedAt() != null) {
      run.setDurationMs(Duration.between(run.getStartedAt(), finishedAt).toMillis());
    }
  }

  private AssertionResult toAssertionResult(Long testResultId, RunnerAssertionResultRequest request) {
    return AssertionResult.builder()
        .testResultId(testResultId)
        .assertionName(request.assertionName())
        .assertionType(request.assertionType())
        .responsePath(request.responsePath())
        .passed(Boolean.TRUE.equals(request.passed()))
        .score(request.score() == null ? ZERO : request.score())
        .reason(request.reason())
        .expectedValue(request.expectedValue())
        .actualValue(request.actualValue())
        .build();
  }

  private List<RunnerAssertionResultRequest> safeAssertions(List<RunnerAssertionResultRequest> assertions) {
    return assertions == null ? List.of() : assertions;
  }

  private String jsonPayload(String value) {
    if (value == null || value.isBlank()) {
      return "{}";
    }
    try {
      objectMapper.readTree(value);
      return value;
    } catch (JsonProcessingException ignored) {
      try {
        return objectMapper.writeValueAsString(value);
      } catch (JsonProcessingException ex) {
        return "\"\"";
      }
    }
  }

  private void recordEvent(TestRun run, RunEventType eventType, Object payload) {
    try {
      runEventRepository.save(
          RunEvent.builder()
              .runId(run.getId())
              .eventType(eventType)
              .payload(objectMapper.writeValueAsString(payload))
              .build());
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Could not serialize run event payload", ex);
    }
  }

  private TestRun getRun(UUID runPublicId) {
    return testRunRepository
        .findByPublicId(runPublicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.TEST_RUN_NOT_FOUND));
  }
}
