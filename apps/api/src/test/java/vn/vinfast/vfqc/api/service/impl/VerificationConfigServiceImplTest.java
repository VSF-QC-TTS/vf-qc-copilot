package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import vn.vinfast.vfqc.api.mapper.VerificationConfigMapper;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.ExpectedSource;
import vn.vinfast.vfqc.api.model.verification.FieldAggregation;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationFieldAssertion;
import vn.vinfast.vfqc.api.model.verification.VerificationItem;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;
import vn.vinfast.vfqc.api.model.verification.VerificationLlmCriterion;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;
import vn.vinfast.vfqc.api.model.verification.request.ExpectedValueRequest;
import vn.vinfast.vfqc.api.model.verification.request.FieldAssertionRequest;
import vn.vinfast.vfqc.api.model.verification.request.LlmCriterionRequest;
import vn.vinfast.vfqc.api.model.verification.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.model.verification.request.VerificationItemRequest;
import vn.vinfast.vfqc.api.model.verification.response.VerificationConfigResponse;
import vn.vinfast.vfqc.api.repository.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRepository;
import vn.vinfast.vfqc.api.repository.JpaProjectSchemaRepository;
import vn.vinfast.vfqc.api.repository.JpaSchemaColumnRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationFieldAssertionRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationItemRepository;
import vn.vinfast.vfqc.api.repository.JpaVerificationLlmCriterionRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VerificationConfigServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private JpaVerificationConfigRepository verificationConfigRepository;
  @Mock private JpaVerificationItemRepository itemRepository;
  @Mock private JpaVerificationFieldAssertionRepository assertionRepository;
  @Mock private JpaVerificationLlmCriterionRepository criterionRepository;
  @Mock private TargetConfigRepository targetConfigRepository;
  @Mock private JpaAiConfigRepository aiConfigRepository;
  @Mock private JpaDatasetRepository datasetRepository;
  @Mock private JpaProjectSchemaRepository schemaRepository;
  @Mock private JpaSchemaColumnRepository columnRepository;

  private VerificationConfigServiceImpl service;
  private UUID projectPublicId;
  private UUID expectedStatusKey;
  private UUID expectedAnswerKey;
  private UUID contextKey;

  private final List<VerificationItem> savedItems = new ArrayList<>();
  private final List<VerificationFieldAssertion> savedAssertions = new ArrayList<>();
  private final List<VerificationLlmCriterion> savedCriteria = new ArrayList<>();

  @BeforeEach
  void setUp() {
    VerificationConfigMapper mapper = new VerificationConfigMapper(new ObjectMapper());
    service =
        new VerificationConfigServiceImpl(
            projectRepository,
            verificationConfigRepository,
            itemRepository,
            assertionRepository,
            criterionRepository,
            targetConfigRepository,
            aiConfigRepository,
            datasetRepository,
            schemaRepository,
            columnRepository,
            mapper);

    projectPublicId = UUID.randomUUID();
    expectedStatusKey = UUID.randomUUID();
    expectedAnswerKey = UUID.randomUUID();
    contextKey = UUID.randomUUID();

    Project project = Project.builder().id(1L).publicId(projectPublicId).build();
    ProjectSchema schema = ProjectSchema.builder().id(10L).projectId(1L).version(1).build();
    List<SchemaColumn> columns =
        List.of(
            SchemaColumn.builder().id(11L).schemaVersionId(10L).publicId(expectedStatusKey).build(),
            SchemaColumn.builder().id(12L).schemaVersionId(10L).publicId(expectedAnswerKey).build(),
            SchemaColumn.builder().id(13L).schemaVersionId(10L).publicId(contextKey).build());

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectPublicId))
        .thenReturn(Optional.of(project));
    when(targetConfigRepository.existsByProjectId(1L)).thenReturn(true);
    when(schemaRepository.findByProjectId(1L)).thenReturn(Optional.of(schema));
    when(columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(10L)).thenReturn(columns);
    when(datasetRepository.existsByProjectId(1L)).thenReturn(false);

    AtomicLong itemIds = new AtomicLong(100);
    AtomicLong assertionIds = new AtomicLong(200);
    AtomicLong criterionIds = new AtomicLong(300);

    when(verificationConfigRepository.save(any(VerificationConfig.class)))
        .thenAnswer(
            invocation -> {
              VerificationConfig config = invocation.getArgument(0);
              config.setId(99L);
              return config;
            });
    when(itemRepository.save(any(VerificationItem.class)))
        .thenAnswer(
            invocation -> {
              VerificationItem item = invocation.getArgument(0);
              item.setId(itemIds.incrementAndGet());
              savedItems.add(item);
              return item;
            });
    when(itemRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(99L))
        .thenAnswer(invocation -> savedItems);
    when(assertionRepository.save(any(VerificationFieldAssertion.class)))
        .thenAnswer(
            invocation -> {
              VerificationFieldAssertion assertion = invocation.getArgument(0);
              assertion.setId(assertionIds.incrementAndGet());
              savedAssertions.add(assertion);
              return assertion;
            });
    when(assertionRepository.saveAll(anyCollection()))
        .thenAnswer(
            invocation -> {
              Iterable<VerificationFieldAssertion> assertions = invocation.getArgument(0);
              assertions.forEach(
                  assertion -> {
                    assertion.setId(assertionIds.incrementAndGet());
                    savedAssertions.add(assertion);
                  });
              return savedAssertions;
            });
    when(criterionRepository.saveAll(anyCollection()))
        .thenAnswer(
            invocation -> {
              Iterable<VerificationLlmCriterion> criteria = invocation.getArgument(0);
              criteria.forEach(
                  criterion -> {
                    criterion.setId(criterionIds.incrementAndGet());
                    savedCriteria.add(criterion);
                  });
              return savedCriteria;
            });
    when(assertionRepository.findByVerificationItemIdInOrderByDisplayOrderAsc(anyCollection()))
        .thenAnswer(invocation -> savedAssertions);
    when(criterionRepository.findByVerificationItemIdInOrderByDisplayOrderAsc(anyCollection()))
        .thenAnswer(invocation -> savedCriteria);
  }

  @Test
  void save_CombinedConfig_ReturnsItemsWithGroupChildrenAndCriteria() {
    when(verificationConfigRepository.findByProjectId(1L)).thenReturn(Optional.empty());
    when(aiConfigRepository.existsByProjectId(1L)).thenReturn(true);

    VerificationConfigResponse response = service.save(projectPublicId, combinedRequest());

    assertThat(response.mode()).isEqualTo(VerificationMode.COMBINED);
    assertThat(response.threshold()).isEqualByComparingTo("0.8");
    assertThat(response.version()).isEqualTo(1);
    assertThat(response.items()).hasSize(3);
    assertThat(response.items().get(0).fieldAssertion().actualPath()).isEqualTo("$.status");
    assertThat(response.items().get(1).fieldAssertions()).hasSize(2);
    assertThat(response.items().get(2).criteria()).hasSize(2);
    assertThat(response.items().get(2).referenceColumnKeys())
        .containsExactly(expectedAnswerKey, contextKey);
  }

  @Test
  void save_LlmJudgeWithoutAiConfig_ThrowsMissingAiConfig() {
    when(aiConfigRepository.existsByProjectId(1L)).thenReturn(false);

    assertThatThrownBy(() -> service.save(projectPublicId, combinedRequest()))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MISSING_AI_CONFIG);
  }

  @Test
  void save_InvalidDatasetColumn_ThrowsColumnNotFound() {
    SaveVerificationRequest request =
        new SaveVerificationRequest(
            VerificationMode.FIELD_CHECKS,
            new BigDecimal("0.8"),
            List.of(
                fieldItem(
                    "Bad column",
                    "$.status",
                    CheckOperator.EQUALS,
                    new ExpectedValueRequest(ExpectedSource.DATASET_COLUMN, UUID.randomUUID(), null, null),
                    false,
                    0)));

    assertThatThrownBy(() -> service.save(projectPublicId, request))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COLUMN_NOT_FOUND);
  }

  @Test
  void save_AtLeastGroupWithTooHighMinPass_ThrowsBadRequest() {
    SaveVerificationRequest request =
        new SaveVerificationRequest(
            VerificationMode.FIELD_CHECKS,
            new BigDecimal("0.8"),
            List.of(
                groupItem(
                    FieldAggregation.AT_LEAST,
                    3,
                    List.of(
                        assertion(
                            "$.title",
                            CheckOperator.CONTAINS,
                            new ExpectedValueRequest(
                                ExpectedSource.DATASET_COLUMN, expectedAnswerKey, null, null),
                            0),
                        assertion(
                            "$.summary",
                            CheckOperator.CONTAINS,
                            new ExpectedValueRequest(
                                ExpectedSource.DATASET_COLUMN, contextKey, null, null),
                            1)))));

    assertThatThrownBy(() -> service.save(projectPublicId, request))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);
  }

  @Test
  void save_StaticExpectedValue_ThrowsBadRequest() {
    SaveVerificationRequest request =
        new SaveVerificationRequest(
            VerificationMode.FIELD_CHECKS,
            new BigDecimal("0.8"),
            List.of(
                fieldItem(
                    "Static value is no longer allowed",
                    "$.status",
                    CheckOperator.EQUALS,
                    new ExpectedValueRequest(ExpectedSource.STATIC_VALUE, null, "ACTIVE", null),
                    false,
                    0)));

    assertThatThrownBy(() -> service.save(projectPublicId, request))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);
  }

  private SaveVerificationRequest combinedRequest() {
    return new SaveVerificationRequest(
        VerificationMode.COMBINED,
        new BigDecimal("0.8"),
        List.of(
            fieldItem(
                "Status đúng",
                "$.status",
                CheckOperator.EQUALS,
                new ExpectedValueRequest(ExpectedSource.DATASET_COLUMN, expectedStatusKey, null, null),
                true,
                0),
            groupItem(
                FieldAggregation.ALL,
                null,
                List.of(
                    assertion(
                        "$.title",
                        CheckOperator.CONTAINS,
                        new ExpectedValueRequest(ExpectedSource.DATASET_COLUMN, expectedAnswerKey, null, null),
                        0),
                    assertion(
                        "$.summary",
                        CheckOperator.CONTAINS,
                        new ExpectedValueRequest(ExpectedSource.DATASET_COLUMN, contextKey, null, null),
                        1))),
            llmItem()));
  }

  private VerificationItemRequest fieldItem(
      String name,
      String actualPath,
      CheckOperator operator,
      ExpectedValueRequest expected,
      boolean critical,
      int order) {
    return new VerificationItemRequest(
        null,
        VerificationItemType.FIELD_ASSERTION,
        name,
        true,
        critical,
        BigDecimal.ONE,
        null,
        order,
        null,
        null,
        assertion(actualPath, operator, expected, 0),
        null,
        null,
        null,
        null,
        null);
  }

  private VerificationItemRequest groupItem(
      FieldAggregation aggregation, Integer minPassCount, List<FieldAssertionRequest> assertions) {
    return new VerificationItemRequest(
        null,
        VerificationItemType.FIELD_ASSERTION_GROUP,
        "Structured response",
        true,
        false,
        new BigDecimal("2.0"),
        null,
        1,
        aggregation,
        minPassCount,
        null,
        assertions,
        null,
        null,
        null,
        null);
  }

  private VerificationItemRequest llmItem() {
    return new VerificationItemRequest(
        null,
        VerificationItemType.LLM_JUDGE,
        "Answer quality",
        true,
        false,
        new BigDecimal("3.0"),
        new BigDecimal("0.7"),
        2,
        null,
        null,
        null,
        null,
        List.of("$.answer"),
        List.of(expectedAnswerKey, contextKey),
        "Chấm câu trả lời theo expected answer và context.",
        List.of(
            new LlmCriterionRequest(
                null, "Correctness", "Đúng ý expected answer.", BigDecimal.ONE, true, 0),
            new LlmCriterionRequest(
                null, "Groundedness", "Không bịa ngoài context.", BigDecimal.ONE, true, 1)));
  }

  private FieldAssertionRequest assertion(
      String actualPath, CheckOperator operator, ExpectedValueRequest expected, int order) {
    return new FieldAssertionRequest(
        null, actualPath, operator, expected, null, BigDecimal.ONE, true, order);
  }
}
