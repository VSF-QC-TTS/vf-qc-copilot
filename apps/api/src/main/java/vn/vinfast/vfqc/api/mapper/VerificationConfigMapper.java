package vn.vinfast.vfqc.api.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vinfast.vfqc.api.model.verificationconfig.FieldCheck;
import vn.vinfast.vfqc.api.model.verificationconfig.LlmRubric;
import vn.vinfast.vfqc.api.model.verificationconfig.VerificationConfig;
import vn.vinfast.vfqc.api.model.verificationconfig.request.FieldCheckRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.request.LlmRubricRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.response.FieldCheckResponse;
import vn.vinfast.vfqc.api.model.verificationconfig.response.LlmRubricResponse;
import vn.vinfast.vfqc.api.model.verificationconfig.response.VerificationConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Mapper(componentModel = "spring")
public interface VerificationConfigMapper {

  FieldCheckResponse toResponse(FieldCheck entity);

  LlmRubricResponse toResponse(LlmRubric entity);

  @Mapping(target = "fieldChecks", source = "fieldChecks")
  @Mapping(target = "llmRubrics", source = "llmRubrics")
  VerificationConfigResponse toResponse(VerificationConfig config, List<FieldCheck> fieldChecks, List<LlmRubric> llmRubrics);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "verificationConfigId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  FieldCheck toEntity(FieldCheckRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "verificationConfigId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  LlmRubric toEntity(LlmRubricRequest request);
}
