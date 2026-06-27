package vn.vinfast.vfqc.api.interfaces.dto.schema;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.vinfast.vfqc.api.domain.schema.ProjectSchema;
import vn.vinfast.vfqc.api.domain.schema.SchemaColumn;
import vn.vinfast.vfqc.api.interfaces.dto.schema.request.CreateSchemaColumnRequest;
import vn.vinfast.vfqc.api.interfaces.dto.schema.request.UpdateSchemaColumnRequest;
import vn.vinfast.vfqc.api.interfaces.dto.schema.response.ProjectSchemaResponse;
import vn.vinfast.vfqc.api.interfaces.dto.schema.response.SchemaColumnResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Mapper(componentModel = "spring")
public interface ProjectSchemaMapper {

  SchemaColumnResponse toResponse(SchemaColumn entity);

  @Mapping(target = "columns", source = "columns")
  ProjectSchemaResponse toResponse(ProjectSchema schema, List<SchemaColumn> columns);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "schemaVersionId", ignore = true)
  @Mapping(target = "displayOrder", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  SchemaColumn toEntity(CreateSchemaColumnRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "schemaVersionId", ignore = true)
  @Mapping(target = "displayOrder", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  void updateEntity(UpdateSchemaColumnRequest request, @MappingTarget SchemaColumn entity);
}
