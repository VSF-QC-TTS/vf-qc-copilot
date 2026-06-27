package vn.vinfast.vfqc.api.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.model.verification.VerificationConfig;
import vn.vinfast.vfqc.api.model.verification.VerificationFieldAssertion;
import vn.vinfast.vfqc.api.model.verification.VerificationItem;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;
import vn.vinfast.vfqc.api.model.verification.VerificationLlmCriterion;
import vn.vinfast.vfqc.api.model.verification.request.ExpectedValueRequest;
import vn.vinfast.vfqc.api.model.verification.request.FieldAssertionRequest;
import vn.vinfast.vfqc.api.model.verification.request.LlmCriterionRequest;
import vn.vinfast.vfqc.api.model.verification.request.VerificationItemRequest;
import vn.vinfast.vfqc.api.model.verification.response.ExpectedValueResponse;
import vn.vinfast.vfqc.api.model.verification.response.FieldAssertionResponse;
import vn.vinfast.vfqc.api.model.verification.response.LlmCriterionResponse;
import vn.vinfast.vfqc.api.model.verification.response.VerificationConfigResponse;
import vn.vinfast.vfqc.api.model.verification.response.VerificationItemResponse;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * Maps verification config v2 request/entity/response objects.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/28/2026
 */
@Component
@RequiredArgsConstructor
public class VerificationConfigMapper {

  private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};
  private static final TypeReference<List<UUID>> UUID_LIST_TYPE = new TypeReference<>() {};

  private final ObjectMapper objectMapper;

  public VerificationItem toItem(Long configId, VerificationItemRequest request) {
    VerificationItem item =
        VerificationItem.builder()
            .verificationConfigId(configId)
            .type(request.type())
            .name(request.name())
            .enabled(request.enabled())
            .critical(request.critical())
            .weight(request.weight())
            .threshold(request.threshold())
            .displayOrder(request.displayOrder())
            .aggregation(request.aggregation())
            .minPassCount(request.minPassCount())
            .targetPaths(toJson(request.targetPaths()))
            .referenceColumnKeys(toJson(request.referenceColumnKeys()))
            .rubric(request.rubric())
            .build();
    if (request.publicId() != null) {
      item.setPublicId(request.publicId());
    }
    return item;
  }

  public VerificationFieldAssertion toAssertion(Long itemId, FieldAssertionRequest request) {
    ExpectedValueRequest expected = request.expected();
    VerificationFieldAssertion assertion =
        VerificationFieldAssertion.builder()
            .verificationItemId(itemId)
            .actualPath(request.actualPath())
            .operator(request.operator())
            .expectedSource(expected == null ? null : expected.source())
            .expectedColumnKey(expected == null ? null : expected.columnKey())
            .expectedValue(expected == null ? null : expected.value())
            .expectedTemplate(expected == null ? null : expected.template())
            .threshold(request.threshold())
            .weight(request.weight())
            .enabled(request.enabled())
            .displayOrder(request.displayOrder())
            .build();
    if (request.publicId() != null) {
      assertion.setPublicId(request.publicId());
    }
    return assertion;
  }

  public VerificationLlmCriterion toCriterion(Long itemId, LlmCriterionRequest request) {
    VerificationLlmCriterion criterion =
        VerificationLlmCriterion.builder()
            .verificationItemId(itemId)
            .name(request.name())
            .description(request.description())
            .weight(request.weight())
            .enabled(request.enabled())
            .displayOrder(request.displayOrder())
            .build();
    if (request.publicId() != null) {
      criterion.setPublicId(request.publicId());
    }
    return criterion;
  }

  public VerificationConfigResponse toResponse(
      VerificationConfig config,
      List<VerificationItem> items,
      Map<Long, List<VerificationFieldAssertion>> assertionsByItem,
      Map<Long, List<VerificationLlmCriterion>> criteriaByItem) {
    List<VerificationItemResponse> itemResponses =
        items.stream()
            .map(item -> toItemResponse(item, assertionsByItem, criteriaByItem))
            .toList();

    return new VerificationConfigResponse(
        config.getPublicId(),
        config.getVersion(),
        config.getMode(),
        config.getThreshold(),
        itemResponses,
        config.getCreatedAt(),
        config.getUpdatedAt());
  }

  private VerificationItemResponse toItemResponse(
      VerificationItem item,
      Map<Long, List<VerificationFieldAssertion>> assertionsByItem,
      Map<Long, List<VerificationLlmCriterion>> criteriaByItem) {
    List<FieldAssertionResponse> assertions =
        assertionsByItem.getOrDefault(item.getId(), List.of()).stream()
            .sorted(Comparator.comparing(VerificationFieldAssertion::getDisplayOrder))
            .map(this::toAssertionResponse)
            .toList();
    List<LlmCriterionResponse> criteria =
        criteriaByItem.getOrDefault(item.getId(), List.of()).stream()
            .sorted(Comparator.comparing(VerificationLlmCriterion::getDisplayOrder))
            .map(this::toCriterionResponse)
            .toList();

    return new VerificationItemResponse(
        item.getPublicId(),
        item.getType(),
        item.getName(),
        item.isEnabled(),
        item.isCritical(),
        item.getWeight(),
        item.getThreshold(),
        item.getDisplayOrder(),
        item.getAggregation(),
        item.getMinPassCount(),
        item.getType() == VerificationItemType.FIELD_ASSERTION && !assertions.isEmpty()
            ? assertions.getFirst()
            : null,
        item.getType() == VerificationItemType.FIELD_ASSERTION_GROUP ? assertions : List.of(),
        fromJson(item.getTargetPaths(), STRING_LIST_TYPE),
        fromJson(item.getReferenceColumnKeys(), UUID_LIST_TYPE),
        item.getRubric(),
        criteria);
  }

  private FieldAssertionResponse toAssertionResponse(VerificationFieldAssertion assertion) {
    return new FieldAssertionResponse(
        assertion.getPublicId(),
        assertion.getActualPath(),
        assertion.getOperator(),
        new ExpectedValueResponse(
            assertion.getExpectedSource(),
            assertion.getExpectedColumnKey(),
            assertion.getExpectedValue(),
            assertion.getExpectedTemplate()),
        assertion.getThreshold(),
        assertion.getWeight(),
        assertion.isEnabled(),
        assertion.getDisplayOrder());
  }

  private LlmCriterionResponse toCriterionResponse(VerificationLlmCriterion criterion) {
    return new LlmCriterionResponse(
        criterion.getPublicId(),
        criterion.getName(),
        criterion.getDescription(),
        criterion.getWeight(),
        criterion.isEnabled(),
        criterion.getDisplayOrder());
  }

  private String toJson(Object value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException e) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Could not serialize verification config.");
    }
  }

  private <T> T fromJson(String value, TypeReference<T> typeReference) {
    if (!StringUtils.hasText(value)) {
      try {
        return objectMapper.readValue("[]", typeReference);
      } catch (JsonProcessingException e) {
        throw new IllegalStateException("Failed to initialize empty list", e);
      }
    }
    try {
      return objectMapper.readValue(value, typeReference);
    } catch (JsonProcessingException e) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Could not parse verification config JSON.");
    }
  }
}
