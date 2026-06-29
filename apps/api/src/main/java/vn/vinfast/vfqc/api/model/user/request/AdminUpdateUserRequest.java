package vn.vinfast.vfqc.api.model.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.UserStatus;

@Schema(name = "AdminUpdateUserRequest", description = "Admin user update request")
public record AdminUpdateUserRequest(
    @Size(max = 255, message = "validation.user.display-name.max") String displayName,
    @Size(max = 512, message = "validation.user.avatar-url.max") String avatarUrl,
    @NotNull Role role,
    @NotNull UserStatus status) {}
