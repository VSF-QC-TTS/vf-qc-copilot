package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.vinfast.vfqc.api.mapper.VerificationConfigMapper;
import vn.vinfast.vfqc.api.mapper.VerificationConfigMapperImpl;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.verificationconfig.CheckOperator;
import vn.vinfast.vfqc.api.model.verificationconfig.ExpectedSource;
import vn.vinfast.vfqc.api.model.verificationconfig.VerificationConfig;
import vn.vinfast.vfqc.api.model.verificationconfig.VerificationMode;
import vn.vinfast.vfqc.api.model.verificationconfig.request.FieldCheckRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.response.VerificationConfigResponse;
import vn.vinfast.vfqc.api.repository.DatasetSchemaVersionRepository;
import vn.vinfast.vfqc.api.repository.FieldCheckRepository;
import vn.vinfast.vfqc.api.repository.JudgeConfigRepository;
import vn.vinfast.vfqc.api.repository.LlmRubricRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.repository.VerificationConfigRepository;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@ExtendWith(MockitoExtension.class)
class VerificationConfigServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private VerificationConfigRepository verificationConfigRepository;
  @Mock private FieldCheckRepository fieldCheckRepository;
  @Mock private LlmRubricRepository llmRubricRepository;
  @Mock private TargetConfigRepository targetConfigRepository;
  @Mock private JudgeConfigRepository judgeConfigRepository;
  @Mock private DatasetSchemaVersionRepository datasetSchemaRepository;

  private VerificationConfigServiceImpl service;

  @BeforeEach
  void setUp() {
    VerificationConfigMapper mapper = new VerificationConfigMapperImpl();
    service = new VerificationConfigServiceImpl(
        projectRepository, verificationConfigRepository, fieldCheckRepository, 
        llmRubricRepository, targetConfigRepository, judgeConfigRepository, 
        datasetSchemaRepository, mapper
    );
  }

  @Test
  void save_MissingTargetConfig_ThrowsException() {
    UUID publicId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(publicId).build();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)).thenReturn(Optional.of(project));
    when(targetConfigRepository.existsByProjectId(1L)).thenReturn(false);

    SaveVerificationRequest request = new SaveVerificationRequest(VerificationMode.FIELD_CHECKS, null, null);

    assertThatThrownBy(() -> service.save(publicId, request))
        .isInstanceOf(ResourceException.class)
        .hasMessageContaining("Verification requires a configured Target API.");
  }

  @Test
  void save_Success() {
    UUID publicId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(publicId).build();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)).thenReturn(Optional.of(project));
    when(targetConfigRepository.existsByProjectId(1L)).thenReturn(true);
    when(datasetSchemaRepository.existsByProjectId(1L)).thenReturn(true);
    when(judgeConfigRepository.existsByProjectId(1L)).thenReturn(true);

    when(verificationConfigRepository.findByProjectId(1L)).thenReturn(Optional.empty());
    
    when(verificationConfigRepository.save(any())).thenAnswer(i -> {
      VerificationConfig c = i.getArgument(0);
      c.setId(10L);
      return c;
    });

    FieldCheckRequest fcReq = new FieldCheckRequest(
        null, "$.status", CheckOperator.EQUALS, ExpectedSource.LITERAL, null, "SUCCESS", null, BigDecimal.ONE, true, 0
    );
    SaveVerificationRequest request = new SaveVerificationRequest(VerificationMode.RULE_AND_LLM, List.of(fcReq), null);

    VerificationConfigResponse response = service.save(publicId, request);

    assertThat(response.mode()).isEqualTo(VerificationMode.RULE_AND_LLM);
    verify(fieldCheckRepository).deleteByVerificationConfigId(10L);
    verify(llmRubricRepository).deleteByVerificationConfigId(10L);
    verify(fieldCheckRepository).saveAll(any());
  }
}
