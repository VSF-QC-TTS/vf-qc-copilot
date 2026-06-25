package vn.vinfast.vfqc.api.shared;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ErrorResponse;
import vn.vinfast.vfqc.api.shared.web.TraceIdProvider;

/**
 * Handles authentication errors before request reaches controller layer.
 *
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  @Override
  public void commence(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull AuthenticationException authException)
      throws IOException {

    ErrorCode errorCode = resolveErrorCode(authException);

    log.debug(
        "Authentication failed: code={}, path={}, traceId={}, message={}",
        errorCode.getCode(),
        request.getRequestURI(),
        TraceIdProvider.currentTraceId(),
        authException.getMessage());

    ErrorResponse errorResponse =
        ErrorResponse.of(
            errorCode,
            errorCode.getDefaultDetail(),
            request.getRequestURI(),
            TraceIdProvider.currentTraceId());

    response.setStatus(errorCode.getStatus());
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");

    objectMapper.writeValue(response.getOutputStream(), errorResponse);
  }

  private ErrorCode resolveErrorCode(AuthenticationException exception) {
    if (exception instanceof InvalidBearerTokenException) {
      String message = exception.getMessage();

      if (message != null && message.toLowerCase().contains("expired")) {
        return ErrorCode.ACCESS_TOKEN_EXPIRED;
      }

      return ErrorCode.INVALID_ACCESS_TOKEN;
    }

    return ErrorCode.UNAUTHORIZED;
  }
}
