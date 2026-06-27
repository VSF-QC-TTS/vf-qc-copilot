package vn.vinfast.vfqc.api.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;
import vn.vinfast.vfqc.api.shared.mail.model.MailRequest;
import vn.vinfast.vfqc.api.shared.mail.model.MailType;
import vn.vinfast.vfqc.api.shared.mail.service.MailService;
import vn.vinfast.vfqc.api.mapper.UserMapper;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.model.user.request.RegisterRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.EmailVerificationService;
import vn.vinfast.vfqc.api.service.UserService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;
  private final MailService mailService;
  private final EmailVerificationService emailVerificationService;

  @Value("${vfqc.client.base-url}")
  private String clientBaseUrl;

  @Override
  @Transactional
  public void register(RegisterRequest request) {
    String email = normalizeEmail(request.email());
    if (userRepository.existsByEmail(email)) {
      log.warn("Registration rejected because the email is already registered");
      throw new ResourceException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    log.debug("Creating local user account");
    User user =
        User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .displayName(resolveDisplayName(request.displayName(), email))
            .status(UserStatus.PENDING_EMAIL_VERIFICATION)
            .build();

    User saved;
    try {
      saved = userRepository.save(user);
    } catch (DataIntegrityViolationException ex) {
      log.warn("Registration rejected because the email is already registered");
      throw new ResourceException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    log.info("Registered local user {}", saved.getPublicId());
    sendEmailVerification(saved);
  }

  @Override
  @Transactional(readOnly = true)
  public UserResponse getCurrentUser(String username) {
    User user =
        userRepository
            .findByEmail(normalizeEmail(username))
            .orElseThrow(() -> new ResourceException(ErrorCode.USER_NOT_FOUND));
    return userMapper.toResponse(user);
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase();
  }

  private String resolveDisplayName(String displayName, String email) {
    if (displayName != null && !displayName.isBlank()) {
      return displayName.trim();
    }
    return email.substring(0, email.indexOf('@'));
  }

  private void sendEmailVerification(User user) {
    String rawToken = emailVerificationService.createVerificationToken(user);
    try {
      mailService.send(
          MailType.EMAIL_VERIFICATION,
          MailRequest.builder()
              .to(user.getEmail())
              .displayName(user.getDisplayName())
              .actionUrl(buildVerificationUrl(rawToken))
              .build());
    } catch (RuntimeException ex) {
      log.warn("Email verification dispatch failed for user {}", user.getPublicId());
    }
  }

  private String buildVerificationUrl(String rawToken) {
    String baseUrl =
        clientBaseUrl == null || clientBaseUrl.isBlank() ? "http://localhost:3000" : clientBaseUrl;
    return UriComponentsBuilder.fromUriString(baseUrl)
        .path("/verify-email")
        .queryParam("token", rawToken)
        .build()
        .toUriString();
  }
}
