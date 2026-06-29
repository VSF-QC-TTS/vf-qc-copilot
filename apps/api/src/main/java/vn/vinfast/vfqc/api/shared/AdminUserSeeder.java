package vn.vinfast.vfqc.api.shared;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.repository.UserRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${vfqc.admin.seed.email:}")
  private String adminEmail;

  @Value("${vfqc.admin.seed.password:}")
  private String adminPassword;

  @Value("${vfqc.admin.seed.display-name:Administrator}")
  private String adminDisplayName;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
      log.info("Admin seed skipped because admin email or password is not configured");
      return;
    }

    if (adminPassword.length() < 8 || adminPassword.length() > 72) {
      log.warn("Admin seed skipped because password length is outside supported bounds");
      return;
    }

    String email = adminEmail.trim().toLowerCase();
    userRepository
        .findByEmail(email)
        .ifPresentOrElse(this::ensureAdmin, () -> createAdmin(email));
  }

  private void ensureAdmin(User user) {
    boolean changed = false;
    if (user.getRole() != Role.ADMIN) {
      user.setRole(Role.ADMIN);
      changed = true;
    }
    if (user.getStatus() != UserStatus.ACTIVE) {
      user.setStatus(UserStatus.ACTIVE);
      changed = true;
    }
    if (StringUtils.hasText(adminDisplayName)
        && !adminDisplayName.trim().equals(user.getDisplayName())) {
      user.setDisplayName(adminDisplayName.trim());
      changed = true;
    }
    if (changed) {
      userRepository.save(user);
      log.info("Admin seed promoted existing user {}", user.getPublicId());
    }
  }

  private void createAdmin(String email) {
    User user =
        User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(adminPassword))
            .displayName(resolveDisplayName(email))
            .role(Role.ADMIN)
            .status(UserStatus.ACTIVE)
            .build();
    User saved = userRepository.save(user);
    log.info("Admin seed created user {}", saved.getPublicId());
  }

  private String resolveDisplayName(String email) {
    if (StringUtils.hasText(adminDisplayName)) {
      return adminDisplayName.trim();
    }
    return email.substring(0, email.indexOf('@'));
  }
}
