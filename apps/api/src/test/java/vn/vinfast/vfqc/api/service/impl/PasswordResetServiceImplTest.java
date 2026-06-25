package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.vinfast.vfqc.api.model.token.PasswordResetToken;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.repository.PasswordResetTokenRepository;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.OpaqueTokenService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

  @Mock private PasswordResetTokenRepository tokenRepository;
  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private OpaqueTokenService opaqueTokenService;

  private PasswordResetServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new PasswordResetServiceImpl(
            tokenRepository, userRepository, passwordEncoder, opaqueTokenService);
  }

  @Test
  void createResetTokenPersistsHashedToken() {
    User user = user();
    when(opaqueTokenService.generateRawToken()).thenReturn("raw-token");
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");

    String rawToken = service.createResetToken(user);

    assertThat(rawToken).isEqualTo("raw-token");
    ArgumentCaptor<PasswordResetToken> tokenCaptor =
        ArgumentCaptor.forClass(PasswordResetToken.class);
    verify(tokenRepository).save(tokenCaptor.capture());
    assertThat(tokenCaptor.getValue().getUser()).isEqualTo(user);
    assertThat(tokenCaptor.getValue().getTokenHash()).isEqualTo("hashed-token");
    assertThat(tokenCaptor.getValue().getExpiresAt()).isAfter(OffsetDateTime.now().plusMinutes(59));
  }

  @Test
  void resetPasswordRejectsInvalidToken() {
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.empty());

    assertResourceCode(
        () -> service.resetPassword("raw-token", "newPassword123"),
        ErrorCode.INVALID_PASSWORD_RESET_TOKEN);
  }

  @Test
  void resetPasswordRejectsUsedToken() {
    PasswordResetToken token = token(user(), OffsetDateTime.now().plusHours(1));
    token.setUsedAt(OffsetDateTime.now());
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

    assertResourceCode(
        () -> service.resetPassword("raw-token", "newPassword123"),
        ErrorCode.PASSWORD_RESET_TOKEN_USED);
  }

  @Test
  void resetPasswordRejectsExpiredToken() {
    PasswordResetToken token = token(user(), OffsetDateTime.now().minusSeconds(1));
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

    assertResourceCode(
        () -> service.resetPassword("raw-token", "newPassword123"),
        ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
  }

  @Test
  void resetPasswordUpdatesPasswordAndMarksTokenUsed() {
    User user = user();
    PasswordResetToken token = token(user, OffsetDateTime.now().plusHours(1));
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));
    when(passwordEncoder.encode("newPassword123")).thenReturn("new-hash");

    service.resetPassword("raw-token", "newPassword123");

    assertThat(user.getPasswordHash()).isEqualTo("new-hash");
    assertThat(token.getUsedAt()).isNotNull();
    verify(userRepository).save(user);
    verify(tokenRepository).save(token);
  }

  private static void assertResourceCode(Runnable action, ErrorCode expectedCode) {
    assertThatThrownBy(action::run)
        .isInstanceOf(ResourceException.class)
        .extracting("errorCode")
        .isEqualTo(expectedCode);
  }

  private static PasswordResetToken token(User user, OffsetDateTime expiresAt) {
    return PasswordResetToken.builder()
        .user(user)
        .tokenHash("hashed-token")
        .expiresAt(expiresAt)
        .build();
  }

  private static User user() {
    return User.builder()
        .publicId(UUID.randomUUID())
        .email("qc@example.com")
        .passwordHash("old-hash")
        .displayName("QC Demo")
        .role(Role.QC_MEMBER)
        .status(UserStatus.ACTIVE)
        .build();
  }
}
