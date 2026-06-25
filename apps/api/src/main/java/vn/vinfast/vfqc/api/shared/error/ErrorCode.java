package vn.vinfast.vfqc.api.shared.error;

import java.net.URI;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * Defines default API error codes returned by VFQC backend.
 *
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 6/25/2026
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  ACCESS_TOKEN_EXPIRED(
      HttpStatus.UNAUTHORIZED,
      "access-token-expired",
      "Access token expired",
      "The access token has expired. Please refresh the token or sign in again."),

  INVALID_ACCESS_TOKEN(
      HttpStatus.UNAUTHORIZED,
      "invalid-access-token",
      "Invalid access token",
      "The access token is invalid."),

  UNAUTHORIZED(
      HttpStatus.UNAUTHORIZED,
      "unauthorized",
      "Unauthorized",
      "Authentication is required to access this resource."),

  FORBIDDEN(
      HttpStatus.FORBIDDEN,
      "forbidden",
      "Forbidden",
      "You do not have permission to access this resource."),

  BAD_CREDENTIALS(
      HttpStatus.UNAUTHORIZED,
      "bad-credentials",
      "Bad credentials",
      "Invalid email or password."),

  INVALID_REFRESH_TOKEN(
      HttpStatus.UNAUTHORIZED,
      "invalid-refresh-token",
      "Invalid refresh token",
      "The refresh token is missing, invalid, or has been revoked."),

  REFRESH_TOKEN_EXPIRED(
      HttpStatus.UNAUTHORIZED,
      "refresh-token-expired",
      "Refresh token expired",
      "The refresh token has expired. Please sign in again."),

  EMAIL_NOT_VERIFIED(
      HttpStatus.FORBIDDEN,
      "email-not-verified",
      "Email not verified",
      "Account email has not been verified."),

  ACCOUNT_LOCKED(
      HttpStatus.FORBIDDEN,
      "account-locked",
      "Account locked",
      "The account is not active."),

  EMAIL_ALREADY_EXISTS(
      HttpStatus.CONFLICT,
      "email-already-exists",
      "Email already exists",
      "Email is already in use."),

  USER_NOT_FOUND(HttpStatus.NOT_FOUND, "user-not-found", "User not found", "User was not found."),

  INVALID_EMAIL_VERIFICATION_TOKEN(
      HttpStatus.BAD_REQUEST,
      "invalid-email-verification-token",
      "Invalid email verification token",
      "The email verification token is invalid."),

  EMAIL_VERIFICATION_TOKEN_USED(
      HttpStatus.BAD_REQUEST,
      "email-verification-token-used",
      "Email verification token already used",
      "The email verification token has already been used."),

  EMAIL_VERIFICATION_TOKEN_EXPIRED(
      HttpStatus.BAD_REQUEST,
      "email-verification-token-expired",
      "Email verification token expired",
      "The email verification token has expired."),

  INVALID_PASSWORD_RESET_TOKEN(
      HttpStatus.BAD_REQUEST,
      "invalid-password-reset-token",
      "Invalid password reset token",
      "The password reset token is invalid."),

  PASSWORD_RESET_TOKEN_USED(
      HttpStatus.BAD_REQUEST,
      "password-reset-token-used",
      "Password reset token already used",
      "The password reset token has already been used."),

  PASSWORD_RESET_TOKEN_EXPIRED(
      HttpStatus.BAD_REQUEST,
      "password-reset-token-expired",
      "Password reset token expired",
      "The password reset token has expired."),

  PROJECT_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "project-not-found",
      "Project Not Found",
      "The requested project was not found."),

  PROJECT_NAME_REQUIRED(
      HttpStatus.BAD_REQUEST,
      "project-name-required",
      "Project Name Required",
      "Project name cannot be empty."),

  PROJECT_ALREADY_DELETED(
      HttpStatus.GONE,
      "project-already-deleted",
      "Project Already Deleted",
      "The project has already been deleted."),

  // Target Config
  TARGET_CONFIG_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "target-config-not-found",
      "Target Config Not Found",
      "No target API configuration found for this project."),

  INVALID_CURL(
      HttpStatus.BAD_REQUEST,
      "invalid-curl",
      "Invalid cURL Command",
      "The provided cURL command could not be parsed."),

  TARGET_TEST_FAILED(
      HttpStatus.BAD_GATEWAY,
      "target-test-failed",
      "Target Test Failed",
      "The test request to the target API failed."),

  // Judge Config
  JUDGE_CONFIG_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "judge-config-not-found",
      "Judge Config Not Found",
      "No LLM judge configuration found for this project."),

  JUDGE_CONNECTION_FAILED(
      HttpStatus.BAD_GATEWAY,
      "judge-connection-failed",
      "Judge Connection Failed",
      "Failed to connect to the LLM judge provider."),

  UNSUPPORTED_LLM_PROVIDER(
      HttpStatus.BAD_REQUEST,
      "unsupported-llm-provider",
      "Unsupported LLM Provider",
      "The specified LLM provider is not supported."),

  // Dataset Schema
  DATASET_SCHEMA_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "dataset-schema-not-found",
      "Dataset Schema Not Found",
      "No dataset schema found for this project."),

  DUPLICATE_COLUMN_NAME(
      HttpStatus.CONFLICT,
      "duplicate-column-name",
      "Duplicate Column Name",
      "A column with this name already exists in the schema."),

  COLUMN_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "column-not-found",
      "Column Not Found",
      "The specified column was not found."),

  // Verification Config
  VERIFICATION_CONFIG_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "verification-config-not-found",
      "Verification Config Not Found",
      "No verification configuration found for this project."),

  MISSING_TARGET_CONFIG(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "missing-target-config",
      "Missing Target Config",
      "Verification requires a configured Target API."),

  MISSING_JUDGE_CONFIG(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "missing-judge-config",
      "Missing Judge Config",
      "LLM-based verification requires a configured LLM Judge."),

  MISSING_DATASET_SCHEMA(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "missing-dataset-schema",
      "Missing Dataset Schema",
      "Verification requires a configured Dataset Schema."),

  VALIDATION_ERROR(
      HttpStatus.BAD_REQUEST, "validation-error", "Validation error", "Request validation failed."),

  BAD_REQUEST(HttpStatus.BAD_REQUEST, "bad-request", "Bad request", "The request is invalid."),

  RESOURCE_NOT_FOUND(
      HttpStatus.NOT_FOUND,
      "resource-not-found",
      "Resource not found",
      "The requested resource was not found."),

  INTERNAL_SERVER_ERROR(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "internal-server-error",
      "Internal server error",
      "An unexpected error occurred.");

  private static final String ERROR_BASE_URI = "https://vfqc.vinfast.vn/errors";

  private final HttpStatus httpStatus;
  private final String typePath;
  private final String title;
  private final String defaultDetail;

  public URI getType() {
    return URI.create(ERROR_BASE_URI + "/" + typePath);
  }

  public int getStatus() {
    return httpStatus.value();
  }

  public String getCode() {
    return name();
  }
}
