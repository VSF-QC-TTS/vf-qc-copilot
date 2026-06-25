package vn.vinfast.vfqc.api.shared.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.NonNull;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Adds traceId to MDC for request log correlation.
 *
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/25/2026
 */
@Component
public class TraceIdFilter extends OncePerRequestFilter {

  public static final String TRACE_ID_KEY = "traceId";
  public static final String TRACE_ID_HEADER = "X-Trace-Id";

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    String traceId = resolveTraceId(request);

    try {
      MDC.put(TRACE_ID_KEY, traceId);
      response.setHeader(TRACE_ID_HEADER, traceId);

      filterChain.doFilter(request, response);
    } finally {
      MDC.remove(TRACE_ID_KEY);
    }
  }

  private String resolveTraceId(HttpServletRequest request) {
    String traceId = request.getHeader(TRACE_ID_HEADER);

    if (traceId == null || traceId.isBlank()) {
      return UUID.randomUUID().toString();
    }

    return traceId;
  }
}
