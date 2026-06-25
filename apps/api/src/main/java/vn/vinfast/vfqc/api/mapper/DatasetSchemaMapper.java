package vn.vinfast.vfqc.api.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetColumn;
import vn.vinfast.vfqc.api.model.datasetschema.DatasetSchemaVersion;
import vn.vinfast.vfqc.api.model.datasetschema.request.CreateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.request.UpdateColumnRequest;
import vn.vinfast.vfqc.api.model.datasetschema.response.DatasetColumnResponse;
import vn.vinfast.vfqc.api.model.datasetschema.response.DatasetSchemaResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Mapper(componentModel = "spring")
public interface DatasetSchemaMapper {

  DatasetColumnResponse toResponse(DatasetColumn entity);

  @Mapping(target = "columns", source = "columns")
  DatasetSchemaResponse toResponse(DatasetSchemaVersion version, List<DatasetColumn> columns);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "schemaVersionId", ignore = true)
  @Mapping(target = "displayOrder", ignore = true) // Handled in service
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  DatasetColumn toEntity(CreateColumnRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "schemaVersionId", ignore = true)
  @Mapping(target = "columnName", ignore = true) // Cannot change name
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  void updateEntity(UpdateColumnRequest request, @org.mapstruct.MappingTarget DatasetColumn entity);
}
