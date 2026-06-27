package vn.vinfast.vfqc.api.application.schema;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.domain.schema.ProjectSchema;
import vn.vinfast.vfqc.api.domain.schema.SchemaColumn;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaProjectSchemaRepository;
import vn.vinfast.vfqc.api.infrastructure.persistence.JpaSchemaColumnRepository;
import vn.vinfast.vfqc.api.interfaces.dto.schema.ProjectSchemaMapper;
import vn.vinfast.vfqc.api.interfaces.dto.schema.request.CreateSchemaColumnRequest;
import vn.vinfast.vfqc.api.interfaces.dto.schema.request.UpdateSchemaColumnRequest;
import vn.vinfast.vfqc.api.interfaces.dto.schema.response.ProjectSchemaResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectSchemaServiceImpl implements ProjectSchemaService {

  private final ProjectRepository projectRepository;
  private final JpaProjectSchemaRepository schemaRepository;
  private final JpaSchemaColumnRepository columnRepository;
  private final ProjectSchemaMapper mapper;

  @Override
  @Transactional(readOnly = true)
  public ProjectSchemaResponse getLatestSchema(UUID projectPublicId) {
    log.debug("Fetching latest project schema for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);

    Optional<ProjectSchema> latestVersionOpt = schemaRepository.findByProjectId(project.getId());
    if (latestVersionOpt.isEmpty()) {
      return ProjectSchemaResponse.empty();
    }
    
    ProjectSchema latestVersion = latestVersionOpt.get();
    List<SchemaColumn> columns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(latestVersion.getId());
    return mapper.toResponse(latestVersion, columns);
  }

  @Override
  @Transactional
  public ProjectSchemaResponse addColumn(UUID projectPublicId, CreateSchemaColumnRequest request) {
    log.info("Adding column '{}' to schema for project: {}", request.columnName(), projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);

    ProjectSchema schema = schemaRepository.findByProjectId(project.getId())
        .orElseGet(() -> schemaRepository.save(ProjectSchema.builder()
            .projectId(project.getId())
            .version(1)
            .build()));

    List<SchemaColumn> currentColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId());

    boolean nameExists = currentColumns.stream()
        .anyMatch(c -> c.getColumnName().equalsIgnoreCase(request.columnName()));
    if (nameExists) {
      throw ResourceException.of(ErrorCode.DUPLICATE_COLUMN_NAME);
    }

    SchemaColumn newColumn = mapper.toEntity(request);
    newColumn.setSchemaVersionId(schema.getId());
    newColumn.setDisplayOrder(currentColumns.size());
    if (newColumn.getDataType() == null || newColumn.getDataType().isBlank()) {
      newColumn.setDataType("STRING");
    } else {
      newColumn.setDataType(newColumn.getDataType().trim().toUpperCase());
    }
    if (newColumn.getRole() == null || newColumn.getRole().isBlank()) {
      newColumn.setRole("EXPECTED");
    } else {
      newColumn.setRole(newColumn.getRole().trim().toUpperCase());
    }
    columnRepository.save(newColumn);

    schema.bumpVersion();
    schemaRepository.save(schema);

    List<SchemaColumn> updatedColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId());
    return mapper.toResponse(schema, updatedColumns);
  }

  @Override
  @Transactional
  public ProjectSchemaResponse updateColumn(UUID projectPublicId, UUID columnPublicId, UpdateSchemaColumnRequest request) {
    log.info("Updating column '{}' for project: {}", columnPublicId, projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    ProjectSchema schema = schemaRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_SCHEMA_NOT_FOUND));

    List<SchemaColumn> currentColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId());

    SchemaColumn target = currentColumns.stream()
        .filter(c -> c.getPublicId().equals(columnPublicId))
        .findFirst()
        .orElseThrow(() -> ResourceException.of(ErrorCode.COLUMN_NOT_FOUND));

    // Check duplicate name
    if (request.columnName() != null && !request.columnName().equalsIgnoreCase(target.getColumnName())) {
      boolean nameExists = currentColumns.stream()
          .anyMatch(c -> c.getColumnName().equalsIgnoreCase(request.columnName()));
      if (nameExists) {
        throw ResourceException.of(ErrorCode.DUPLICATE_COLUMN_NAME);
      }
    }

    mapper.updateEntity(request, target);
    if (target.getDataType() == null || target.getDataType().isBlank()) {
      target.setDataType("STRING");
    } else {
      target.setDataType(target.getDataType().trim().toUpperCase());
    }
    if (target.getRole() == null || target.getRole().isBlank()) {
      target.setRole("EXPECTED");
    } else {
      target.setRole(target.getRole().trim().toUpperCase());
    }
    columnRepository.save(target);

    schema.bumpVersion();
    schemaRepository.save(schema);

    List<SchemaColumn> updatedColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId());
    return mapper.toResponse(schema, updatedColumns);
  }

  @Override
  @Transactional
  public ProjectSchemaResponse deleteColumn(UUID projectPublicId, UUID columnPublicId) {
    log.info("Deleting column '{}' for project: {}", columnPublicId, projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    ProjectSchema schema = schemaRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_SCHEMA_NOT_FOUND));

    List<SchemaColumn> currentColumns = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId());

    SchemaColumn target = currentColumns.stream()
        .filter(c -> c.getPublicId().equals(columnPublicId))
        .findFirst()
        .orElseThrow(() -> ResourceException.of(ErrorCode.COLUMN_NOT_FOUND));

    columnRepository.delete(target);

    // Reorder remaining
    List<SchemaColumn> remaining = columnRepository.findBySchemaVersionIdOrderByDisplayOrderAsc(schema.getId());
    for (int i = 0; i < remaining.size(); i++) {
      remaining.get(i).setDisplayOrder(i);
    }
    columnRepository.saveAll(remaining);

    schema.bumpVersion();
    schemaRepository.save(schema);

    return mapper.toResponse(schema, remaining);
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }
}
