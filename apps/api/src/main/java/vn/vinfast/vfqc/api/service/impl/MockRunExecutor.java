package vn.vinfast.vfqc.api.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.dataset.DatasetRow;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;
import vn.vinfast.vfqc.api.model.testrun.AssertionResult;
import vn.vinfast.vfqc.api.model.testrun.RunEvent;
import vn.vinfast.vfqc.api.model.testrun.RunEventType;
import vn.vinfast.vfqc.api.model.testrun.TestCaseStatus;
import vn.vinfast.vfqc.api.model.testrun.TestResult;
import vn.vinfast.vfqc.api.model.testrun.TestRun;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.VerificationFieldAssertion;
import vn.vinfast.vfqc.api.model.verification.VerificationItem;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;
import vn.vinfast.vfqc.api.repository.JpaAssertionResultRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRowRepository;
import vn.vinfast.vfqc.api.repository.JpaRunEventRepository;
import vn.vinfast.vfqc.api.repository.JpaSchemaColumnRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationFieldAssertionRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationItemRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockRunExecutor {

  private static final BigDecimal ONE = new BigDecimal("1.0000");
  private static final BigDecimal ZERO = new BigDecimal("0.0000");

  private final JpaTestRunRepository testRunRepository;
  private final JpaDatasetRowRepository rowRepository;
  private final JpaVerificationItemRepository itemRepository;
  private final JpaVerificationFieldAssertionRepository assertionRepository;
  private final JpaTestResultRepository testResultRepository;
  private final JpaAssertionResultRepository assertionResultRepository;
  private final JpaRunEventRepository runEventRepository;
  private final JpaSchemaColumnRepository schemaColumnRepository;
  private final ObjectMapper objectMapper;

  @Transactional
  public void execute(Long runId) {
    TestRun run = testRunRepository.findById(runId).orElse(null);
    if (run == null || run.isTerminal()) {
      return;
    }

    OffsetDateTime startedAt = OffsetDateTime.now();
    run.setStatus(TestRunStatus.RUNNING);
    run.setStartedAt(startedAt);
    recordEvent(run, RunEventType.RUN_STARTED, Map.of("runId", run.getPublicId()));

    try {
      List<DatasetRow> rows = rowRepository.findByDatasetVersionIdOrderByRowIndexAsc(run.getDatasetVersionId());
      List<VerificationItem> items =
          itemRepository.findByVerificationConfigIdOrderByIdAsc(run.getVerificationConfigId());
      List<VerificationFieldAssertion> fieldAssertions = loadFieldAssertions(items);
      Map<UUID, String> columnNamesByKey = loadColumnNames(run.getProjectSchemaId());

      int passed = 0;
      int failed = 0;
      int errors = 0;
      BigDecimal totalScore = BigDecimal.ZERO;

      for (DatasetRow row : rows) {
        if (isCancellationRequested(run.getId())) {
          markCancelled(run, startedAt, passed, failed, errors, totalScore, rows.size());
          return;
        }

        recordEvent(run, RunEventType.CASE_STARTED, Map.of("caseIndex", row.getRowIndex()));
        CaseEvaluation evaluation = evaluateRow(row, fieldAssertions, columnNamesByKey);
        TestResult result = saveTestResult(run, row, evaluation);
        saveAssertionResults(result, evaluation.assertions());

        if (evaluation.status() == TestCaseStatus.PASSED) {
          passed++;
        } else if (evaluation.status() == TestCaseStatus.FAILED) {
          failed++;
        } else {
          errors++;
        }
        totalScore = totalScore.add(evaluation.score());
        recordEvent(
            run,
            RunEventType.CASE_COMPLETED,
            Map.of("caseIndex", row.getRowIndex(), "status", evaluation.status().name()));
      }

      finishCompleted(run, startedAt, passed, failed, errors, totalScore, rows.size());
    } catch (Exception ex) {
      log.warn("Mock run {} failed", runId, ex);
      markError(run, startedAt, ex);
    }
  }

  private List<VerificationFieldAssertion> loadFieldAssertions(List<VerificationItem> items) {
    List<Long> itemIds =
        items.stream()
            .filter(item -> item.getType() == VerificationItemType.FIELD_ASSERTION)
            .map(VerificationItem::getId)
            .toList();
    if (itemIds.isEmpty()) {
      return List.of();
    }
    return assertionRepository.findByVerificationItemIdInOrderByIdAsc(itemIds);
  }

  private Map<UUID, String> loadColumnNames(Long schemaVersionId) {
    List<SchemaColumn> columns =
        Optional.ofNullable(schemaColumnRepository.findBySchemaVersionIdOrderByIdAsc(schemaVersionId))
            .orElse(List.of());
    Map<UUID, String> columnNames = new HashMap<>();
    for (SchemaColumn column : columns) {
      columnNames.put(column.getPublicId(), column.getColumnName());
    }
    return columnNames;
  }

  private CaseEvaluation evaluateRow(
      DatasetRow row,
      List<VerificationFieldAssertion> fieldAssertions,
      Map<UUID, String> columnNamesByKey) {
    try {
      Map<String, Object> input = readObject(row.getData());
      String actualOutput = objectMapper.writeValueAsString(input);

      if (fieldAssertions.isEmpty()) {
        return new CaseEvaluation(TestCaseStatus.PASSED, ONE, actualOutput, List.of());
      }

      List<AssertionEvaluation> assertions =
          fieldAssertions.stream()
              .map(assertion -> evaluateAssertion(assertion, input, columnNamesByKey))
              .toList();
      long passedCount = assertions.stream().filter(AssertionEvaluation::passed).count();
      BigDecimal score =
          BigDecimal.valueOf(passedCount)
              .divide(BigDecimal.valueOf(assertions.size()), 4, RoundingMode.HALF_UP);
      TestCaseStatus status = passedCount == assertions.size() ? TestCaseStatus.PASSED : TestCaseStatus.FAILED;
      return new CaseEvaluation(status, score, actualOutput, assertions);
    } catch (Exception ex) {
      return new CaseEvaluation(TestCaseStatus.ERROR, ZERO, "{}", List.of());
    }
  }

  private AssertionEvaluation evaluateAssertion(
      VerificationFieldAssertion assertion,
      Map<String, Object> input,
      Map<UUID, String> columnNamesByKey) {
    Object actual = readPath(input, assertion.getActualPath());
    Object expected = readExpected(input, assertion.getExpectedColumnKey(), columnNamesByKey);
    boolean passed = compare(assertion.getOperator(), actual, expected);
    return new AssertionEvaluation(
        assertion,
        passed,
        passed ? ONE : ZERO,
        Objects.toString(expected, null),
        Objects.toString(actual, null),
        passed ? "Matched mock output" : "Mock output did not match expected value");
  }

  private Object readExpected(
      Map<String, Object> input, UUID expectedColumnKey, Map<UUID, String> columnNamesByKey) {
    if (expectedColumnKey == null) {
      return null;
    }
    Object uuidKeyedValue = input.get(expectedColumnKey.toString());
    if (uuidKeyedValue != null) {
      return uuidKeyedValue;
    }
    String columnName = columnNamesByKey.get(expectedColumnKey);
    return columnName == null ? null : input.get(columnName);
  }

  private boolean compare(CheckOperator operator, Object actual, Object expected) {
    String actualText = Objects.toString(actual, "");
    String expectedText = Objects.toString(expected, "");
    return switch (operator) {
      case EQUALS -> actualText.equals(expectedText);
      case NOT_EQUALS -> !actualText.equals(expectedText);
      case CONTAINS -> actualText.contains(expectedText);
      case NOT_CONTAINS -> !actualText.contains(expectedText);
      case REGEX -> actualText.matches(expectedText);
      case GREATER_THAN -> toDouble(actual) > toDouble(expected);
      case GREATER_THAN_OR_EQUALS -> toDouble(actual) >= toDouble(expected);
      case LESS_THAN -> toDouble(actual) < toDouble(expected);
      case LESS_THAN_OR_EQUALS -> toDouble(actual) <= toDouble(expected);
    };
  }

  private double toDouble(Object value) {
    return Double.parseDouble(Objects.toString(value, "0"));
  }

  private Object readPath(Map<String, Object> input, String path) {
    if (path == null || !path.startsWith("$.")) {
      return null;
    }
    return input.get(path.substring(2));
  }

  private Map<String, Object> readObject(String json) throws JsonProcessingException {
    return objectMapper.readValue(json, new TypeReference<>() {});
  }

  private TestResult saveTestResult(TestRun run, DatasetRow row, CaseEvaluation evaluation) {
    return testResultRepository.save(
        TestResult.builder()
            .runId(run.getId())
            .datasetRowId(row.getId())
            .caseIndex(row.getRowIndex())
            .inputData(row.getData())
            .actualOutput(evaluation.actualOutput())
            .rawTargetResponse(evaluation.actualOutput())
            .status(evaluation.status())
            .passed(evaluation.status() == TestCaseStatus.PASSED)
            .score(evaluation.score())
            .latencyMs(0L)
            .build());
  }

  private void saveAssertionResults(TestResult result, List<AssertionEvaluation> assertions) {
    for (AssertionEvaluation assertion : assertions) {
      assertionResultRepository.save(
          AssertionResult.builder()
              .testResultId(result.getId())
              .assertionName(assertion.assertion().getOperator().name())
              .assertionType(VerificationItemType.FIELD_ASSERTION.name())
              .responsePath(assertion.assertion().getActualPath())
              .passed(assertion.passed())
              .score(assertion.score())
              .expectedValue(assertion.expectedValue())
              .actualValue(assertion.actualValue())
              .reason(assertion.reason())
              .build());
    }
  }

  private boolean isCancellationRequested(Long runId) {
    return testRunRepository.findById(runId).map(TestRun::getCancellationRequested).orElse(true);
  }

  private void finishCompleted(
      TestRun run,
      OffsetDateTime startedAt,
      int passed,
      int failed,
      int errors,
      BigDecimal totalScore,
      int totalCases) {
    run.setPassedCases(passed);
    run.setFailedCases(failed);
    run.setErrorCases(errors);
    run.setScore(average(totalScore, totalCases));
    run.setStatus(TestRunStatus.COMPLETED);
    finish(run, startedAt);
    recordEvent(run, RunEventType.RUN_COMPLETED, Map.of("score", run.getScore()));
    testRunRepository.save(run);
  }

  private void markCancelled(
      TestRun run,
      OffsetDateTime startedAt,
      int passed,
      int failed,
      int errors,
      BigDecimal totalScore,
      int totalCases) {
    run.setPassedCases(passed);
    run.setFailedCases(failed);
    run.setErrorCases(errors);
    run.setScore(average(totalScore, totalCases));
    run.setStatus(TestRunStatus.CANCELLED);
    finish(run, startedAt);
    recordEvent(run, RunEventType.RUN_CANCELLED, Map.of("processedCases", passed + failed + errors));
    testRunRepository.save(run);
  }

  private void markError(TestRun run, OffsetDateTime startedAt, Exception ex) {
    run.setStatus(TestRunStatus.ERROR);
    run.setErrorMessage(ex.getMessage());
    finish(run, startedAt);
    recordEvent(run, RunEventType.RUN_FAILED, Map.of("error", Objects.toString(ex.getMessage(), "unknown")));
    testRunRepository.save(run);
  }

  private BigDecimal average(BigDecimal totalScore, int totalCases) {
    if (totalCases <= 0) {
      return ZERO;
    }
    return totalScore.divide(BigDecimal.valueOf(totalCases), 4, RoundingMode.HALF_UP);
  }

  private void finish(TestRun run, OffsetDateTime startedAt) {
    OffsetDateTime finishedAt = OffsetDateTime.now();
    run.setFinishedAt(finishedAt);
    run.setDurationMs(Duration.between(startedAt, finishedAt).toMillis());
  }

  private void recordEvent(TestRun run, RunEventType eventType, Map<String, ?> payload) {
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

  private record CaseEvaluation(
      TestCaseStatus status,
      BigDecimal score,
      String actualOutput,
      List<AssertionEvaluation> assertions) {}

  private record AssertionEvaluation(
      VerificationFieldAssertion assertion,
      boolean passed,
      BigDecimal score,
      String expectedValue,
      String actualValue,
      String reason) {}
}
