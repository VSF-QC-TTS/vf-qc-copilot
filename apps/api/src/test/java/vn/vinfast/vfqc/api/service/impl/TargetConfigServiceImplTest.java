package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
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
import vn.vinfast.vfqc.api.model.targetconfig.response.ResponseFieldExampleResponse;
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

    TargetConfig existing = TargetConfig.builder()
        .id(10L)
        .projectId(1L)
        .method("POST")
        .url("http://example.com")
        .headers("{}")
        .queryParams("{}")
        .timeoutMs(30000)
        .build();
    when(targetConfigRepository.findByProjectId(1L)).thenReturn(Optional.of(existing));
    when(targetConfigRepository.save(any(TargetConfig.class))).thenAnswer(i -> {
      TargetConfig t = i.getArgument(0);
      t.setId(10L);
      return t;
    });
    when(secretManager.scanAndEncrypt(any(), any(), any(), any(), any()))
        .thenReturn(new SecretScanResult(
            Map.of("Authorization", "SECRET_REDACTED", "X-Client", "vfqc"),
            Map.of("api-key", "SECRET_REDACTED", "locale", "vi"),
            List.of()));

    SaveTargetConfigRequest req = new SaveTargetConfigRequest(
        "PUT",
        "http://updated.example.com",
        Map.of("Authorization", "Bearer SECRET_REDACTED", "X-Client", "vfqc"),
        Map.of("api-key", "SECRET_REDACTED", "locale", "vi"),
        "{\"question\":\"{{question}}\"}",
        "$.answer",
        45000,
        "Test");
    TargetConfigResponse response = service.save(projectId, req);

    assertThat(response.method()).isEqualTo("PUT");
    assertThat(response.url()).isEqualTo("http://updated.example.com");
    assertThat(response.maskedHeaders()).containsEntry("Authorization", "SECRET_REDACTED");
    assertThat(response.maskedHeaders()).containsEntry("X-Client", "vfqc");
    assertThat(response.maskedQueryParams()).containsEntry("api-key", "SECRET_REDACTED");
    assertThat(response.maskedQueryParams()).containsEntry("locale", "vi");
    assertThat(response.bodyTemplate()).isEqualTo("{\"question\":\"{{question}}\"}");
    assertThat(response.responsePath()).isEqualTo("$.answer");
    assertThat(response.timeoutMs()).isEqualTo(45000);
    verify(targetConfigRepository).save(any(TargetConfig.class));
  }

  @Test
  void getResponseFields_ExtractsPathsFromAllArrayElements() {
    UUID projectId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(projectId).build();
    TargetConfig targetConfig = TargetConfig.builder()
        .id(10L)
        .projectId(1L)
        .responseFieldSnapshot("""
            {
              "steps": [
                {
                  "signature": "abc",
                  "type": "thought"
                },
                {
                  "content": [
                    {
                      "text": "AI learns patterns from data.",
                      "type": "text"
                    }
                  ],
                  "type": "model_output"
                }
              ]
            }
            """)
        .build();

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
    when(targetConfigRepository.findByProjectId(1L)).thenReturn(Optional.of(targetConfig));

    List<String> paths = service.getResponseFields(projectId);

    assertThat(paths).contains(
        "$.steps[0].signature",
        "$.steps[0].type",
        "$.steps[1].content[0].text",
        "$.steps[1].content[0].type",
        "$.steps[1].type"
    );
  }

  @Test
  void getResponseFieldExamples_ReturnsPathAndSampleValue() {
    UUID projectId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(projectId).build();
    TargetConfig targetConfig = TargetConfig.builder()
        .id(10L)
        .projectId(1L)
        .responseFieldSnapshot("""
            {
              "answer": "Approved",
              "score": 0.92,
              "metadata": {
                "source": "policy"
              }
            }
            """)
        .build();

    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
    when(targetConfigRepository.findByProjectId(1L)).thenReturn(Optional.of(targetConfig));

    List<ResponseFieldExampleResponse> fields = service.getResponseFieldExamples(projectId);

    assertThat(fields)
        .contains(
            new ResponseFieldExampleResponse("$.answer", "Approved"),
            new ResponseFieldExampleResponse("$.score", "0.92"),
            new ResponseFieldExampleResponse("$.metadata.source", "policy"));
  }
}
