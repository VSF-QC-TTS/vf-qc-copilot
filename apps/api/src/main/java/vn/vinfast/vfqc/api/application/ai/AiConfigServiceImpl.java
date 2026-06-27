package vn.vinfast.vfqc.api.application.ai;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.domain.ai.AiConfig;
import vn.vinfast.vfqc.api.domain.ai.AiUseCase;
import vn.vinfast.vfqc.api.infrastructure.ai.AiExecutionResult;
import vn.vinfast.vfqc.api.infrastructure.ai.AiProviderFactory;
import vn.vinfast.vfqc.api.infrastructure.ai.AiProviderPort;
import vn.vinfast.vfqc.api.infrastructure.ai.AiRequest;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.interfaces.dto.ai.AiConfigMapper;
import vn.vinfast.vfqc.api.interfaces.dto.ai.request.SaveAiConfigRequest;
import vn.vinfast.vfqc.api.interfaces.dto.ai.request.TestAiConfigRequest;
import vn.vinfast.vfqc.api.interfaces.dto.ai.response.AiConfigResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
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

    AiConfig entity = aiConfigRepository.findByProjectId(project.getId())
        .orElseGet(() -> AiConfig.builder()
            .projectId(project.getId())
            .build());

    // Update API Key if provided
    if (req.apiKey() != null && !req.apiKey().isBlank() && !req.apiKey().equals("SECRET_REDACTED")) {
      secretManager.replaceSecrets("AI_CONFIG", project.getId(), java.util.List.of(
          secretManager.encryptSingleSecret(project.getId(), "AI_CONFIG", project.getId(), "API_KEY", req.apiKey())
      ));
    }

    // Update entity
    entity.setProvider(req.provider());
    entity.setBaseUrl(req.baseUrl());
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
    return mapToResponse(saved, project.getId());
  }

  @Override
  @Transactional(readOnly = true)
  public AiConfigResponse get(UUID projectPublicId) {
    log.debug("Fetching AI config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    AiConfig entity = aiConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));

    return mapToResponse(entity, project.getId());
  }

  @Override
  @Transactional
  public AiExecutionResult test(UUID projectPublicId, TestAiConfigRequest req) {
    log.info("Testing AI config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    AiConfig entity = aiConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.AI_CONFIG_NOT_FOUND));

    Map<String, String> decryptedSecrets = secretManager.decryptForOwner("AI_CONFIG", project.getId());
    String apiKey = decryptedSecrets.get("API_KEY");
    if (apiKey == null || apiKey.isBlank()) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Missing API Key. Please save the AI configuration with a valid API key first.");
    }

    AiProviderPort adapter = providerFactory.getAdapter(entity.getProvider());
    AiRequest aiRequest = new AiRequest(
        entity,
        apiKey,
        AiUseCase.EVALUATION,
        req.systemPrompt(),
        req.userMessage()
    );
    AiExecutionResult result = adapter.execute(aiRequest);

    entity.recordTestResult(result.successful() ? "SUCCESS" : "FAILED", OffsetDateTime.now());
    aiConfigRepository.save(entity);

    if (!result.successful()) {
      throw ResourceException.of(ErrorCode.AI_CONNECTION_FAILED, result.errorMessage() != null ? result.errorMessage() : "Execution failed");
    }

    return result;
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private AiConfigResponse mapToResponse(AiConfig entity, Long projectId) {
    AiConfigResponse res = aiConfigMapper.toResponse(entity);
    boolean hasApiKey = secretManager.hasSecrets("AI_CONFIG", projectId);

    return new AiConfigResponse(
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
        res.updatedAt()
    );
  }
}
