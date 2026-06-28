package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.vinfast.vfqc.api.model.dataset.DatasetRow;
import vn.vinfast.vfqc.api.model.dataset.DatasetRowValidationStatus;
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

@ExtendWith(MockitoExtension.class)
class MockRunExecutorTest {

  @Mock private JpaTestRunRepository testRunRepository;
  @Mock private JpaDatasetRowRepository rowRepository;
  @Mock private JpaVerificationItemRepository itemRepository;
  @Mock private JpaVerificationFieldAssertionRepository assertionRepository;
  @Mock private JpaTestResultRepository testResultRepository;
  @Mock private JpaAssertionResultRepository assertionResultRepository;
  @Mock private JpaRunEventRepository runEventRepository;
  @Mock private JpaSchemaColumnRepository schemaColumnRepository;

  private final List<RunEvent> savedEvents = new ArrayList<>();
  private final List<TestResult> savedResults = new ArrayList<>();

  private MockRunExecutor executor;

  @BeforeEach
  void setUp() {
    executor =
        new MockRunExecutor(
            testRunRepository,
            rowRepository,
            itemRepository,
            assertionRepository,
            testResultRepository,
            assertionResultRepository,
            runEventRepository,
            schemaColumnRepository,
            new ObjectMapper());
  }

  @Test
  void execute_FieldChecksAllPass_CompletesRunWithAggregates() {
    UUID expectedColumnKey = UUID.randomUUID();
    TestRun run =
        TestRun.builder()
            .id(101L)
            .projectId(1L)
            .projectSchemaId(22L)
            .datasetVersionId(31L)
            .verificationConfigId(44L)
            .status(TestRunStatus.QUEUED)
            .totalCases(2)
            .cancellationRequested(false)
            .build();

    VerificationItem item =
        VerificationItem.builder()
            .id(70L)
            .verificationConfigId(44L)
            .type(VerificationItemType.FIELD_ASSERTION)
            .build();
    VerificationFieldAssertion assertion =
        VerificationFieldAssertion.builder()
            .id(80L)
            .verificationItemId(70L)
            .actualPath("$.status")
            .operator(CheckOperator.EQUALS)
            .expectedColumnKey(expectedColumnKey)
            .build();

    when(testRunRepository.findById(101L)).thenReturn(Optional.of(run));
    when(rowRepository.findByDatasetVersionIdOrderByRowIndexAsc(31L))
        .thenReturn(
            List.of(
                row(1L, 0, expectedColumnKey, "OK"),
                row(2L, 1, expectedColumnKey, "OK")));
    when(itemRepository.findByVerificationConfigIdOrderByIdAsc(44L)).thenReturn(List.of(item));
    when(assertionRepository.findByVerificationItemIdInOrderByIdAsc(List.of(70L)))
        .thenReturn(List.of(assertion));
    when(schemaColumnRepository.findBySchemaVersionIdOrderByIdAsc(22L))
        .thenReturn(List.of(SchemaColumn.builder().publicId(expectedColumnKey).columnName("expected_status").build()));
    when(testResultRepository.save(any(TestResult.class)))
        .thenAnswer(
            invocation -> {
              TestResult result = invocation.getArgument(0);
              result.setId((long) savedResults.size() + 1);
              savedResults.add(result);
              return result;
            });
    when(assertionResultRepository.save(any(AssertionResult.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    when(runEventRepository.save(any(RunEvent.class)))
        .thenAnswer(
            invocation -> {
              RunEvent event = invocation.getArgument(0);
              savedEvents.add(event);
              return event;
            });

    executor.execute(101L);

    assertThat(run.getStatus()).isEqualTo(TestRunStatus.COMPLETED);
    assertThat(run.getPassedCases()).isEqualTo(2);
    assertThat(run.getFailedCases()).isZero();
    assertThat(run.getScore()).isEqualByComparingTo("1.0000");
    assertThat(savedResults).extracting(TestResult::getStatus).containsExactly(TestCaseStatus.PASSED, TestCaseStatus.PASSED);
    assertThat(savedEvents).extracting(RunEvent::getEventType).contains(RunEventType.RUN_STARTED, RunEventType.RUN_COMPLETED);
    verify(testRunRepository).save(run);
  }

  private DatasetRow row(Long id, int rowIndex, UUID expectedColumnKey, String status) {
    return DatasetRow.builder()
        .id(id)
        .datasetId(30L)
        .datasetVersionId(31L)
        .rowIndex(rowIndex)
        .data("{\"expected_status\":\"" + status + "\",\"status\":\"" + status + "\"}")
        .validationStatus(DatasetRowValidationStatus.VALID)
        .build();
  }
}
