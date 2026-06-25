package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.vinfast.vfqc.api.mapper.JudgeConfigMapper;
import vn.vinfast.vfqc.api.mapper.JudgeConfigMapperImpl;
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;
import vn.vinfast.vfqc.api.model.judgeconfig.request.SaveJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeConfigResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.JudgeConfigRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.service.judge.LlmProviderRegistry;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@ExtendWith(MockitoExtension.class)
class JudgeConfigServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private JudgeConfigRepository judgeConfigRepository;
  @Mock private LlmProviderRegistry registry;
  @Mock private SecretManager secretManager;

  private JudgeConfigServiceImpl service;

  @BeforeEach
  void setUp() {
    JudgeConfigMapper mapper = new JudgeConfigMapperImpl();
    service = new JudgeConfigServiceImpl(projectRepository, judgeConfigRepository, mapper, registry, secretManager);
  }

  @Test
  void save_Success() {
    UUID projectId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(projectId).build();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));

    when(judgeConfigRepository.findByProjectId(1L)).thenReturn(Optional.empty());
    when(judgeConfigRepository.save(any(JudgeConfig.class))).thenAnswer(i -> {
      JudgeConfig c = i.getArgument(0);
      c.setId(10L);
      return c;
    });

    when(secretManager.hasSecrets(eq("JUDGE_CONFIG"), eq(1L))).thenReturn(true);
    when(secretManager.encryptSingleSecret(anyLong(), anyString(), anyLong(), anyString(), anyString()))
        .thenReturn(vn.vinfast.vfqc.api.model.targetconfig.SecretRef.builder().build());

    SaveJudgeConfigRequest req = new SaveJudgeConfigRequest(
        LlmProvider.OPENAI, null, "sk-123", "gpt-4o", null, BigDecimal.ZERO, 4000, 60000, 2);

    JudgeConfigResponse response = service.save(projectId, req);

    assertThat(response.provider()).isEqualTo(LlmProvider.OPENAI);
    assertThat(response.model()).isEqualTo("gpt-4o");
    assertThat(response.hasApiKey()).isTrue();
    
    verify(secretManager).encryptSingleSecret(1L, "JUDGE_CONFIG", 1L, "API_KEY", "sk-123");
    verify(secretManager).replaceSecrets(eq("JUDGE_CONFIG"), eq(1L), any());
    verify(judgeConfigRepository).save(any(JudgeConfig.class));
  }
}
