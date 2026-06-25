package vn.vinfast.vfqc.api.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.mapper.DatasetSchemaMapper;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetColumn;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetSchemaVersion;
import vn.vinfast.vfqc.api.model.datasetschema.request.CreateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.request.UpdateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.response.DatasetSchemaResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.DatasetColumnRepository;
import vn.vinfast.vfqc.api.repository.DatasetSchemaVersionRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.service.DatasetSchemaService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatasetSchemaServiceImpl implements DatasetSchemaService {

  private final ProjectRepository projectRepository;
  private final DatasetSchemaVersionRepository schemaRepository;
  private final DatasetColumnRepository columnRepository;
  private final DatasetSchemaMapper mapper;

  @Override
  @Transactional(readOnly = true)
  public DatasetSchemaResponse getLatestSchema(UUID projectPublicId) {
    Project project = getProjectOrThrow(projectPublicId);
    
    DatasetSchemaVersion latestVersion = schemaRepository.findTopByProjectIdOrderByVersionDesc(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_SCHEMA_NOT_FOUND));
        
    List<DatasetColumn> columns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(latestVersion.getId());
    return mapper.toResponse(latestVersion, columns);
  }

  @Override
  @Transactional
  public DatasetSchemaResponse addColumn(UUID projectPublicId, CreateColumnRequest request) {
    Project project = getProjectOrThrow(projectPublicId);
    
    Optional<DatasetSchemaVersion> currentVersionOpt = schemaRepository.findTopByProjectIdOrderByVersionDesc(project.getId());
    
    DatasetSchemaVersion newVersion;
    List<DatasetColumn> currentColumns;
    
    if (currentVersionOpt.isEmpty()) {
      newVersion = createNextVersion(project.getId(), 1);
      currentColumns = new ArrayList<>();
    } else {
      DatasetSchemaVersion currentVersion = currentVersionOpt.get();
      currentColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(currentVersion.getId());
      
      boolean nameExists = currentColumns.stream()
          .anyMatch(c -> c.getColumnName().equalsIgnoreCase(request.columnName()));
      if (nameExists) {
        throw ResourceException.of(ErrorCode.DUPLICATE_COLUMN_NAME);
      }
      
      newVersion = createNextVersion(project.getId(), currentVersion.getVersion() + 1);
    }

    // Copy existing columns
    List<DatasetColumn> newColumns = copyColumnsToNewVersion(currentColumns, newVersion.getId());
    
    // Add new column
    DatasetColumn newColumn = mapper.toEntity(request);
    newColumn.setSchemaVersionId(newVersion.getId());
    newColumn.setDisplayOrder(currentColumns.size());
    newColumns.add(newColumn);
    
    columnRepository.saveAll(newColumns);
    return mapper.toResponse(newVersion, newColumns);
  }

  @Override
  @Transactional
  public DatasetSchemaResponse updateColumn(UUID projectPublicId, UUID columnPublicId, UpdateColumnRequest request) {
    Project project = getProjectOrThrow(projectPublicId);
    DatasetSchemaVersion currentVersion = schemaRepository.findTopByProjectIdOrderByVersionDesc(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_SCHEMA_NOT_FOUND));

    List<DatasetColumn> currentColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(currentVersion.getId());
    
    // Verify column exists in latest version
    boolean columnExists = currentColumns.stream().anyMatch(c -> c.getPublicId().equals(columnPublicId));
    if (!columnExists) {
      throw ResourceException.of(ErrorCode.COLUMN_NOT_FOUND);
    }

    // Create new version
    DatasetSchemaVersion newVersion = createNextVersion(project.getId(), currentVersion.getVersion() + 1);
    
    List<DatasetColumn> newColumns = new ArrayList<>();
    for (DatasetColumn col : currentColumns) {
      DatasetColumn copied = copyColumn(col, newVersion.getId());
      if (col.getPublicId().equals(columnPublicId)) {
        mapper.updateEntity(request, copied);
      }
      newColumns.add(copied);
    }

    // Re-sort and save
    newColumns.sort((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()));
    columnRepository.saveAll(newColumns);
    return mapper.toResponse(newVersion, newColumns);
  }

  @Override
  @Transactional
  public DatasetSchemaResponse deleteColumn(UUID projectPublicId, UUID columnPublicId) {
    Project project = getProjectOrThrow(projectPublicId);
    DatasetSchemaVersion currentVersion = schemaRepository.findTopByProjectIdOrderByVersionDesc(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_SCHEMA_NOT_FOUND));

    List<DatasetColumn> currentColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(currentVersion.getId());
    
    boolean columnExists = currentColumns.stream().anyMatch(c -> c.getPublicId().equals(columnPublicId));
    if (!columnExists) {
      throw ResourceException.of(ErrorCode.COLUMN_NOT_FOUND);
    }

    // Create new version
    DatasetSchemaVersion newVersion = createNextVersion(project.getId(), currentVersion.getVersion() + 1);
    
    List<DatasetColumn> newColumns = new ArrayList<>();
    int displayOrder = 0;
    for (DatasetColumn col : currentColumns) {
      if (!col.getPublicId().equals(columnPublicId)) {
        DatasetColumn copied = copyColumn(col, newVersion.getId());
        copied.setDisplayOrder(displayOrder++);
        newColumns.add(copied);
      }
    }

    columnRepository.saveAll(newColumns);
    return mapper.toResponse(newVersion, newColumns);
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private DatasetSchemaVersion createNextVersion(Long projectId, int versionNum) {
    return schemaRepository.save(DatasetSchemaVersion.builder()
        .projectId(projectId)
        .version(versionNum)
        .build());
  }

  private List<DatasetColumn> copyColumnsToNewVersion(List<DatasetColumn> sourceColumns, Long newVersionId) {
    List<DatasetColumn> copied = new ArrayList<>();
    for (DatasetColumn src : sourceColumns) {
      copied.add(copyColumn(src, newVersionId));
    }
    return copied;
  }

  private DatasetColumn copyColumn(DatasetColumn src, Long newVersionId) {
    return DatasetColumn.builder()
        // Intentionally leaving publicId out so a new one is generated by @Builder.Default, avoiding unique constraint violations.
        .schemaVersionId(newVersionId)
        .columnName(src.getColumnName())
        .displayName(src.getDisplayName())
        .dataType(src.getDataType())
        .role(src.getRole())
        .required(src.isRequired())
        .sampleValue(src.getSampleValue())
        .description(src.getDescription())
        .displayOrder(src.getDisplayOrder())
        .build();
  }
}
