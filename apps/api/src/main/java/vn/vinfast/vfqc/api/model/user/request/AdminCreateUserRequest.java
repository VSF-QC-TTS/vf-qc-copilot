package vn.vinfast.vfqc.api.model.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.UserStatus;

@Schema(name = "AdminCreateUserRequest", description = "Admin user creation request")
public record AdminCreateUserRequest(
    @NotBlank(message = "validation.user.email.required")
        @Email(message = "validation.user.email.invalid")
        @Size(max = 255, message = "validation.user.email.max")
        String email,
    @NotBlank(message = "validation.user.password.required")
        @Size(min = 8, max = 72, message = "validation.user.password.size")
        String password,
    @Size(max = 255, message = "validation.user.display-name.max") String displayName,
    @NotNull Role role,
    @NotNull UserStatus status) {}
