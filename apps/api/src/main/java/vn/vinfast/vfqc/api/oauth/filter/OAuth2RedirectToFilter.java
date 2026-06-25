package vn.vinfast.vfqc.api.oauth.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Captures the client route that initiated OAuth login so the success handler can return the
 * browser to that route after the provider callback.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/23/2026
 */
@Component
public class OAuth2RedirectToFilter extends OncePerRequestFilter {

  public static final String REDIRECT_TO_SESSION_ATTRIBUTE = "VFQC_OAUTH2_REDIRECT_TO";

  private static final String OAUTH_AUTHORIZATION_PATH = "/api/v1/oauth2/authorization/";
  private static final String REDIRECT_TO_PARAMETER = "redirectTo";
  private static final int MAX_REDIRECT_TO_LENGTH = 2048;

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    String redirectTo = request.getParameter(REDIRECT_TO_PARAMETER);
    if (isOAuthAuthorizationRequest(request) && isSafeClientPath(redirectTo)) {
      request.getSession(true).setAttribute(REDIRECT_TO_SESSION_ATTRIBUTE, redirectTo);
    }

    filterChain.doFilter(request, response);
  }

  private boolean isOAuthAuthorizationRequest(HttpServletRequest request) {
    return "GET".equalsIgnoreCase(request.getMethod())
        && request.getServletPath().startsWith(OAUTH_AUTHORIZATION_PATH);
  }

  private boolean isSafeClientPath(String redirectTo) {
    return redirectTo != null
        && !redirectTo.isBlank()
        && redirectTo.length() <= MAX_REDIRECT_TO_LENGTH
        && redirectTo.startsWith("/")
        && !redirectTo.startsWith("//")
        && !redirectTo.contains("\r")
        && !redirectTo.contains("\n");
  }
}
