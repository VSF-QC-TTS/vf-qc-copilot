package vn.vinfast.vfqc.api.model.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "AdminResetPasswordRequest", description = "Admin password reset request")
public record AdminResetPasswordRequest(
    @NotBlank(message = "validation.user.password.required")
        @Size(min = 8, max = 72, message = "validation.user.password.size")
        String password) {}
