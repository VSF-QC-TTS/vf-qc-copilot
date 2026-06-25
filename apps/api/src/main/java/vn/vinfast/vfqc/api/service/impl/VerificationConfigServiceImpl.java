package vn.vinfast.vfqc.api.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.mapper.VerificationConfigMapper;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.verificationconfig.CheckOperator;
import vn.vinfast.vfqc.api.model.verificationconfig.FieldCheck;
import vn.vinfast.vfqc.api.model.verificationconfig.LlmRubric;
import vn.vinfast.vfqc.api.model.verificationconfig.VerificationConfig;
import vn.vinfast.vfqc.api.model.verificationconfig.VerificationMode;
import vn.vinfast.vfqc.api.model.verificationconfig.request.FieldCheckRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.request.LlmRubricRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.response.VerificationConfigResponse;
import vn.vinfast.vfqc.api.repository.DatasetSchemaVersionRepository;
import vn.vinfast.vfqc.api.repository.FieldCheckRepository;
import vn.vinfast.vfqc.api.repository.JudgeConfigRepository;
import vn.vinfast.vfqc.api.repository.LlmRubricRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.repository.VerificationConfigRepository;
import vn.vinfast.vfqc.api.service.VerificationConfigService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationConfigServiceImpl implements VerificationConfigService {

  private final ProjectRepository projectRepository;
  private final VerificationConfigRepository verificationConfigRepository;
  private final FieldCheckRepository fieldCheckRepository;
  private final LlmRubricRepository llmRubricRepository;
  
  private final TargetConfigRepository targetConfigRepository;
  private final JudgeConfigRepository judgeConfigRepository;
  private final DatasetSchemaVersionRepository datasetSchemaRepository;
  
  private final VerificationConfigMapper mapper;

  @Override
  @Transactional(readOnly = true)
  public VerificationConfigResponse get(UUID projectPublicId) {
    log.debug("Fetching verification config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    
    VerificationConfig config = verificationConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.VERIFICATION_CONFIG_NOT_FOUND));
        
    List<FieldCheck> fieldChecks = fieldCheckRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(config.getId());
    List<LlmRubric> llmRubrics = llmRubricRepository.findByVerificationConfigIdOrderByDisplayOrderAsc(config.getId());
    
    return mapper.toResponse(config, fieldChecks, llmRubrics);
  }

  @Override
  @Transactional
  public VerificationConfigResponse save(UUID projectPublicId, SaveVerificationRequest request) {
    log.info("Saving verification config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    Long projectId = project.getId();
    
    validatePreconditions(projectId, request.mode(), request.fieldChecks());
    
    // Validate all check operators logic internally
    if (request.fieldChecks() != null) {
      request.fieldChecks().forEach(fc -> fc.operator().validate(fc));
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
    
    List<FieldCheck> fieldChecks = recreateFieldChecks(configId, request.fieldChecks());
    List<LlmRubric> llmRubrics = recreateLlmRubrics(configId, request.llmRubrics());
    
    return mapper.toResponse(config, fieldChecks, llmRubrics);
  }

  private List<FieldCheck> recreateFieldChecks(Long configId, List<FieldCheckRequest> requests) {
    fieldCheckRepository.deleteByVerificationConfigId(configId);
    if (requests == null || requests.isEmpty()) {
      return new ArrayList<>();
    }
    
    List<FieldCheck> fieldChecks = new ArrayList<>();
    for (FieldCheckRequest req : requests) {
      FieldCheck fc = mapper.toEntity(req);
      fc.setVerificationConfigId(configId);
      if (req.publicId() != null) {
        fc.setPublicId(req.publicId());
      }
      fieldChecks.add(fc);
    }
    return fieldCheckRepository.saveAll(fieldChecks);
  }

  private List<LlmRubric> recreateLlmRubrics(Long configId, List<LlmRubricRequest> requests) {
    llmRubricRepository.deleteByVerificationConfigId(configId);
    if (requests == null || requests.isEmpty()) {
      return new ArrayList<>();
    }
    
    List<LlmRubric> llmRubrics = new ArrayList<>();
    for (LlmRubricRequest req : requests) {
      LlmRubric lr = mapper.toEntity(req);
      lr.setVerificationConfigId(configId);
      if (req.publicId() != null) {
        lr.setPublicId(req.publicId());
      }
      llmRubrics.add(lr);
    }
    return llmRubricRepository.saveAll(llmRubrics);
  }

  private void validatePreconditions(Long projectId, VerificationMode mode, List<FieldCheckRequest> fieldChecks) {
    if (!targetConfigRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_TARGET_CONFIG);
    }
    if (!datasetSchemaRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_DATASET_SCHEMA);
    }
    
    boolean requiresJudge = mode == VerificationMode.OVERALL_RUBRIC || mode == VerificationMode.RULE_AND_LLM;
    if (!requiresJudge && fieldChecks != null) {
      requiresJudge = fieldChecks.stream().anyMatch(fc -> fc.operator() == CheckOperator.LLM_JUDGE);
    }
    
    if (requiresJudge && !judgeConfigRepository.existsByProjectId(projectId)) {
      throw ResourceException.of(ErrorCode.MISSING_JUDGE_CONFIG);
    }
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }
}
