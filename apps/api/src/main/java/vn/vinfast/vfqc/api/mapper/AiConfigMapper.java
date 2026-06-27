package vn.vinfast.vfqc.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.ai.response.AiConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Mapper(componentModel = "spring")
public interface AiConfigMapper {

  @Mapping(target = "hasApiKey", ignore = true) // Set manually in service
  AiConfigResponse toResponse(AiConfig entity);
}
