package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.ai.AiConfigType;
import vn.vinfast.vfqc.api.model.ai.AiUseCase;
import vn.vinfast.vfqc.api.shared.ai.AiExecutionResult;
import vn.vinfast.vfqc.api.shared.ai.AiProviderFactory;
import vn.vinfast.vfqc.api.shared.ai.AiProviderPort;
import vn.vinfast.vfqc.api.shared.ai.AiRequest;
import vn.vinfast.vfqc.api.repository.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.mapper.AiConfigMapper;
import vn.vinfast.vfqc.api.model.ai.request.SaveAiConfigRequest;
import vn.vinfast.vfqc.api.model.ai.request.TestAiConfigRequest;
import vn.vinfast.vfqc.api.model.ai.response.AiConfigResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.service.AiConfigService;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiConfigServiceImpl implements AiConfigService {

  private final ProjectRepository projectRepository;
  private final JpaAiConfigRepository aiConfigRepository;
  private final AiConfigMapper aiConfigMapper;
  private final AiProviderFactory providerFactory;
  private final SecretManager secretManager;

  @Override
  @Transactional
  public AiConfigResponse save(UUID projectPublicId, SaveAiConfigRequest req) {
    log.info("Saving AI config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);

    AiConfigType type = req.type() != null ? req.type() : AiConfigType.JUDGE;

    AiConfig entity;
    if (req.configId() != null) {
      entity = aiConfigRepository.findByPublicIdAndProjectId(req.configId(), project.getId())
          .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));
    } else if (type == AiConfigType.JUDGE) {
      entity = aiConfigRepository.findByProjectIdAndType(project.getId(), type)
          .orElseGet(() -> AiConfig.builder().projectId(project.getId()).type(type).build());
    } else {
      if (req.name() == null || req.name().isBlank()) {
        throw ResourceException.of(ErrorCode.BAD_REQUEST, "Tên model không được để trống khi so sánh");
      }
      entity = aiConfigRepository.findByProjectIdAndTypeAndName(project.getId(), type, req.name())
          .orElseGet(() -> AiConfig.builder().projectId(project.getId()).type(type).name(req.name()).build());
    }

    // Secrets will be saved after entity is saved to get ID

    // Update entity
    entity.setProvider(req.provider());
    entity.setName(req.name());
    entity.setBaseUrl(entity.requiresCustomBaseUrl() ? req.baseUrl() : null);
    entity.setKeySource(req.keySource());
    entity.setEvaluationModel(req.evaluationModel());
    entity.setGenerationModel(req.generationModel());
    entity.setTemperature(req.temperature());
    entity.setMaxTokens(req.maxTokens());
    entity.setTimeoutMs(req.timeoutMs());
    entity.setRetryCount(req.retryCount());

    if (entity.getId() != null) {
      entity.bumpVersion();
    }

    AiConfig saved = aiConfigRepository.save(entity);

    // Update API Key if provided
    if (req.apiKey() != null
        && !req.apiKey().isBlank()
        && !req.apiKey().equals("SECRET_REDACTED")) {
      secretManager.replaceSecrets(
          "AI_CONFIG",
          saved.getId(),
          java.util.List.of(
              secretManager.encryptSingleSecret(
                  project.getId(), "AI_CONFIG", saved.getId(), "API_KEY", req.apiKey())));
    }

    return mapToResponse(saved, project.getId());
  }

  @Override
  @Transactional(readOnly = true)
  public AiConfigResponse get(UUID projectPublicId) {
    log.debug("Fetching AI config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    AiConfig entity =
        aiConfigRepository
            .findByProjectIdAndType(project.getId(), AiConfigType.JUDGE)
            .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));

    return mapToResponse(entity, project.getId());
  }

  @Override
  @Transactional(readOnly = true)
  public java.util.List<AiConfigResponse> listCompare(UUID projectPublicId) {
    Project project = getProjectOrThrow(projectPublicId);
    return aiConfigRepository.findAllByProjectIdAndType(project.getId(), AiConfigType.COMPARE)
        .stream().map(e -> mapToResponse(e, project.getId())).toList();
  }

  @Override
  @Transactional
  public void delete(UUID projectPublicId, UUID configPublicId) {
    Project project = getProjectOrThrow(projectPublicId);
    AiConfig entity = aiConfigRepository.findByPublicIdAndProjectId(configPublicId, project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));
    if (entity.getType() == AiConfigType.JUDGE) {
        throw ResourceException.of(ErrorCode.BAD_REQUEST, "Không thể xoá cấu hình JUDGE");
    }
    secretManager.replaceSecrets("AI_CONFIG", entity.getId(), java.util.List.of());
    aiConfigRepository.delete(entity);
  }

  @Override
  @Transactional
  public AiExecutionResult test(UUID projectPublicId, TestAiConfigRequest req) {
    log.info("Testing AI config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    AiConfig entity =
        aiConfigRepository
            .findByProjectIdAndType(project.getId(), AiConfigType.JUDGE)
            .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));

    Map<String, String> decryptedSecrets =
        secretManager.decryptForOwner("AI_CONFIG", entity.getId());
    if (decryptedSecrets.isEmpty()) {
      decryptedSecrets = secretManager.decryptForOwner("AI_CONFIG", project.getId());
    }
    String apiKey = decryptedSecrets.get("API_KEY");
    if (apiKey == null || apiKey.isBlank()) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST,
          "Missing API Key. Please save the AI configuration with a valid API key first.");
    }

    AiProviderPort adapter = providerFactory.getAdapter(entity.getProvider());
    AiRequest aiRequest =
        new AiRequest(entity, apiKey, AiUseCase.EVALUATION, req.systemPrompt(), req.userMessage());
    AiExecutionResult result = adapter.execute(aiRequest);

    entity.recordTestResult(result.successful() ? "SUCCESS" : "FAILED", OffsetDateTime.now());
    aiConfigRepository.save(entity);

    if (!result.successful()) {
      throw ResourceException.of(
          ErrorCode.AI_CONNECTION_FAILED,
          result.errorMessage() != null ? result.errorMessage() : "Execution failed");
    }

    return result;
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository
        .findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private AiConfigResponse mapToResponse(AiConfig entity, Long projectId) {
    AiConfigResponse res = aiConfigMapper.toResponse(entity);
    boolean hasApiKey = secretManager.hasSecrets("AI_CONFIG", entity.getId());
    if (!hasApiKey) {
      hasApiKey = secretManager.hasSecrets("AI_CONFIG", projectId);
    }

    return new AiConfigResponse(
        res.type(),
        res.name(),
        res.publicId(),
        res.version(),
        res.provider(),
        res.baseUrl(),
        res.keySource(),
        hasApiKey,
        res.evaluationModel(),
        res.generationModel(),
        res.temperature(),
        res.maxTokens(),
        res.timeoutMs(),
        res.retryCount(),
        res.lastTestStatus(),
        res.lastTestedAt(),
        res.createdAt(),
        res.updatedAt());
  }
}
