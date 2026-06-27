package vn.vinfast.vfqc.api.interfaces.dto.verification;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vinfast.vfqc.api.domain.verification.FieldCheckRule;
import vn.vinfast.vfqc.api.domain.verification.LlmRubricRule;
import vn.vinfast.vfqc.api.domain.verification.VerificationConfig;
import vn.vinfast.vfqc.api.interfaces.dto.verification.request.FieldCheckRuleRequest;
import vn.vinfast.vfqc.api.interfaces.dto.verification.request.LlmRubricRuleRequest;
import vn.vinfast.vfqc.api.interfaces.dto.verification.response.FieldCheckRuleResponse;
import vn.vinfast.vfqc.api.interfaces.dto.verification.response.LlmRubricRuleResponse;
import vn.vinfast.vfqc.api.interfaces.dto.verification.response.VerificationConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Mapper(componentModel = "spring")
public interface VerificationConfigMapper {

  FieldCheckRuleResponse toResponse(FieldCheckRule entity);

  LlmRubricRuleResponse toResponse(LlmRubricRule entity);

  @Mapping(target = "fieldChecks", source = "fieldChecks")
  @Mapping(target = "llmRubrics", source = "llmRubrics")
  VerificationConfigResponse toResponse(VerificationConfig config, List<FieldCheckRule> fieldChecks, List<LlmRubricRule> llmRubrics);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "verificationConfigId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  FieldCheckRule toEntity(FieldCheckRuleRequest request);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "publicId", ignore = true)
  @Mapping(target = "verificationConfigId", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  @Mapping(target = "updatedAt", ignore = true)
  LlmRubricRule toEntity(LlmRubricRuleRequest request);
}
