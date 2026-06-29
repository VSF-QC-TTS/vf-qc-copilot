package vn.vinfast.vfqc.api.service.impl;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import vn.vinfast.vfqc.api.mapper.UserMapper;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.model.user.request.AdminCreateUserRequest;
import vn.vinfast.vfqc.api.model.user.request.AdminResetPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.AdminUpdateUserRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.AdminUserService;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

  private static final int MAX_PAGE_SIZE = 100;

  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;

  @Value("${vfqc.user.default-avatar-url}")
  private String defaultAvatarUrl;

  @Override
  @Transactional(readOnly = true)
  public PageResponse<UserResponse> listUsers(String search, int page, int size) {
    Pageable pageable =
        PageRequest.of(
            Math.max(page, 0),
            Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
            Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<User> users =
        StringUtils.hasText(search)
            ? userRepository.findByEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                search.trim(), search.trim(), pageable)
            : userRepository.findAll(pageable);
    return PageResponse.of(users.map(userMapper::toResponse));
  }

  @Override
  @Transactional
  public UserResponse createUser(AdminCreateUserRequest request) {
    String email = normalizeEmail(request.email());
    if (userRepository.existsByEmail(email)) {
      throw new ResourceException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User user =
        User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .displayName(resolveDisplayName(request.displayName(), email))
            .role(request.role())
            .avatarUrl(defaultAvatarUrl)
            .status(request.status())
            .build();

    try {
      return userMapper.toResponse(userRepository.save(user));
    } catch (DataIntegrityViolationException ex) {
      throw new ResourceException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
  }

  @Override
  @Transactional
  public UserResponse updateUser(UUID publicId, AdminUpdateUserRequest request, String actorEmail) {
    User user = getUser(publicId);
    guardSelfDemotion(user, request, actorEmail);

    user.setDisplayName(resolveDisplayName(request.displayName(), user.getEmail()));
    user.setAvatarUrl(normalizeNullable(request.avatarUrl()));
    user.setRole(request.role());
    user.setStatus(request.status());
    return userMapper.toResponse(userRepository.save(user));
  }

  @Override
  @Transactional
  public UserResponse resetPassword(UUID publicId, AdminResetPasswordRequest request) {
    User user = getUser(publicId);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    return userMapper.toResponse(userRepository.save(user));
  }

  @Override
  @Transactional
  public void disableUser(UUID publicId, String actorEmail) {
    User user = getUser(publicId);
    if (isSelf(user, actorEmail)) {
      throw ResourceException.of(ErrorCode.FORBIDDEN, "Admin users cannot disable themselves.");
    }
    user.setStatus(UserStatus.DISABLED);
    userRepository.save(user);
    log.info("Admin disabled user {}", user.getPublicId());
  }

  private User getUser(UUID publicId) {
    return userRepository
        .findByPublicId(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.USER_NOT_FOUND));
  }

  private void guardSelfDemotion(User user, AdminUpdateUserRequest request, String actorEmail) {
    if (!isSelf(user, actorEmail)) {
      return;
    }
    if (request.role() != Role.ADMIN || request.status() != UserStatus.ACTIVE) {
      throw ResourceException.of(
          ErrorCode.FORBIDDEN, "Admin users cannot remove their own admin access.");
    }
  }

  private boolean isSelf(User user, String actorEmail) {
    return normalizeEmail(actorEmail).equals(user.getEmail());
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase();
  }

  private String normalizeNullable(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim();
  }

  private String resolveDisplayName(String displayName, String email) {
    if (StringUtils.hasText(displayName)) {
      return displayName.trim();
    }
    return email.substring(0, email.indexOf('@'));
  }
}
