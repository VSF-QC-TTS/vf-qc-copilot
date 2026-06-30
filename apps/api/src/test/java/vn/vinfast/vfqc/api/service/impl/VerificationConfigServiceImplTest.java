package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import vn.vinfast.vfqc.api.model.ai.AiConfigType;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationFieldAssertion;
import vn.vinfast.vfqc.api.model.verification.VerificationItem;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;
import vn.vinfast.vfqc.api.model.verification.request.FieldAssertionRequest;
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

  @BeforeEach
  void setUp() {
    VerificationConfigMapper mapper = new VerificationConfigMapper(new ObjectMapper());
    service =
        new VerificationConfigServiceImpl(
            projectRepository,
            verificationConfigRepository,
            itemRepository,
            assertionRepository,
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
    when(columnRepository.findBySchemaVersionIdOrderByIdAsc(10L)).thenReturn(columns);
    when(datasetRepository.existsByProjectId(1L)).thenReturn(false);

    AtomicLong itemIds = new AtomicLong(100);
    AtomicLong assertionIds = new AtomicLong(200);

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
    when(itemRepository.findByVerificationConfigIdOrderByIdAsc(99L)).thenAnswer(invocation -> savedItems);
    when(assertionRepository.save(any(VerificationFieldAssertion.class)))
        .thenAnswer(
            invocation -> {
              VerificationFieldAssertion assertion = invocation.getArgument(0);
              assertion.setId(assertionIds.incrementAndGet());
              savedAssertions.add(assertion);
              return assertion;
            });
    when(assertionRepository.findByVerificationItemIdInOrderByIdAsc(anyCollection()))
        .thenAnswer(invocation -> savedAssertions);
  }

  @Test
  void save_CombinedConfig_ReturnsCompactItems() {
    when(verificationConfigRepository.findByProjectId(1L)).thenReturn(Optional.empty());
    when(aiConfigRepository.existsByProjectIdAndType(1L, AiConfigType.JUDGE)).thenReturn(true);

    VerificationConfigResponse response = service.save(projectPublicId, combinedRequest());

    assertThat(response.mode()).isEqualTo(VerificationMode.COMBINED);
    assertThat(response.version()).isEqualTo(1);
    assertThat(response.items()).hasSize(2);
    assertThat(response.items().get(0).fieldAssertion().actualPath()).isEqualTo("$.status");
    assertThat(response.items().get(0).fieldAssertion().expectedColumnKey()).isEqualTo(expectedStatusKey);
    assertThat(response.items().get(1).referenceColumnKeys())
        .containsExactly(expectedAnswerKey, contextKey);
    assertThat(response.items().get(1).rubric()).contains("$response.answer");
  }

  @Test
  void save_LlmJudgeWithoutAiConfig_ThrowsMissingAiConfig() {
    when(aiConfigRepository.existsByProjectIdAndType(1L, AiConfigType.JUDGE)).thenReturn(false);

    assertThatThrownBy(() -> service.save(projectPublicId, combinedRequest()))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MISSING_AI_CONFIG);
  }

  @Test
  void save_InvalidDatasetColumn_ThrowsColumnNotFound() {
    SaveVerificationRequest request =
        new SaveVerificationRequest(
            VerificationMode.FIELD_CHECKS,
            List.of(fieldItem("$.status", CheckOperator.EQUALS, UUID.randomUUID())));

    assertThatThrownBy(() -> service.save(projectPublicId, request))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COLUMN_NOT_FOUND);
  }

  @Test
  void save_FieldItemInLlmMode_ThrowsBadRequest() {
    SaveVerificationRequest request =
        new SaveVerificationRequest(
            VerificationMode.LLM_JUDGE,
            List.of(fieldItem("$.status", CheckOperator.EQUALS, expectedStatusKey)));

    assertThatThrownBy(() -> service.save(projectPublicId, request))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);
  }

  @Test
  void save_LlmJudgeWithoutPrompt_ThrowsBadRequest() {
    when(aiConfigRepository.existsByProjectIdAndType(1L, AiConfigType.JUDGE)).thenReturn(true);

    SaveVerificationRequest request =
        new SaveVerificationRequest(
            VerificationMode.LLM_JUDGE,
            List.of(
                new VerificationItemRequest(
                    null,
                    VerificationItemType.LLM_JUDGE,
                    null,
                    List.of("$.answer"),
                    List.of(expectedAnswerKey),
                    " ")));

    assertThatThrownBy(() -> service.save(projectPublicId, request))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.BAD_REQUEST);
  }

  private SaveVerificationRequest combinedRequest() {
    return new SaveVerificationRequest(
        VerificationMode.COMBINED,
        List.of(
            fieldItem("$.status", CheckOperator.EQUALS, expectedStatusKey),
            new VerificationItemRequest(
                null,
                VerificationItemType.LLM_JUDGE,
                null,
                List.of("$.answer"),
                List.of(expectedAnswerKey, contextKey),
                "Chấm $response.answer theo $dataset.ground_truth và $dataset.context.")));
  }

  private VerificationItemRequest fieldItem(
      String actualPath, CheckOperator operator, UUID expectedColumnKey) {
    return new VerificationItemRequest(
        null,
        VerificationItemType.FIELD_ASSERTION,
        new FieldAssertionRequest(null, actualPath, operator, expectedColumnKey),
        null,
        null,
        null);
  }
}
