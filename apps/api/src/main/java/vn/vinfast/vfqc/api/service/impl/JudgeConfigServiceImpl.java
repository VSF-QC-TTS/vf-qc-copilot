package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.mapper.JudgeConfigMapper;
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;
import vn.vinfast.vfqc.api.model.judgeconfig.request.SaveJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.request.TestJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeConfigResponse;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeExecutionResult;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.JudgeConfigRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.service.JudgeConfigService;
import vn.vinfast.vfqc.api.service.judge.LlmProviderClient;
import vn.vinfast.vfqc.api.service.judge.LlmProviderRegistry;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeConfigServiceImpl implements JudgeConfigService {

  private final ProjectRepository projectRepository;
  private final JudgeConfigRepository judgeConfigRepository;
  private final JudgeConfigMapper judgeConfigMapper;
  private final LlmProviderRegistry registry;
  private final SecretManager secretManager;

  @Override
  @Transactional
  public JudgeConfigResponse save(UUID projectPublicId, SaveJudgeConfigRequest req) {
    Project project = getProjectOrThrow(projectPublicId);

    JudgeConfig entity = judgeConfigRepository.findByProjectId(project.getId())
        .orElseGet(() -> JudgeConfig.builder()
            .projectId(project.getId())
            .build());

    // Update API Key if provided
    if (req.apiKey() != null && !req.apiKey().isBlank() && !req.apiKey().equals("SECRET_REDACTED")) {
      secretManager.replaceSecrets("JUDGE_CONFIG", project.getId(), java.util.List.of(
          secretManager.encryptSingleSecret(project.getId(), "JUDGE_CONFIG", project.getId(), "API_KEY", req.apiKey())
      ));
    }

    // Update entity
    entity.setProvider(req.provider());
    entity.setBaseUrl(req.baseUrl());
    entity.setModel(req.model());
    entity.setCustomModelName(req.customModelName());
    entity.setTemperature(req.temperature());
    entity.setMaxTokens(req.maxTokens());
    entity.setTimeoutMs(req.timeoutMs());
    entity.setRetryCount(req.retryCount());

    if (entity.getId() != null) {
      entity.setVersion(entity.getVersion() + 1);
    }

    JudgeConfig saved = judgeConfigRepository.save(entity);
    return mapToResponse(saved, project.getId());
  }

  @Override
  @Transactional(readOnly = true)
  public JudgeConfigResponse get(UUID projectPublicId) {
    Project project = getProjectOrThrow(projectPublicId);
    JudgeConfig entity = judgeConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.JUDGE_CONFIG_NOT_FOUND));

    return mapToResponse(entity, project.getId());
  }

  @Override
  @Transactional
  public JudgeExecutionResult test(UUID projectPublicId, TestJudgeConfigRequest req) {
    Project project = getProjectOrThrow(projectPublicId);
    JudgeConfig entity = judgeConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.JUDGE_CONFIG_NOT_FOUND));

    Map<String, String> decryptedSecrets = secretManager.decryptForOwner("JUDGE_CONFIG", project.getId());
    String apiKey = decryptedSecrets.get("API_KEY");
    if (apiKey == null || apiKey.isBlank()) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Missing API Key. Please save the judge configuration with a valid API key first.");
    }

    LlmProviderClient client = registry.getClient(entity.getProvider());
    JudgeExecutionResult result = client.execute(entity, apiKey, req.systemPrompt(), req.userMessage());

    entity.setLastTestedAt(OffsetDateTime.now());
    entity.setLastTestStatus(result.successful() ? "SUCCESS" : "FAILED");
    judgeConfigRepository.save(entity);

    if (!result.successful()) {
      throw ResourceException.of(ErrorCode.JUDGE_CONNECTION_FAILED, result.errorMessage() != null ? result.errorMessage() : "Execution failed");
    }

    return result;
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private JudgeConfigResponse mapToResponse(JudgeConfig entity, Long projectId) {
    JudgeConfigResponse res = judgeConfigMapper.toResponse(entity);
    boolean hasApiKey = secretManager.hasSecrets("JUDGE_CONFIG", projectId);
    
    return new JudgeConfigResponse(
        res.publicId(),
        res.version(),
        res.provider(),
        res.baseUrl(),
        hasApiKey,
        res.model(),
        res.customModelName(),
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
