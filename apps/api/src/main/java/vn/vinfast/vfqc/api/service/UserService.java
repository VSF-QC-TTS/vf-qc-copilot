package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.user.request.RegisterRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Validated
public interface UserService {
  /**
   * Registers a local user from a {@link RegisterRequest} in pending email verification state.
   *
   * @param request validated {@link RegisterRequest}
   */
  void register(@Valid RegisterRequest request);

  /**
   * Finds the current authenticated {@link vn.vinfast.aitesthub.user.entity.User}.
   *
   * @param username normalized or raw username from the authenticated principal
   * @return current {@link UserResponse}
   */
  UserResponse getCurrentUser(String username);
}
