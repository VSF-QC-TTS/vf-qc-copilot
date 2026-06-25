package vn.vinfast.vfqc.api.model.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Schema(name = "ResetPasswordRequest", description = "Password reset confirmation request")
public record ResetPasswordRequest(
    @Schema(description = "Raw password reset token from the reset link.")
        @NotBlank(message = "validation.auth.password-reset-token.required")
        @Size(max = 255, message = "validation.auth.password-reset-token.max")
        String token,
    @Schema(
            description = "New plain-text password. It is hashed before persistence.",
            example = "newPassword123",
            minLength = 8,
            maxLength = 72,
            accessMode = Schema.AccessMode.WRITE_ONLY)
        @NotBlank(message = "validation.user.new-password.required")
        @Size(min = 8, max = 72, message = "validation.user.new-password.size")
        String newPassword) {}
