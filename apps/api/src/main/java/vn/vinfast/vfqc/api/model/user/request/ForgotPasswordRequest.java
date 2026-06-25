package vn.vinfast.vfqc.api.model.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Schema(name = "ForgotPasswordRequest", description = "Password reset request by email")
public record ForgotPasswordRequest(
    @Schema(description = "User email address.", example = "qc.demo@example.com")
        @NotBlank(message = "validation.user.email.required")
        @Email(message = "validation.user.email.invalid")
        @Size(max = 255, message = "validation.user.email.max")
        String email) {}
