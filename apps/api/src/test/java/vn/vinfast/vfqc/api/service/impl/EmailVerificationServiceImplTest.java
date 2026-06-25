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
import vn.vinfast.vfqc.api.model.token.EmailVerificationToken;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.repository.EmailVerificationTokenRepository;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.OpaqueTokenService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceImplTest {

  @Mock private EmailVerificationTokenRepository tokenRepository;
  @Mock private UserRepository userRepository;
  @Mock private OpaqueTokenService opaqueTokenService;

  private EmailVerificationServiceImpl service;

  @BeforeEach
  void setUp() {
    service = new EmailVerificationServiceImpl(tokenRepository, userRepository, opaqueTokenService);
  }

  @Test
  void createVerificationTokenPersistsHashedToken() {
    User user = user();
    when(opaqueTokenService.generateRawToken()).thenReturn("raw-token");
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");

    String rawToken = service.createVerificationToken(user);

    assertThat(rawToken).isEqualTo("raw-token");
    ArgumentCaptor<EmailVerificationToken> tokenCaptor =
        ArgumentCaptor.forClass(EmailVerificationToken.class);
    verify(tokenRepository).save(tokenCaptor.capture());
    assertThat(tokenCaptor.getValue().getUser()).isEqualTo(user);
    assertThat(tokenCaptor.getValue().getTokenHash()).isEqualTo("hashed-token");
    assertThat(tokenCaptor.getValue().getExpiresAt()).isAfter(OffsetDateTime.now().plusHours(23));
  }

  @Test
  void verifyEmailRejectsInvalidToken() {
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.empty());

    assertResourceCode(
        () -> service.verifyEmail("raw-token"), ErrorCode.INVALID_EMAIL_VERIFICATION_TOKEN);
  }

  @Test
  void verifyEmailRejectsUsedToken() {
    EmailVerificationToken token = token(user(), OffsetDateTime.now().plusHours(1));
    token.setUsedAt(OffsetDateTime.now());
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

    assertResourceCode(
        () -> service.verifyEmail("raw-token"), ErrorCode.EMAIL_VERIFICATION_TOKEN_USED);
  }

  @Test
  void verifyEmailRejectsExpiredToken() {
    EmailVerificationToken token = token(user(), OffsetDateTime.now().minusSeconds(1));
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

    assertResourceCode(
        () -> service.verifyEmail("raw-token"), ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
  }

  @Test
  void verifyEmailActivatesUserAndMarksTokenUsed() {
    User user = user();
    EmailVerificationToken token = token(user, OffsetDateTime.now().plusHours(1));
    when(opaqueTokenService.hash("raw-token")).thenReturn("hashed-token");
    when(tokenRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(token));

    User verified = service.verifyEmail("raw-token");

    assertThat(verified).isEqualTo(user);
    assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
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

  private static EmailVerificationToken token(User user, OffsetDateTime expiresAt) {
    return EmailVerificationToken.builder()
        .user(user)
        .tokenHash("hashed-token")
        .expiresAt(expiresAt)
        .build();
  }

  private static User user() {
    return User.builder()
        .publicId(UUID.randomUUID())
        .email("qc@example.com")
        .passwordHash("hash")
        .displayName("QC Demo")
        .role(Role.QC_MEMBER)
        .status(UserStatus.PENDING_EMAIL_VERIFICATION)
        .build();
  }
}
