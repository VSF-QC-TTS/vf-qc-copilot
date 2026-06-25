package vn.vinfast.vfqc.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.targetconfig.response.TargetConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Mapper(componentModel = "spring")
public interface TargetConfigMapper {

  // Headers and query params are handled directly in the service to avoid JSON <-> Map mapping overhead in mapstruct
  @Mapping(target = "maskedHeaders", ignore = true)
  @Mapping(target = "maskedQueryParams", ignore = true)
  TargetConfigResponse toResponse(TargetConfig entity);
}
