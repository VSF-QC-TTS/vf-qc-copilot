package vn.vinfast.vfqc.api.shared.web;

import org.slf4j.MDC;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public final class TraceIdProvider {

  private TraceIdProvider() {}

  public static String currentTraceId() {
    String traceId = MDC.get(TraceIdFilter.TRACE_ID_KEY);
    return traceId != null ? traceId : "N/A";
  }
}
