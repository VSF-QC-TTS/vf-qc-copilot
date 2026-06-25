package vn.vinfast.vfqc.api.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vinfast.vfqc.api.model.judgeconfig.JudgeConfig;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Mapper(componentModel = "spring")
public interface JudgeConfigMapper {

  @Mapping(target = "hasApiKey", ignore = true) // Will be mapped in the service
  JudgeConfigResponse toResponse(JudgeConfig entity);
}
