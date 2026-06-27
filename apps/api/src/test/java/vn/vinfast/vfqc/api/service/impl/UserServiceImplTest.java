package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.vinfast.vfqc.api.shared.mail.model.MailType;
import vn.vinfast.vfqc.api.shared.mail.service.MailService;
import vn.vinfast.vfqc.api.mapper.UserMapper;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.model.user.request.RegisterRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.EmailVerificationService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

  @Mock private UserRepository userRepository;
  @Mock private UserMapper userMapper;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private MailService mailService;
  @Mock private EmailVerificationService emailVerificationService;

  private UserServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new UserServiceImpl(
            userRepository, userMapper, passwordEncoder, mailService, emailVerificationService);
  }

  @Test
  void registerRejectsExistingEmail() {
    when(userRepository.existsByEmail("qc@example.com")).thenReturn(true);

    assertResourceCode(
        () -> service.register(new RegisterRequest(" QC@example.com ", "password123", "QC Demo")),
        ErrorCode.EMAIL_ALREADY_EXISTS);
  }

  @Test
  void registerMapsUniqueConstraintViolationToEmailAlreadyExists() {
    when(userRepository.existsByEmail("qc@example.com")).thenReturn(false);
    when(passwordEncoder.encode("password123")).thenReturn("hash");
    when(userRepository.save(any(User.class)))
        .thenThrow(new DataIntegrityViolationException("dup"));

    assertResourceCode(
        () -> service.register(new RegisterRequest("qc@example.com", "password123", "QC Demo")),
        ErrorCode.EMAIL_ALREADY_EXISTS);
  }

  @Test
  void registerCreatesPendingUserAndSendsVerificationEmail() {
    User saved =
        User.builder()
            .publicId(UUID.randomUUID())
            .email("qc@example.com")
            .passwordHash("hash")
            .displayName("QC Demo")
            .role(Role.QC_MEMBER)
            .status(UserStatus.PENDING_EMAIL_VERIFICATION)
            .build();
    when(userRepository.existsByEmail("qc@example.com")).thenReturn(false);
    when(passwordEncoder.encode("password123")).thenReturn("hash");
    when(userRepository.save(any(User.class))).thenReturn(saved);
    when(emailVerificationService.createVerificationToken(saved)).thenReturn("verify-token");

    service.register(new RegisterRequest(" QC@example.com ", "password123", " QC Demo "));

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCaptor.capture());
    User created = userCaptor.getValue();
    assertThat(created.getEmail()).isEqualTo("qc@example.com");
    assertThat(created.getPasswordHash()).isEqualTo("hash");
    assertThat(created.getDisplayName()).isEqualTo("QC Demo");
    assertThat(created.getStatus()).isEqualTo(UserStatus.PENDING_EMAIL_VERIFICATION);
    verify(mailService).send(eq(MailType.EMAIL_VERIFICATION), any());
  }

  @Test
  void registerDefaultsDisplayNameToEmailLocalPart() {
    when(userRepository.existsByEmail("qc@example.com")).thenReturn(false);
    when(passwordEncoder.encode("password123")).thenReturn("hash");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    service.register(new RegisterRequest("qc@example.com", "password123", null));

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCaptor.capture());
    assertThat(userCaptor.getValue().getDisplayName()).isEqualTo("qc");
  }

  @Test
  void getCurrentUserReturnsMappedUser() {
    User user = user();
    UserResponse response =
        new UserResponse(
            user.getPublicId(),
            user.getEmail(),
            user.getDisplayName(),
            null,
            user.getRole(),
            user.getStatus(),
            null);
    when(userRepository.findByEmail("qc@example.com")).thenReturn(Optional.of(user));
    when(userMapper.toResponse(user)).thenReturn(response);

    assertThat(service.getCurrentUser(" QC@example.com ")).isEqualTo(response);
  }

  @Test
  void getCurrentUserThrowsWhenMissing() {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    assertResourceCode(
        () -> service.getCurrentUser("missing@example.com"), ErrorCode.USER_NOT_FOUND);
  }

  private static void assertResourceCode(Runnable action, ErrorCode expectedCode) {
    assertThatThrownBy(action::run)
        .isInstanceOf(ResourceException.class)
        .extracting("errorCode")
        .isEqualTo(expectedCode);
  }

  private static User user() {
    return User.builder()
        .publicId(UUID.randomUUID())
        .email("qc@example.com")
        .passwordHash("hash")
        .displayName("QC Demo")
        .role(Role.QC_MEMBER)
        .status(UserStatus.ACTIVE)
        .build();
  }
}
