package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

  @Mock private UserRepository userRepository;

  private UserDetailsServiceImpl service;

  @BeforeEach
  void setUp() {
    service = new UserDetailsServiceImpl(userRepository);
  }

  @Test
  void loadUserByUsernameReturnsSpringSecurityUser() {
    User user = user(UserStatus.ACTIVE);
    when(userRepository.findByEmail("qc@example.com")).thenReturn(Optional.of(user));

    var userDetails = service.loadUserByUsername(" QC@example.com ");

    assertThat(userDetails.getUsername()).isEqualTo("qc@example.com");
    assertThat(userDetails.getPassword()).isEqualTo("hash");
    assertThat(userDetails.isEnabled()).isTrue();
    assertThat(userDetails.getAuthorities())
        .extracting("authority")
        .containsExactly("ROLE_QC_MEMBER");
  }

  @Test
  void loadUserByUsernameDisablesNonActiveUsers() {
    User user = user(UserStatus.DISABLED);
    when(userRepository.findByEmail("qc@example.com")).thenReturn(Optional.of(user));

    assertThat(service.loadUserByUsername("qc@example.com").isEnabled()).isFalse();
  }

  @Test
  void loadUserByUsernameThrowsWhenMissing() {
    when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
        .isInstanceOf(UsernameNotFoundException.class);
  }

  private static User user(UserStatus status) {
    return User.builder()
        .publicId(UUID.randomUUID())
        .email("qc@example.com")
        .passwordHash("hash")
        .displayName("QC Demo")
        .role(Role.QC_MEMBER)
        .status(status)
        .build();
  }
}
