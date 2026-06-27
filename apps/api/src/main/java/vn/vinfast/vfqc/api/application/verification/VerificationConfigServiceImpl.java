package vn.vinfast.vfqc.api.application.verification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.domain.schema.ProjectSchema;
import vn.vinfast.vfqc.api.domain.schema.SchemaColumn;
import vn.vinfast.vfqc.api.domain.verification.CheckOperator;
import vn.vinfast.vfqc.api.domain.verification.ExpectedSource;
import vn.vinfast.vfqc.api.domain.verification.FieldCheckRule;
import vn.vinfast.vfqc.api.domain.verification.LlmRubricRule;
import vn.vinfast.vfqc.api.domain.verification.VerificationConfig;
import vn.vinfast.vfqc.api.domain.verification.VerificationMode;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaDatasetRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaFieldCheckRuleRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaLlmRubricRuleRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaProjectSchemaRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaSchemaColumnRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaVerificationConfigRepository;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import vn.vinfast.vfqc.api.interfaces.dto.verification.VerificationConfigMapper;
import vn.vinfast.vfqc.api.interfaces.dto.verification.request.FieldCheckRuleRequest;
import vn.vinfast.vfqc.api.interfaces.dto.verification.request.LlmRubricRuleRequest;
import vn.vinfast.vfqc.api.interfaces.dto.verification.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.interfaces.dto.verification.response.VerificationConfigResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
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
  private final JpaFieldCheckRuleRepository fieldCheckRuleRepository;
  private final JpaLlmRubricRuleRepository llmRubricRuleRepository;

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

    VerificationConfig config = verificationConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.VERIFICATION_CONFIG_NOT_FOUND));

    List<FieldCheckRule> fieldChecks = fieldCheckRuleRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(config.getId());
    List<LlmRubricRule> llmRubrics = llmRubricRuleRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(config.getId());

    return mapper.toResponse(config, fieldChecks, llmRubrics);
  }

  @Override
  @Transactional
  public VerificationConfigResponse save(UUID projectPublicId, SaveVerificationRequest request) {
    log.info("Saving verification config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    Long projectId = project.getId();

    validatePreconditions(projectId, request.mode(), request.fieldChecks());
    validateExpectedColumnKeys(projectId, request.fieldChecks());

    // Validate all check operators logic internally
    if (request.fieldChecks() != null) {
      for (FieldCheckRuleRequest fcReq : request.fieldChecks()) {
        FieldCheckRule tempRule = mapper.toEntity(fcReq);
        fcReq.operator().validate(tempRule);
      }
    }

    VerificationConfig config = verificationConfigRepository.findByProjectId(projectId)
        .orElseGet(() -> VerificationConfig.builder()
            .projectId(projectId)
            .version(0)
            .build());

    config.setMode(request.mode());
    config.setVersion(config.getVersion() + 1);
    config = verificationConfigRepository.save(config);

    Long configId = config.getId();

    List<FieldCheckRule> fieldChecks = recreateFieldChecks(configId, request.fieldChecks());
    List<LlmRubricRule> llmRubrics = recreateLlmRubrics(configId, request.llmRubrics());

    return mapper.toResponse(config, fieldChecks, llmRubrics);
  }

  private List<FieldCheckRule> recreateFieldChecks(Long configId, List<FieldCheckRuleRequest> requests) {
    fieldCheckRuleRepository.deleteByVerificationConfigId(configId);
    if (requests == null || requests.isEmpty()) {
      return new ArrayList<>();
    }

    List<FieldCheckRule> fieldChecks = new ArrayList<>();
    for (FieldCheckRuleRequest req : requests) {
      FieldCheckRule fc = mapper.toEntity(req);
      fc.setVerificationConfigId(configId);
      if (req.publicId() != null) {
        fc.setPublicId(req.publicId());
      }
      fieldChecks.add(fc);
    }
    return fieldCheckRuleRepository.saveAll(fieldChecks);
  }

  private List<LlmRubricRule> recreateLlmRubrics(Long configId, List<LlmRubricRuleRequest> requests) {
    llmRubricRuleRepository.deleteByVerificationConfigId(configId);
    if (requests == null || requests.isEmpty()) {
      return new ArrayList<>();
    }

    List<LlmRubricRule> llmRubrics = new ArrayList<>();
    for (LlmRubricRuleRequest req : requests) {
      LlmRubricRule lr = mapper.toEntity(req);
      lr.setVerificationConfigId(configId);
      if (req.publicId() != null) {
        lr.setPublicId(req.publicId());
      }
      llmRubrics.add(lr);
    }
    return llmRubricRuleRepository.saveAll(llmRubrics);
  }

  private void validatePreconditions(Long projectId, VerificationMode mode, List<FieldCheckRuleRequest> fieldChecks) {
    if (!targetConfigRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_TARGET_CONFIG);
    }
    // TODO Phase 2: Switch this precondition from ProjectSchema to Dataset once Dataset import flow is implemented.
    if (!schemaRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_DATASET, "Please configure Project Schema (or upload dataset) first.");
    }

    boolean requiresAi = mode == VerificationMode.OVERALL_RUBRIC || mode == VerificationMode.RULE_AND_LLM;
    if (!requiresAi && fieldChecks != null) {
      requiresAi = fieldChecks.stream().anyMatch(fc -> fc.operator() == CheckOperator.LLM_JUDGE);
    }

    if (requiresAi && !aiConfigRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_AI_CONFIG);
    }
  }

  private void validateExpectedColumnKeys(Long projectId, List<FieldCheckRuleRequest> fieldChecks) {
    if (fieldChecks == null || fieldChecks.isEmpty()) {
      return;
    }

    List<UUID> requiredColumnKeys = fieldChecks.stream()
        .filter(fc -> fc.expectedSource() == ExpectedSource.DATASET_COLUMN)
        .map(FieldCheckRuleRequest::expectedColumnKey)
        .filter(Objects::nonNull)
        .toList();

    if (requiredColumnKeys.isEmpty()) {
      return;
    }

    ProjectSchema schema = schemaRepository.findByProjectId(projectId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_SCHEMA_NOT_FOUND));

    Set<UUID> validColumnKeys = columnRepository
        .findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId())
        .stream()
        .map(SchemaColumn::getPublicId)
        .collect(Collectors.toSet());

    for (UUID key : requiredColumnKeys) {
      if (!validColumnKeys.contains(key)) {
        throw ResourceException.of(ErrorCode.COLUMN_NOT_FOUND, "Invalid expectedColumnKey for this project schema: " + key);
      }
    }
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }
}
