package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.oauth2.jwt.BadJwtException;
import vn.vinfast.vfqc.api.shared.mail.model.MailType;
import vn.vinfast.vfqc.api.shared.mail.service.MailService;
import vn.vinfast.vfqc.api.mapper.UserMapper;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.model.user.request.ForgotPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.LoginRequest;
import vn.vinfast.vfqc.api.model.user.request.ResetPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.VerifyEmailRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.EmailVerificationService;
import vn.vinfast.vfqc.api.service.PasswordResetService;
import vn.vinfast.vfqc.api.service.TokenService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

  @Mock private AuthenticationManager authenticationManager;
  @Mock private UserRepository userRepository;
  @Mock private UserMapper userMapper;
  @Mock private TokenService tokenService;
  @Mock private EmailVerificationService emailVerificationService;
  @Mock private PasswordResetService passwordResetService;
  @Mock private MailService mailService;

  private AuthServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new AuthServiceImpl(
            authenticationManager,
            userRepository,
            userMapper,
            tokenService,
            emailVerificationService,
            passwordResetService,
            mailService);
  }

  @Test
  void loginThrowsBadCredentialsWhenEmailDoesNotExist() {
    when(userRepository.findByEmail("qc@example.com")).thenReturn(Optional.empty());

    assertResourceCode(
        () -> service.login(new LoginRequest(" QC@example.com ", "password123")),
        ErrorCode.BAD_CREDENTIALS);
  }

  @Test
  void loginWrapsAuthenticationFailureAsBadCredentials() {
    User user = user(UserStatus.ACTIVE);
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    when(authenticationManager.authenticate(any()))
        .thenThrow(new BadCredentialsException("bad password"));

    assertResourceCode(
        () -> service.login(new LoginRequest(user.getEmail(), "wrongPassword")),
        ErrorCode.BAD_CREDENTIALS);
  }

  @Test
  void loginRejectsPendingEmailVerification() {
    User user = user(UserStatus.PENDING_EMAIL_VERIFICATION);
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

    assertResourceCode(
        () -> service.login(new LoginRequest(user.getEmail(), "password123")),
        ErrorCode.EMAIL_NOT_VERIFIED);
    verify(authenticationManager, never()).authenticate(any());
  }

  @Test
  void loginRejectsDisabledAccount() {
    User user = user(UserStatus.DISABLED);
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

    assertResourceCode(
        () -> service.login(new LoginRequest(user.getEmail(), "password123")),
        ErrorCode.ACCOUNT_LOCKED);
  }

  @Test
  void loginReturnsTokensAndUserPayload() {
    User user = user(UserStatus.ACTIVE);
    User saved = user(UserStatus.ACTIVE);
    UserResponse response = response(saved);
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    when(userRepository.save(user)).thenReturn(saved);
    when(tokenService.createAccessToken(saved)).thenReturn("access-token");
    when(tokenService.createRefreshToken(saved)).thenReturn("refresh-token");
    when(tokenService.accessTokenExpiresInSeconds()).thenReturn(900L);
    when(tokenService.refreshTokenExpiresInSeconds()).thenReturn(3600L);
    when(userMapper.toResponse(saved)).thenReturn(response);

    var result = service.login(new LoginRequest(user.getEmail(), "password123"));

    assertThat(result.response().accessToken()).isEqualTo("access-token");
    assertThat(result.response().tokenType()).isEqualTo("Bearer");
    assertThat(result.response().expiresInSeconds()).isEqualTo(900L);
    assertThat(result.response().user()).isEqualTo(response);
    assertThat(result.refreshToken()).isEqualTo("refresh-token");
    assertThat(result.refreshTokenMaxAgeSeconds()).isEqualTo(3600L);
    assertThat(user.getLastLoginAt()).isNotNull();
  }

  @Test
  void refreshTokenRejectsBlankToken() {
    assertResourceCode(() -> service.refreshToken(" "), ErrorCode.INVALID_REFRESH_TOKEN);
  }

  @Test
  void refreshTokenMapsExpiredJwtException() {
    when(tokenService.readRefreshTokenSubject("expired")).thenThrow(new BadJwtException("expired"));

    assertResourceCode(() -> service.refreshToken("expired"), ErrorCode.REFRESH_TOKEN_EXPIRED);
  }

  @Test
  void refreshTokenRotatesRefreshToken() {
    User user = user(UserStatus.ACTIVE);
    UserResponse response = response(user);
    when(tokenService.readRefreshTokenSubject("old-refresh")).thenReturn(user.getEmail());
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    when(tokenService.createAccessToken(user)).thenReturn("new-access");
    when(tokenService.createRefreshToken(user)).thenReturn("new-refresh");
    when(tokenService.accessTokenExpiresInSeconds()).thenReturn(900L);
    when(tokenService.refreshTokenExpiresInSeconds()).thenReturn(3600L);
    when(userMapper.toResponse(user)).thenReturn(response);

    var result = service.refreshToken("old-refresh");

    assertThat(result.response().accessToken()).isEqualTo("new-access");
    assertThat(result.refreshToken()).isEqualTo("new-refresh");
    verify(tokenService).revokeRefreshToken("old-refresh");
  }

  @Test
  void logoutRevokesRefreshToken() {
    service.logout("refresh-token");

    verify(tokenService).revokeRefreshToken("refresh-token");
  }

  @Test
  void verifyEmailDelegatesToEmailVerificationService() {
    service.verifyEmail(new VerifyEmailRequest("raw-token"));

    verify(emailVerificationService).verifyEmail("raw-token");
  }

  @Test
  void forgotPasswordDoesNothingForUnknownEmail() {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    service.forgotPassword(new ForgotPasswordRequest("missing@example.com"));

    verify(passwordResetService, never()).createResetToken(any());
    verify(mailService, never()).send(eq(MailType.PASSWORD_RESET), any());
  }

  @Test
  void forgotPasswordCreatesTokenAndSendsMailForExistingUser() {
    User user = user(UserStatus.ACTIVE);
    when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    when(passwordResetService.createResetToken(user)).thenReturn("reset-token");

    service.forgotPassword(new ForgotPasswordRequest(user.getEmail()));

    verify(mailService).send(eq(MailType.PASSWORD_RESET), any());
  }

  @Test
  void resetPasswordDelegatesToPasswordResetService() {
    service.resetPassword(new ResetPasswordRequest("raw-token", "newPassword123"));

    verify(passwordResetService).resetPassword("raw-token", "newPassword123");
  }

  private static void assertResourceCode(Runnable action, ErrorCode expectedCode) {
    assertThatThrownBy(action::run)
        .isInstanceOf(ResourceException.class)
        .extracting("errorCode")
        .isEqualTo(expectedCode);
  }

  private static User user(UserStatus status) {
    return User.builder()
        .publicId(UUID.randomUUID())
        .email("qc@example.com")
        .passwordHash("{noop}password123")
        .displayName("QC Demo")
        .role(Role.QC_MEMBER)
        .status(status)
        .build();
  }

  private static UserResponse response(User user) {
    return new UserResponse(
        user.getPublicId(),
        user.getEmail(),
        user.getDisplayName(),
        null,
        user.getRole(),
        user.getStatus(),
        OffsetDateTime.now());
  }
}
