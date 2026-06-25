package vn.vinfast.vfqc.api.shared.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/25/2026
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(name = "ErrorResponse", description = "Problem Details API error response")
public record ErrorResponse(
    @Schema(
            description = "Problem type URI.",
            example = "https://vfqc.vinfast.vn/errors/validation-error")
        URI type,
    @Schema(
            description = "Short, human-readable summary of the problem type.",
            example = "Validation error")
        String title,
    @Schema(description = "HTTP status code.", example = "400") int status,
    @Schema(description = "Application-specific error code.", example = "VALIDATION_ERROR")
        String code,
    @Schema(
            description = "Human-readable explanation of the specific error.",
            example = "Request validation failed.")
        String detail,
    @Schema(description = "Request path where the error occurred.", example = "/api/projects")
        String instance,
    @Schema(description = "Trace ID used for log correlation.", example = "7f2a9d8d0c4b4b13")
        String traceId,
    @Schema(description = "Error timestamp in ISO-8601 format.", example = "2026-05-24T10:30:00Z")
        OffsetDateTime timestamp,
    @Schema(description = "Field-level validation errors.") List<FieldErrorResponse> fieldErrors) {

  public static ErrorResponse of(
      ErrorCode errorCode, String detail, String instance, String traceId) {
    return new ErrorResponse(
        errorCode.getType(),
        errorCode.getTitle(),
        errorCode.getStatus(),
        errorCode.getCode(),
        detail != null ? detail : errorCode.getDefaultDetail(),
        instance,
        traceId,
        OffsetDateTime.now(),
        null);
  }

  public static ErrorResponse validation(
      String instance, String traceId, List<FieldErrorResponse> fieldErrors) {
    ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

    return new ErrorResponse(
        errorCode.getType(),
        errorCode.getTitle(),
        errorCode.getStatus(),
        errorCode.getCode(),
        errorCode.getDefaultDetail(),
        instance,
        traceId,
        OffsetDateTime.now(),
        fieldErrors);
  }

  @JsonInclude(JsonInclude.Include.NON_NULL)
  @Schema(name = "FieldErrorResponse", description = "Field-level validation error")
  public record FieldErrorResponse(
      @Schema(description = "Field path that failed validation.", example = "name") String field,
      @Schema(
              description = "Application-specific field error code.",
              example = "FIELD_VALIDATION_ERROR")
          String code,
      @Schema(
              description = "i18n message code used by frontend.",
              example = "validation.project.name.required")
          String messageCode,
      @Schema(
              description = "Fallback human-readable message.",
              example = "Project name is required.")
          String message,
      @Schema(description = "Rejected value. Sensitive values must be redacted.")
          Object rejectedValue,
      @Schema(
              description = "Parameters for frontend i18n interpolation.",
              example = "{min:3,max:100}")
          Map<String, Object> params) {}
}
