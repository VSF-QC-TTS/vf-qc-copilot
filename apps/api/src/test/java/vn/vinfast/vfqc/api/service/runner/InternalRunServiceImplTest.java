package vn.vinfast.vfqc.api.service.runner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
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
import vn.vinfast.vfqc.api.model.runner.RunnerAssertionResultRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseResultRequest;
import vn.vinfast.vfqc.api.model.testrun.AssertionResult;
import vn.vinfast.vfqc.api.model.testrun.RunEvent;
import vn.vinfast.vfqc.api.model.testrun.TestCaseStatus;
import vn.vinfast.vfqc.api.model.testrun.TestResult;
import vn.vinfast.vfqc.api.model.testrun.TestRun;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;
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

@ExtendWith(MockitoExtension.class)
class InternalRunServiceImplTest {

  @Mock private JpaTestRunRepository testRunRepository;
  @Mock private TargetConfigRepository targetConfigRepository;
  @Mock private JpaAiConfigRepository aiConfigRepository;
  @Mock private JpaDatasetRowRepository datasetRowRepository;
  @Mock private JpaSchemaColumnRepository schemaColumnRepository;
  @Mock private JpaVerificationConfigRepository verificationConfigRepository;
  @Mock private JpaVerificationItemRepository itemRepository;
  @Mock private JpaVerificationFieldAssertionRepository fieldAssertionRepository;
  @Mock private JpaTestResultRepository testResultRepository;
  @Mock private JpaAssertionResultRepository assertionResultRepository;
  @Mock private JpaRunEventRepository runEventRepository;
  @Mock private SecretManager secretManager;

  private InternalRunServiceImpl service;
  private final List<TestResult> savedResults = new ArrayList<>();

  @BeforeEach
  void setUp() {
    service =
        new InternalRunServiceImpl(
            testRunRepository,
            targetConfigRepository,
            aiConfigRepository,
            datasetRowRepository,
            schemaColumnRepository,
            verificationConfigRepository,
            itemRepository,
            fieldAssertionRepository,
            testResultRepository,
            assertionResultRepository,
            runEventRepository,
            secretManager,
            new ObjectMapper());
  }

  @Test
  void saveCaseResultThenComplete_AggregatesRunFromPersistedResults() {
    UUID runPublicId = UUID.randomUUID();
    UUID rowPublicId = UUID.randomUUID();
    TestRun run =
        TestRun.builder()
            .id(10L)
            .publicId(runPublicId)
            .status(TestRunStatus.RUNNING)
            .startedAt(OffsetDateTime.now().minusSeconds(1))
            .build();
    DatasetRow row = DatasetRow.builder().id(20L).publicId(rowPublicId).build();

    when(testRunRepository.findByPublicId(runPublicId)).thenReturn(Optional.of(run));
    when(datasetRowRepository.findByPublicId(rowPublicId)).thenReturn(Optional.of(row));
    when(testResultRepository.findByRunIdAndDatasetRowId(10L, 20L)).thenReturn(Optional.empty());
    when(testResultRepository.save(any(TestResult.class)))
        .thenAnswer(
            invocation -> {
              TestResult result = invocation.getArgument(0);
              result.setId(30L);
              savedResults.add(result);
              return result;
            });
    when(assertionResultRepository.save(any(AssertionResult.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    when(runEventRepository.save(any(RunEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(testResultRepository.findByRunIdOrderByCaseIndexAsc(10L)).thenReturn(savedResults);

    service.saveCaseResult(
        runPublicId,
        new RunnerCaseResultRequest(
            rowPublicId,
            0,
            "{\"input\":\"hi\"}",
            "{\"answer\":\"ok\"}",
            TestCaseStatus.PASSED,
            true,
            BigDecimal.ONE,
            null,
            42L,
            "{\"answer\":\"ok\"}",
            List.of(
                new RunnerAssertionResultRequest(
                    "EQUALS", "FIELD_ASSERTION", "$.answer", true, BigDecimal.ONE, "ok", "ok", "ok"))));
    service.complete(runPublicId);

    assertThat(run.getStatus()).isEqualTo(TestRunStatus.COMPLETED);
    assertThat(run.getPassedCases()).isEqualTo(1);
    assertThat(run.getFailedCases()).isZero();
    assertThat(run.getScore()).isEqualByComparingTo("1.0000");
  }
}
