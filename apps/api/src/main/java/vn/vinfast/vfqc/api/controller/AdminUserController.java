package vn.vinfast.vfqc.api.controller;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.model.user.request.AdminCreateUserRequest;
import vn.vinfast.vfqc.api.model.user.request.AdminResetPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.AdminUpdateUserRequest;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;
import vn.vinfast.vfqc.api.service.AdminUserService;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

  private final AdminUserService adminUserService;

  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public PageResponse<UserResponse> list(
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminUserService.listUsers(search, page, size);
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public UserResponse create(@Valid @RequestBody AdminCreateUserRequest request) {
    return adminUserService.createUser(request);
  }

  @PatchMapping(
      value = "/{publicId}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public UserResponse update(
      @PathVariable UUID publicId,
      @Valid @RequestBody AdminUpdateUserRequest request,
      Principal principal) {
    return adminUserService.updateUser(publicId, request, principal.getName());
  }

  @PostMapping(
      value = "/{publicId}/password",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public UserResponse resetPassword(
      @PathVariable UUID publicId, @Valid @RequestBody AdminResetPasswordRequest request) {
    return adminUserService.resetPassword(publicId, request);
  }

  @DeleteMapping("/{publicId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID publicId, Principal principal) {
    adminUserService.disableUser(publicId, principal.getName());
  }
}
