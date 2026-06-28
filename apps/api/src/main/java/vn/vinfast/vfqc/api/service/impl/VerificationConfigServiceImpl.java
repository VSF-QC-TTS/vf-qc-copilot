package vn.vinfast.vfqc.api.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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
import vn.vinfast.vfqc.api.service.VerificationConfigService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationConfigServiceImpl implements VerificationConfigService {

  private final ProjectRepository projectRepository;
  private final JpaVerificationConfigRepository verificationConfigRepository;
  private final JpaVerificationItemRepository itemRepository;
  private final JpaVerificationFieldAssertionRepository assertionRepository;
  private final JpaVerificationLlmCriterionRepository criterionRepository;
  private final TargetConfigRepository targetConfigRepository;
  private final JpaAiConfigRepository aiConfigRepository;
  private final JpaDatasetRepository datasetRepository;
  private final JpaProjectSchemaRepository schemaRepository;
  private final JpaSchemaColumnRepository columnRepository;
  private final VerificationConfigMapper mapper;

  @Override
  @Transactional(readOnly = true)
  public VerificationConfigResponse get(UUID projectPublicId) {
    log.debug("Fetching verification config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);

    VerificationConfig config =
        verificationConfigRepository
            .findByProjectId(project.getId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.VERIFICATION_CONFIG_NOT_FOUND));

    List<VerificationItem> items =
        itemRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(config.getId());
    return buildResponse(config, items);
  }

  @Override
  @Transactional
  public VerificationConfigResponse save(UUID projectPublicId, SaveVerificationRequest request) {
    log.info("Saving verification config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    Long projectId = project.getId();

    ProjectSchema schema = validatePreconditions(projectId, request);
    Set<UUID> validColumnKeys =
        columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId()).stream()
            .map(SchemaColumn::getPublicId)
            .collect(Collectors.toSet());
    validateItems(request, validColumnKeys);

    VerificationConfig config =
        verificationConfigRepository
            .findByProjectId(projectId)
            .orElseGet(() -> VerificationConfig.builder().projectId(projectId).version(0).build());

    config.setMode(request.mode());
    config.setThreshold(request.threshold());
    config.setVersion(config.getVersion() + 1);
    config = verificationConfigRepository.save(config);

    List<VerificationItem> items = recreateItems(config.getId(), request.items());
    return buildResponse(config, items);
  }

  private ProjectSchema validatePreconditions(Long projectId, SaveVerificationRequest request) {
    if (!targetConfigRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_TARGET_CONFIG);
    }
    // Kept as a lightweight hook for upcoming dataset run preconditions.
    datasetRepository.existsByProjectId(projectId);

    ProjectSchema schema =
        schemaRepository
            .findByProjectId(projectId)
            .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_DATASET_SCHEMA));

    if (requiresAi(request) && !aiConfigRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_AI_CONFIG);
    }
    return schema;
  }

  private boolean requiresAi(SaveVerificationRequest request) {
    if (request.items() == null) {
      return false;
    }
    return request.items().stream()
        .anyMatch(item -> item.enabled() && item.type() == VerificationItemType.LLM_JUDGE);
  }

  private void validateItems(SaveVerificationRequest request, Set<UUID> validColumnKeys) {
    List<VerificationItemRequest> items = request.items();
    if (items == null || items.stream().noneMatch(VerificationItemRequest::enabled)) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "At least one enabled evaluation item is required.");
    }

    for (VerificationItemRequest item : items) {
      validateItem(item, validColumnKeys);
    }
  }

  private void validateItem(VerificationItemRequest item, Set<UUID> validColumnKeys) {
    if (item.weight().compareTo(BigDecimal.ZERO) < 0) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "Item weight must be greater than or equal to 0.");
    }

    switch (item.type()) {
      case FIELD_ASSERTION -> validateFieldAssertionItem(item, validColumnKeys);
      case FIELD_ASSERTION_GROUP -> validateFieldAssertionGroup(item, validColumnKeys);
      case LLM_JUDGE -> validateLlmJudge(item, validColumnKeys);
    }
  }

  private void validateFieldAssertionItem(
      VerificationItemRequest item, Set<UUID> validColumnKeys) {
    if (item.fieldAssertion() == null) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "fieldAssertion is required.");
    }
    validateFieldAssertion(item.fieldAssertion(), validColumnKeys);
  }

  private void validateFieldAssertionGroup(
      VerificationItemRequest item, Set<UUID> validColumnKeys) {
    if (item.aggregation() == null) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "aggregation is required for field groups.");
    }
    List<FieldAssertionRequest> assertions = item.fieldAssertions();
    if (assertions == null || assertions.stream().noneMatch(FieldAssertionRequest::enabled)) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "Field assertion groups require at least one enabled assertion.");
    }
    if (item.aggregation() == FieldAggregation.AT_LEAST
        && (item.minPassCount() == null || item.minPassCount() < 1)) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "minPassCount is required for AT_LEAST groups.");
    }
    if (item.aggregation() == FieldAggregation.AT_LEAST
        && item.minPassCount() > assertions.stream().filter(FieldAssertionRequest::enabled).count()) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "minPassCount cannot exceed enabled assertions.");
    }
    assertions.forEach(assertion -> validateFieldAssertion(assertion, validColumnKeys));
  }

  private void validateLlmJudge(VerificationItemRequest item, Set<UUID> validColumnKeys) {
    if (!StringUtils.hasText(item.rubric())) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "rubric is required for LLM judge items.");
    }
    if (item.targetPaths() == null
        || item.targetPaths().stream().noneMatch(StringUtils::hasText)) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "At least one targetPath is required for LLM judge items.");
    }
    if (item.referenceColumnKeys() != null) {
      for (UUID key : item.referenceColumnKeys()) {
        requireValidColumnKey(key, validColumnKeys);
      }
    }
    if (item.criteria() == null || item.criteria().stream().noneMatch(LlmCriterionRequest::enabled)) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "LLM judge items require at least one enabled criterion.");
    }
  }

  private void validateFieldAssertion(
      FieldAssertionRequest assertion, Set<UUID> validColumnKeys) {
    CheckOperator operator = assertion.operator();
    if (!operator.isRequiresExpected()) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST,
          "Field assertions must compare a response field with a dataset schema column.");
    }
    if (assertion.expected() == null) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "expected dataset column is required.");
    }
    validateExpected(assertion.expected(), operator, validColumnKeys);
  }

  private void validateExpected(
      ExpectedValueRequest expected, CheckOperator operator, Set<UUID> validColumnKeys) {
    if (expected.source() != ExpectedSource.DATASET_COLUMN) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "Field assertions must compare against a dataset schema column.");
    }
    if (!operator.getSupportedExpectedSources().contains(expected.source())) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "Expected source is not supported by this operator.");
    }

    requireValidColumnKey(expected.columnKey(), validColumnKeys);
  }

  private void requireValidColumnKey(UUID key, Set<UUID> validColumnKeys) {
    if (key == null || !validColumnKeys.contains(key)) {
      throw ResourceException.of(ErrorCode.COLUMN_NOT_FOUND, "Invalid schema column key: " + key);
    }
  }

  private List<VerificationItem> recreateItems(
      Long configId, List<VerificationItemRequest> requests) {
    itemRepository.deleteByVerificationConfigId(configId);
    if (requests == null || requests.isEmpty()) {
      return List.of();
    }

    List<VerificationItem> savedItems = new ArrayList<>();
    for (VerificationItemRequest request : requests) {
      VerificationItem item = mapper.toItem(configId, request);
      item = itemRepository.save(item);
      saveChildren(item, request);
      savedItems.add(item);
    }
    return itemRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(configId);
  }

  private void saveChildren(VerificationItem item, VerificationItemRequest request) {
    if (request.type() == VerificationItemType.FIELD_ASSERTION) {
      assertionRepository.save(mapper.toAssertion(item.getId(), request.fieldAssertion()));
      return;
    }
    if (request.type() == VerificationItemType.FIELD_ASSERTION_GROUP) {
      assertionRepository.saveAll(
          request.fieldAssertions().stream()
              .map(assertion -> mapper.toAssertion(item.getId(), assertion))
              .toList());
      return;
    }
    if (request.type() == VerificationItemType.LLM_JUDGE) {
      criterionRepository.saveAll(
          request.criteria().stream()
              .map(criterion -> mapper.toCriterion(item.getId(), criterion))
              .toList());
    }
  }

  private VerificationConfigResponse buildResponse(
      VerificationConfig config, List<VerificationItem> items) {
    if (items.isEmpty()) {
      return mapper.toResponse(config, items, Map.of(), Map.of());
    }

    List<Long> itemIds = items.stream().map(VerificationItem::getId).toList();
    Map<Long, List<VerificationFieldAssertion>> assertionsByItem =
        assertionRepository.findByVerificationItemIdInOrderByDisplayOrderAsc(itemIds).stream()
            .sorted(Comparator.comparing(VerificationFieldAssertion::getDisplayOrder))
            .collect(Collectors.groupingBy(VerificationFieldAssertion::getVerificationItemId));
    Map<Long, List<VerificationLlmCriterion>> criteriaByItem =
        criterionRepository.findByVerificationItemIdInOrderByDisplayOrderAsc(itemIds).stream()
            .sorted(Comparator.comparing(VerificationLlmCriterion::getDisplayOrder))
            .collect(Collectors.groupingBy(VerificationLlmCriterion::getVerificationItemId));

    return mapper.toResponse(config, items, assertionsByItem, criteriaByItem);
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository
        .findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }
}
