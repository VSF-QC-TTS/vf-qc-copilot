package vn.vinfast.vfqc.api.shared.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.vinfast.vfqc.api.shared.web.TraceIdProvider;

/**
 * Global API exception handler.
 *
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Slf4j
@RestControllerAdvice
public class GlobalException {

  private static final String REDACTED_VALUE = "<redacted>";

  @ExceptionHandler(ResourceException.class)
  public ResponseEntity<ErrorResponse> handleResourceException(
      ResourceException exception, HttpServletRequest request) {
    ErrorCode errorCode = exception.getErrorCode();

    if (errorCode.getHttpStatus().is5xxServerError()) {
      log.error(
          "ResourceException: code={}, path={}, traceId={}",
          errorCode.getCode(),
          request.getRequestURI(),
          TraceIdProvider.currentTraceId(),
          exception);
    } else {
      log.warn(
          "ResourceException: code={}, path={}, traceId={}, detail={}",
          errorCode.getCode(),
          request.getRequestURI(),
          TraceIdProvider.currentTraceId(),
          exception.getDetail());
    }

    ErrorResponse response =
        ErrorResponse.of(
            errorCode,
            exception.getDetail(),
            request.getRequestURI(),
            TraceIdProvider.currentTraceId());

    return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
      MethodArgumentNotValidException exception, HttpServletRequest request) {
    List<ErrorResponse.FieldErrorResponse> fieldErrors =
        exception.getBindingResult().getFieldErrors().stream()
            .map(this::toFieldErrorResponse)
            .toList();

    log.warn(
        "Validation error: path={}, traceId={}, fieldErrorCount={}",
        request.getRequestURI(),
        TraceIdProvider.currentTraceId(),
        fieldErrors.size());

    ErrorResponse response =
        ErrorResponse.validation(
            request.getRequestURI(), TraceIdProvider.currentTraceId(), fieldErrors);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolationException(
      ConstraintViolationException exception, HttpServletRequest request) {
    List<ErrorResponse.FieldErrorResponse> fieldErrors =
        exception.getConstraintViolations().stream()
            .map(
                violation ->
                    new ErrorResponse.FieldErrorResponse(
                        violation.getPropertyPath().toString(),
                        "FIELD_VALIDATION_ERROR",
                        violation.getMessage(),
                        violation.getMessage(),
                        safeRejectedValue(
                            violation.getInvalidValue(), violation.getPropertyPath().toString()),
                        Map.of()))
            .toList();

    log.warn(
        "Constraint violation: path={}, traceId={}, fieldErrorCount={}",
        request.getRequestURI(),
        TraceIdProvider.currentTraceId(),
        fieldErrors.size());

    ErrorResponse response =
        ErrorResponse.validation(
            request.getRequestURI(), TraceIdProvider.currentTraceId(), fieldErrors);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
      MissingServletRequestParameterException exception, HttpServletRequest request) {
    ErrorResponse.FieldErrorResponse fieldError =
        new ErrorResponse.FieldErrorResponse(
            exception.getParameterName(),
            "MISSING_REQUEST_PARAMETER",
            "validation.request.parameter.required",
            "Required request parameter is missing.",
            null,
            Map.of("parameter", exception.getParameterName()));

    ErrorResponse response =
        ErrorResponse.validation(
            request.getRequestURI(), TraceIdProvider.currentTraceId(), List.of(fieldError));

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
      HttpMessageNotReadableException exception, HttpServletRequest request) {
    log.warn(
        "Malformed JSON request: path={}, traceId={}, message={}",
        request.getRequestURI(),
        TraceIdProvider.currentTraceId(),
        exception.getMessage());

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.BAD_REQUEST,
            "Request body is malformed or unreadable.",
            request.getRequestURI(),
            TraceIdProvider.currentTraceId());

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpectedException(
      Exception exception, HttpServletRequest request) {
    log.error(
        "Unexpected exception: path={}, traceId={}",
        request.getRequestURI(),
        TraceIdProvider.currentTraceId(),
        exception);

    ErrorResponse response =
        ErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR,
            ErrorCode.INTERNAL_SERVER_ERROR.getDefaultDetail(),
            request.getRequestURI(),
            TraceIdProvider.currentTraceId());

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
  }

  private ErrorResponse.FieldErrorResponse toFieldErrorResponse(FieldError fieldError) {
    String messageCode =
        Objects.toString(fieldError.getDefaultMessage(), "validation.field.invalid");

    return new ErrorResponse.FieldErrorResponse(
        fieldError.getField(),
        "FIELD_VALIDATION_ERROR",
        messageCode,
        messageCode,
        safeRejectedValue(fieldError.getRejectedValue(), fieldError.getField()),
        Map.of());
  }

  private Object safeRejectedValue(Object rejectedValue, String fieldName) {
    if (rejectedValue == null) {
      return null;
    }

    if (isSensitiveField(fieldName)) {
      return REDACTED_VALUE;
    }

    String text = String.valueOf(rejectedValue);
    if (text.length() > 200) {
      return text.substring(0, 200) + "...";
    }

    return rejectedValue;
  }

  private boolean isSensitiveField(String fieldName) {
    String normalized = fieldName == null ? "" : fieldName.toLowerCase(Locale.ROOT);

    return normalized.contains("password")
        || normalized.contains("secret")
        || normalized.contains("token")
        || normalized.contains("apikey")
        || normalized.contains("authorization");
  }
}
