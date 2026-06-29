package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.dataset.Dataset;
import vn.vinfast.vfqc.api.model.dataset.DatasetSource;
import vn.vinfast.vfqc.api.model.dataset.DatasetStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersion;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersionStatus;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.testrun.AssertionResult;
import vn.vinfast.vfqc.api.model.testrun.TestCaseStatus;
import vn.vinfast.vfqc.api.model.testrun.TestResult;
import vn.vinfast.vfqc.api.model.testrun.TestRun;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunResponse;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;
import vn.vinfast.vfqc.api.repository.JpaAssertionResultRepository;
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
import vn.vinfast.vfqc.api.repository.JpaTestRunCustomColumnRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultCustomValueRepository;
import vn.vinfast.vfqc.api.repository.JpaTestResultOverrideRepository;
import vn.vinfast.vfqc.api.repository.JpaTestRunJobRepository;
import java.util.concurrent.Executor;
import org.springframework.transaction.support.TransactionTemplate;
import vn.vinfast.vfqc.api.service.runner.EvalJobPublisher;
import vn.vinfast.vfqc.api.service.runner.EvalRunJobMessage;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@ExtendWith(MockitoExtension.class)
class TestRunServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private UserRepository userRepository;
  @Mock private TargetConfigRepository targetConfigRepository;
  @Mock private JpaAiConfigRepository aiConfigRepository;
  @Mock private JpaProjectSchemaRepository schemaRepository;
  @Mock private JpaDatasetRepository datasetRepository;
  @Mock private JpaDatasetVersionRepository datasetVersionRepository;
  @Mock private JpaVerificationConfigRepository verificationConfigRepository;
  @Mock private JpaTestRunRepository testRunRepository;
  @Mock private EvalJobPublisher evalJobPublisher;
  @Mock private JpaTestResultRepository testResultRepository;
  @Mock private JpaRunEventRepository runEventRepository;
  @Mock private JpaAssertionResultRepository assertionResultRepository;
  @Mock private JpaTestRunCustomColumnRepository testRunCustomColumnRepository;
  @Mock private JpaTestResultCustomValueRepository testResultCustomValueRepository;
  @Mock private JpaTestResultOverrideRepository testResultOverrideRepository;
  @Mock private JpaTestRunJobRepository testRunJobRepository;
  @Mock private Executor taskExecutor;
  @Mock private TransactionTemplate transactionTemplate;

  private TestRunServiceImpl service;
  private UUID projectPublicId;
  private UUID datasetPublicId;

  @BeforeEach
  void setUp() {
    service =
        new TestRunServiceImpl(
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
            testResultRepository,
            runEventRepository,
            assertionResultRepository,
            testRunCustomColumnRepository,
            testResultCustomValueRepository,
            testResultOverrideRepository,
            testRunJobRepository,
            taskExecutor,
            transactionTemplate);

    projectPublicId = UUID.randomUUID();
    datasetPublicId = UUID.randomUUID();
  }

  @Test
  void create_SnapshotsRunnableConfigAndQueuesMockExecution() {
    UUID runPublicId = UUID.randomUUID();
    Dataset dataset = activeDataset();
    DatasetVersion version = activeVersion();

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectPublicId))
        .thenReturn(Optional.of(Project.builder().id(1L).publicId(projectPublicId).build()));
    when(userRepository.findByEmail("qc@example.com"))
        .thenReturn(Optional.of(User.builder().id(9L).email("qc@example.com").build()));
    when(targetConfigRepository.findByProjectId(1L))
        .thenReturn(Optional.of(TargetConfig.builder().id(11L).projectId(1L).version(3).build()));
    when(schemaRepository.findByProjectId(1L))
        .thenReturn(Optional.of(ProjectSchema.builder().id(22L).projectId(1L).version(2).build()));
    when(datasetRepository.findByPublicId(datasetPublicId)).thenReturn(Optional.of(dataset));
    when(datasetVersionRepository.findById(31L)).thenReturn(Optional.of(version));
    when(verificationConfigRepository.findByProjectId(1L))
        .thenReturn(
            Optional.of(
                VerificationConfig.builder()
                    .id(44L)
                    .projectId(1L)
                    .version(5)
                    .mode(VerificationMode.FIELD_CHECKS)
                    .build()));
    when(testRunRepository.save(any(TestRun.class)))
        .thenAnswer(
            invocation -> {
              TestRun run = invocation.getArgument(0);
              run.setId(101L);
              run.setPublicId(runPublicId);
              return run;
            });

    TestRunResponse response =
        service.create(projectPublicId, new CreateTestRunRequest("Smoke run", datasetPublicId), "qc@example.com");

    assertThat(response.publicId()).isEqualTo(runPublicId);
    assertThat(response.status()).isEqualTo(TestRunStatus.QUEUED);
    assertThat(response.name()).isEqualTo("Smoke run");
    assertThat(response.totalCases()).isEqualTo(2);
    assertThat(response.targetConfigVersion()).isEqualTo(3);
    assertThat(response.datasetVersionNumber()).isEqualTo(7);
    assertThat(response.verificationConfigVersion()).isEqualTo(5);
    verify(evalJobPublisher).publish(any(EvalRunJobMessage.class));
  }

  @Test
  void create_WithoutActiveDataset_ThrowsMissingDataset() {
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectPublicId))
        .thenReturn(Optional.of(Project.builder().id(1L).publicId(projectPublicId).build()));
    when(targetConfigRepository.findByProjectId(1L))
        .thenReturn(Optional.of(TargetConfig.builder().id(11L).projectId(1L).version(3).build()));
    when(schemaRepository.findByProjectId(1L))
        .thenReturn(Optional.of(ProjectSchema.builder().id(22L).projectId(1L).version(2).build()));
    when(datasetRepository.findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(1L))
        .thenReturn(List.of());

    assertThatThrownBy(() -> service.create(projectPublicId, new CreateTestRunRequest(null, null), "qc@example.com"))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MISSING_DATASET);
  }

  @Test
  void create_LlmVerificationWithoutAiConfig_ThrowsMissingAiConfig() {
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectPublicId))
        .thenReturn(Optional.of(Project.builder().id(1L).publicId(projectPublicId).build()));
    when(targetConfigRepository.findByProjectId(1L))
        .thenReturn(Optional.of(TargetConfig.builder().id(11L).projectId(1L).version(3).build()));
    when(schemaRepository.findByProjectId(1L))
        .thenReturn(Optional.of(ProjectSchema.builder().id(22L).projectId(1L).version(2).build()));
    when(datasetRepository.findByPublicId(datasetPublicId)).thenReturn(Optional.of(activeDataset()));
    when(datasetVersionRepository.findById(31L)).thenReturn(Optional.of(activeVersion()));
    when(verificationConfigRepository.findByProjectId(1L))
        .thenReturn(
            Optional.of(
                VerificationConfig.builder()
                    .id(44L)
                    .projectId(1L)
                    .version(5)
                    .mode(VerificationMode.LLM_JUDGE)
                    .build()));
    when(aiConfigRepository.findByProjectId(1L)).thenReturn(Optional.empty());

    assertThatThrownBy(
            () -> service.create(projectPublicId, new CreateTestRunRequest(null, datasetPublicId), "qc@example.com"))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MISSING_AI_CONFIG);
  }

  @Test
  void cancel_CompletedRun_DoesNotRequestCancellation() {
    UUID runPublicId = UUID.randomUUID();
    TestRun run =
        TestRun.builder()
            .id(101L)
            .publicId(runPublicId)
            .status(TestRunStatus.COMPLETED)
            .cancellationRequested(false)
            .build();
    when(testRunRepository.findByPublicId(runPublicId)).thenReturn(Optional.of(run));

    TestRunResponse response = service.cancel(runPublicId);

    assertThat(response.status()).isEqualTo(TestRunStatus.COMPLETED);
    assertThat(response.cancellationRequested()).isFalse();
    verify(testRunRepository, never()).save(any(TestRun.class));
  }

  @Test
  void listResults_IncludesAssertionDetails() {
    UUID runPublicId = UUID.randomUUID();
    UUID resultPublicId = UUID.randomUUID();
    UUID assertionPublicId = UUID.randomUUID();
    TestRun run =
        TestRun.builder()
            .id(101L)
            .publicId(runPublicId)
            .status(TestRunStatus.COMPLETED)
            .build();
    TestResult result =
        TestResult.builder()
            .id(201L)
            .publicId(resultPublicId)
            .runId(101L)
            .datasetRowId(301L)
            .caseIndex(1)
            .inputData("{\"question\":\"ping\"}")
            .actualOutput("{\"answer\":\"pong\"}")
            .status(TestCaseStatus.FAILED)
            .passed(false)
            .score(BigDecimal.ZERO)
            .latencyMs(123L)
            .build();
    AssertionResult assertion =
        AssertionResult.builder()
            .publicId(assertionPublicId)
            .testResultId(201L)
            .assertionName("$.answer equals expected_answer")
            .assertionType("FIELD_CHECK")
            .responsePath("$.answer")
            .passed(false)
            .score(BigDecimal.ZERO)
            .reason("Expected ping but got pong")
            .expectedValue("ping")
            .actualValue("pong")
            .build();
    when(testRunRepository.findByPublicId(runPublicId)).thenReturn(Optional.of(run));
    when(testResultRepository.findByRunIdOrderByCaseIndexAsc(101L, PageRequest.of(0, 50)))
        .thenReturn(new PageImpl<>(List.of(result), PageRequest.of(0, 50), 1));
    when(assertionResultRepository.findByTestResultIdInOrderByTestResultIdAscIdAsc(List.of(201L)))
        .thenReturn(List.of(assertion));

    TestResultResponse response = service.listResults(runPublicId, 0, 50).content().getFirst();

    assertThat(response.assertions()).hasSize(1);
    assertThat(response.assertions().getFirst().publicId()).isEqualTo(assertionPublicId);
    assertThat(response.assertions().getFirst().responsePath()).isEqualTo("$.answer");
    assertThat(response.assertions().getFirst().reason()).isEqualTo("Expected ping but got pong");
  }

  private Dataset activeDataset() {
    return Dataset.builder()
        .id(30L)
        .publicId(datasetPublicId)
        .projectId(1L)
        .schemaVersionId(22L)
        .activeVersionId(31L)
        .status(DatasetStatus.ACTIVE)
        .source(DatasetSource.MANUAL)
        .createdBy(9L)
        .build();
  }

  private DatasetVersion activeVersion() {
    return DatasetVersion.builder()
        .id(31L)
        .datasetId(30L)
        .schemaVersionId(22L)
        .versionNumber(7)
        .status(DatasetVersionStatus.ACTIVE)
        .source(DatasetSource.MANUAL)
        .totalRows(2)
        .validRows(2)
        .invalidRows(0)
        .createdBy(9L)
        .build();
  }

  @SuppressWarnings("unused")
  private AiConfig aiConfig() {
    return AiConfig.builder().id(55L).projectId(1L).version(1).build();
  }
}
