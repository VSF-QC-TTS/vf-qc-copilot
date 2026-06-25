package vn.vinfast.vfqc.api.model.user.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Schema(name = "RegisterRequest", description = "Local account registration request")
public record RegisterRequest(
    @Schema(
            description = "User email address. Stored as username internally.",
            example = "qc.demo@example.com")
        @NotBlank(message = "validation.user.email.required")
        @Email(message = "validation.user.email.invalid")
        @Size(max = 255, message = "validation.user.email.max")
        String email,
    @Schema(
            description = "Plain-text password. It is hashed before persistence.",
            example = "password123",
            minLength = 8,
            maxLength = 72,
            accessMode = Schema.AccessMode.WRITE_ONLY)
        @NotBlank(message = "validation.user.password.required")
        @Size(min = 8, max = 72, message = "validation.user.password.size")
        String password,
    @Schema(
            description = "Display name. Defaults to the email local-part when omitted.",
            example = "QC Demo",
            maxLength = 255,
            nullable = true)
        @Size(max = 255, message = "validation.user.display-name.max")
        String displayName) {}
