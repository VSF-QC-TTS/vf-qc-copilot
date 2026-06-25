package vn.vinfast.vfqc.api.oauth.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.oauth.filter.OAuth2RedirectToFilter;
import vn.vinfast.vfqc.api.oauth.profile.OAuth2UserProfile;
import vn.vinfast.vfqc.api.oauth.profile.OAuth2UserProfileService;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.TokenService;
import vn.vinfast.vfqc.api.shared.cookie.AuthCookieFactory;

/**
 * Handles successful OAuth2 logins by finding or creating a local user, issuing JWT tokens, and
 * redirecting to the client dashboard.
 *
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

  private static final int MAX_DISPLAY_NAME_LENGTH = 255;
  private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
  private static final String LEGACY_OAUTH_REFRESH_COOKIE_PATH = "/api/v1/auth/refresh-token";
  private static final int MAX_REDIRECT_TO_LENGTH = 2048;

  @Value("${vfqc.client.base-url}")
  private String webBaseUrl;

  @Value("${vfqc.security.cookie.secure}")
  private boolean cookieSecure;

  @Value("${vfqc.security.cookie.same-site:Lax}")
  private String sameSite;

  private final OAuth2UserProfileService oAuth2UserProfileService;
  private final UserRepository userRepository;
  private final TokenService jwtTokenService;
  private final PasswordEncoder passwordEncoder;
  private final AuthCookieFactory authCookieFactory;

  @Override
  @Transactional
  public void onAuthenticationSuccess(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull Authentication authentication)
      throws IOException {

    OAuth2UserProfile profile = oAuth2UserProfileService.extract(authentication);
    String email = profile.email();

    if (email == null) {
      log.error("OAuth2 login failed: no email attribute from provider {}", profile.provider());
      response.sendRedirect(webBaseUrl + "/login?error=oauth_no_email");
      return;
    }

    User user = getOrCreateUser(profile);

    String refreshToken = jwtTokenService.createRefreshToken(user);

    response.addHeader(
        HttpHeaders.SET_COOKIE,
        authCookieFactory
            .refreshTokenCookie(refreshToken, jwtTokenService.refreshTokenExpiresInSeconds())
            .toString());
    response.addHeader(HttpHeaders.SET_COOKIE, clearLegacyOAuthRefreshCookie().toString());

    var session = request.getSession(false);
    String redirectTo = resolveRedirectTo(session);
    if (session != null) {
      session.invalidate();
    }

    log.info("OAuth2 login success for user: {} (provider: {})", email, profile.provider());
    response.sendRedirect(webBaseUrl + redirectTo);
  }

  // ---------------------------------------------------------------------------
  // User persistence
  // ---------------------------------------------------------------------------

  private User getOrCreateUser(OAuth2UserProfile profile) {
    String normalizedEmail = profile.email().toLowerCase();
    return userRepository
        .findByEmail(normalizedEmail)
        .map(existing -> updateExistingUser(existing, profile))
        .orElseGet(() -> createNewUser(normalizedEmail, profile));
  }

  private User updateExistingUser(User user, OAuth2UserProfile profile) {
    if (profile.avatarUrl() != null) {
      user.setAvatarUrl(profile.avatarUrl());
    }
    user.setLastLoginAt(OffsetDateTime.now());
    return userRepository.save(user);
  }

  private User createNewUser(String email, OAuth2UserProfile profile) {
    String displayName = buildDisplayName(profile, email);
    User user =
        User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
            .displayName(displayName)
            .avatarUrl(profile.avatarUrl())
            .role(Role.QC_MEMBER)
            .status(UserStatus.ACTIVE)
            .lastLoginAt(OffsetDateTime.now())
            .build();

    User saved = userRepository.save(user);
    log.info("Created OAuth2 user {} with email {}", saved.getPublicId(), email);
    return saved;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private String buildDisplayName(OAuth2UserProfile profile, String email) {
    String firstName = profile.firstName() != null ? profile.firstName().trim() : "";
    String lastName = profile.lastName() != null ? profile.lastName().trim() : "";
    String fullName = (firstName + " " + lastName).trim();

    if (fullName.isBlank()) {
      fullName = email.split("@")[0];
    }

    return fullName.length() > MAX_DISPLAY_NAME_LENGTH
        ? fullName.substring(0, MAX_DISPLAY_NAME_LENGTH)
        : fullName;
  }

  private ResponseCookie clearLegacyOAuthRefreshCookie() {
    return ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
        .httpOnly(true)
        .secure(cookieSecure)
        .path(LEGACY_OAUTH_REFRESH_COOKIE_PATH)
        .maxAge(0)
        .sameSite(sameSite)
        .build();
  }

  private String resolveRedirectTo(HttpSession session) {
    if (session == null) {
      return "/";
    }

    Object redirectTo = session.getAttribute(OAuth2RedirectToFilter.REDIRECT_TO_SESSION_ATTRIBUTE);
    session.removeAttribute(OAuth2RedirectToFilter.REDIRECT_TO_SESSION_ATTRIBUTE);
    return redirectTo instanceof String path && isSafeClientPath(path) ? path : "/";
  }

  private boolean isSafeClientPath(String redirectTo) {
    return !redirectTo.isBlank()
        && redirectTo.length() <= MAX_REDIRECT_TO_LENGTH
        && redirectTo.startsWith("/")
        && !redirectTo.startsWith("//")
        && !redirectTo.contains("\r")
        && !redirectTo.contains("\n");
  }
}
