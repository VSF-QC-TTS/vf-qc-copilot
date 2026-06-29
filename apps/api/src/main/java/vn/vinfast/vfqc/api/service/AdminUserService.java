package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.user.request.AdminCreateUserRequest;
import vn.vinfast.vfqc.api.model.user.request.AdminResetPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.AdminUpdateUserRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

@Validated
public interface AdminUserService {

  PageResponse<UserResponse> listUsers(String search, int page, int size);

  UserResponse createUser(@Valid AdminCreateUserRequest request);

  UserResponse updateUser(UUID publicId, @Valid AdminUpdateUserRequest request, String actorEmail);

  UserResponse resetPassword(UUID publicId, @Valid AdminResetPasswordRequest request);

  void disableUser(UUID publicId, String actorEmail);
}
