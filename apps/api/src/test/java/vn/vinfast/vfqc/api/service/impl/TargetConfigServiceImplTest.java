package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.vinfast.vfqc.api.mapper.TargetConfigMapper;
import vn.vinfast.vfqc.api.mapper.TargetConfigMapperImpl;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.targetconfig.request.SaveTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.response.TargetConfigResponse;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.service.CurlParser;
import vn.vinfast.vfqc.api.service.TargetHttpExecutor;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager.SecretScanResult;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@ExtendWith(MockitoExtension.class)
class TargetConfigServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private TargetConfigRepository targetConfigRepository;
  @Mock private CurlParser curlParser;
  @Mock private TargetHttpExecutor targetHttpExecutor;
  @Mock private SecretManager secretManager;

  private TargetConfigServiceImpl service;

  @BeforeEach
  void setUp() {
    TargetConfigMapper mapper = new TargetConfigMapperImpl();
    ObjectMapper objectMapper = new ObjectMapper();
    service = new TargetConfigServiceImpl(
        projectRepository, targetConfigRepository, mapper, curlParser, targetHttpExecutor, secretManager, objectMapper);
  }

  @Test
  void save_Success() {
    UUID projectId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(projectId).build();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));

    when(secretManager.scanAndEncrypt(any(), any(), anyLong(), anyString(), anyLong()))
        .thenReturn(new SecretScanResult(null, null, List.of()));

    when(targetConfigRepository.findByProjectId(1L)).thenReturn(Optional.empty());
    when(targetConfigRepository.save(any(TargetConfig.class))).thenAnswer(i -> {
      TargetConfig t = i.getArgument(0);
      t.setId(10L);
      return t;
    });

    SaveTargetConfigRequest req = new SaveTargetConfigRequest(
        "POST", "http://example.com", null, null, null, null, 30000, "Test");
    TargetConfigResponse response = service.save(projectId, req);

    assertThat(response.method()).isEqualTo("POST");
    assertThat(response.url()).isEqualTo("http://example.com");
    verify(targetConfigRepository).save(any(TargetConfig.class));
  }
}
