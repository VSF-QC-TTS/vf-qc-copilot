package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.vinfast.vfqc.api.mapper.DatasetSchemaMapper;
import vn.vinfast.vfqc.api.mapper.DatasetSchemaMapperImpl;
import vn.vinfast.vfqc.api.model.datasetschema.ColumnDataType;
import vn.vinfast.vfqc.api.model.datasetschema.ColumnRole;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetColumn;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetSchemaVersion;
import vn.vinfast.vfqc.api.model.datasetschema.request.CreateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.response.DatasetSchemaResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.DatasetColumnRepository;
import vn.vinfast.vfqc.api.repository.DatasetSchemaVersionRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@ExtendWith(MockitoExtension.class)
class DatasetSchemaServiceImplTest {

  @Mock private ProjectRepository projectRepository;
  @Mock private DatasetSchemaVersionRepository schemaRepository;
  @Mock private DatasetColumnRepository columnRepository;

  private DatasetSchemaServiceImpl service;

  @BeforeEach
  void setUp() {
    DatasetSchemaMapper mapper = new DatasetSchemaMapperImpl();
    service = new DatasetSchemaServiceImpl(projectRepository, schemaRepository, columnRepository, mapper);
  }

  @Test
  void addColumn_FirstColumn_CreatesVersion1() {
    UUID projectId = UUID.randomUUID();
    Project project = Project.builder().id(1L).publicId(projectId).build();
    when(projectRepository.findByPublicIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));

    when(schemaRepository.findTopByProjectIdOrderByVersionDesc(1L)).thenReturn(Optional.empty());
    
    when(schemaRepository.save(any())).thenAnswer(i -> {
      DatasetSchemaVersion v = i.getArgument(0);
      v.setId(100L);
      return v;
    });

    CreateColumnRequest req = new CreateColumnRequest(
        "review", "Review Text", ColumnDataType.STRING, ColumnRole.INPUT, true, "Good product", "Customer review"
    );

    DatasetSchemaResponse res = service.addColumn(projectId, req);

    assertThat(res.version()).isEqualTo(1);
    assertThat(res.columns()).hasSize(1);
    assertThat(res.columns().get(0).columnName()).isEqualTo("review");
    
    verify(schemaRepository).save(any());
    verify(columnRepository).saveAll(any());
  }
}
