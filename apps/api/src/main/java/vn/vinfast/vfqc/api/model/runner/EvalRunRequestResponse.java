package vn.vinfast.vfqc.api.model.runner;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.ai.AiProvider;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.VerificationItemType;
import vn.vinfast.vfqc.api.model.verification.VerificationMode;

public record EvalRunRequestResponse(
    UUID runId,
    Long internalRunId,
    TargetConfigPayload targetConfig,
    AiConfigPayload aiConfig,
    List<DatasetRowPayload> datasetRows,
    List<SchemaColumnPayload> schemaColumns,
    VerificationPayload verification) {

  public record TargetConfigPayload(
      String method,
      String url,
      String headers,
      String queryParams,
      String bodyTemplate,
      String responsePath,
      Integer timeoutMs,
      Map<String, String> secrets) {}

  public record AiConfigPayload(
      AiProvider provider,
      String baseUrl,
      String evaluationModel,
      BigDecimal temperature,
      Integer maxTokens,
      Integer timeoutMs,
      Integer retryCount,
      String apiKey) {}

  public record DatasetRowPayload(UUID publicId, Long internalId, Integer rowIndex, String data) {}

  public record SchemaColumnPayload(UUID publicId, String columnName, String dataType, String role) {}

  public record VerificationPayload(
      VerificationMode mode,
      Integer version,
      List<VerificationItemPayload> items) {}

  public record VerificationItemPayload(
      UUID publicId,
      Long internalId,
      VerificationItemType type,
      String targetPaths,
      String referenceColumnKeys,
      String rubric,
      FieldAssertionPayload fieldAssertion) {}

  public record FieldAssertionPayload(
      String actualPath,
      CheckOperator operator,
      UUID expectedColumnKey) {}
}
