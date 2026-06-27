package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import vn.vinfast.vfqc.api.shared.mail.model.MailRequest;
import vn.vinfast.vfqc.api.shared.mail.model.MailType;
import vn.vinfast.vfqc.api.shared.mail.service.MailService;
import vn.vinfast.vfqc.api.mapper.UserMapper;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.model.user.request.ForgotPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.LoginRequest;
import vn.vinfast.vfqc.api.model.user.request.ResetPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.VerifyEmailRequest;
import vn.vinfast.vfqc.api.model.user.response.LoginResponse;
import vn.vinfast.vfqc.api.model.user.response.LoginResult;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.AuthService;
import vn.vinfast.vfqc.api.service.EmailVerificationService;
import vn.vinfast.vfqc.api.service.PasswordResetService;
import vn.vinfast.vfqc.api.service.TokenService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private static final String TOKEN_TYPE = "Bearer";

  private final AuthenticationManager authenticationManager;
  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final TokenService jwtTokenService;
  private final EmailVerificationService emailVerificationService;
  private final PasswordResetService passwordResetService;
  private final MailService mailService;

  @Value("${vfqc.client.base-url}")
  private String clientBaseUrl;

  @Override
  @Transactional
  public LoginResult login(LoginRequest request) {
    String email = normalizeEmail(request.email());
    User user =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new ResourceException(ErrorCode.BAD_CREDENTIALS));
    if (user.getStatus() == UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new ResourceException(ErrorCode.EMAIL_NOT_VERIFIED);
    }
    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new ResourceException(ErrorCode.ACCOUNT_LOCKED);
    }

    try {
      authenticationManager.authenticate(
          UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
    } catch (AuthenticationException ex) {
      throw new ResourceException(ErrorCode.BAD_CREDENTIALS);
    }

    user.setLastLoginAt(OffsetDateTime.now());
    User saved = userRepository.save(user);

    String accessToken = jwtTokenService.createAccessToken(saved);
    String refreshToken = jwtTokenService.createRefreshToken(saved);
    LoginResponse response = buildLoginResponse(saved, accessToken);
    return new LoginResult(response, refreshToken, jwtTokenService.refreshTokenExpiresInSeconds());
  }

  @Override
  @Transactional
  public LoginResult refreshToken(String refreshToken) {
    log.info("Refresh token: {}", refreshToken);
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new ResourceException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    String email;
    try {
      email = jwtTokenService.readRefreshTokenSubject(refreshToken);
    } catch (JwtException ex) {
      throw new ResourceException(resolveRefreshTokenError(ex));
    }

    User user =
        userRepository
            .findByEmail(normalizeEmail(email))
            .orElseThrow(() -> new ResourceException(ErrorCode.INVALID_REFRESH_TOKEN));
    if (user.getStatus() == UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new ResourceException(ErrorCode.EMAIL_NOT_VERIFIED);
    }
    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new ResourceException(ErrorCode.ACCOUNT_LOCKED);
    }

    jwtTokenService.revokeRefreshToken(refreshToken);
    String newAccessToken = jwtTokenService.createAccessToken(user);
    String newRefreshToken = jwtTokenService.createRefreshToken(user);
    return new LoginResult(
        buildLoginResponse(user, newAccessToken),
        newRefreshToken,
        jwtTokenService.refreshTokenExpiresInSeconds());
  }

  @Override
  public void logout(String refreshToken) {
    jwtTokenService.revokeRefreshToken(refreshToken);
  }

  @Override
  @Transactional
  public void verifyEmail(VerifyEmailRequest request) {
    emailVerificationService.verifyEmail(request.token());
  }

  @Override
  @Transactional
  public void forgotPassword(ForgotPasswordRequest request) {
    String email = normalizeEmail(request.email());
    userRepository.findByEmail(email).ifPresent(this::sendPasswordReset);
  }

  @Override
  @Transactional
  public void resetPassword(ResetPasswordRequest request) {
    passwordResetService.resetPassword(request.token(), request.newPassword());
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase();
  }

  private LoginResponse buildLoginResponse(User user, String accessToken) {
    return new LoginResponse(
        accessToken,
        TOKEN_TYPE,
        jwtTokenService.accessTokenExpiresInSeconds(),
        userMapper.toResponse(user));
  }

  private ErrorCode resolveRefreshTokenError(JwtException ex) {
    String message = ex.getMessage();
    if (message != null && message.toLowerCase().contains("expired")) {
      return ErrorCode.REFRESH_TOKEN_EXPIRED;
    }
    return ErrorCode.INVALID_REFRESH_TOKEN;
  }

  private void sendPasswordReset(User user) {
    String rawToken = passwordResetService.createResetToken(user);
    try {
      mailService.send(
          MailType.PASSWORD_RESET,
          MailRequest.builder()
              .to(user.getEmail())
              .displayName(user.getDisplayName())
              .actionUrl(buildResetPasswordUrl(rawToken))
              .build());
    } catch (RuntimeException ex) {
      log.warn("Password reset email dispatch failed for user {}", user.getPublicId());
    }
  }

  private String buildResetPasswordUrl(String rawToken) {
    String baseUrl =
        clientBaseUrl == null || clientBaseUrl.isBlank() ? "http://localhost:5173" : clientBaseUrl;
    return UriComponentsBuilder.fromUriString(baseUrl)
        .path("/reset-password")
        .queryParam("token", rawToken)
        .build()
        .toUriString();
  }
}
