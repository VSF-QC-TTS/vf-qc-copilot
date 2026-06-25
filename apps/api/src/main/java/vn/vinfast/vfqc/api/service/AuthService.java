package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.user.request.ForgotPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.LoginRequest;
import vn.vinfast.vfqc.api.model.user.request.ResetPasswordRequest;
import vn.vinfast.vfqc.api.model.user.request.VerifyEmailRequest;
import vn.vinfast.vfqc.api.model.user.response.LoginResult;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Validated
public interface AuthService {

  /**
   * Authenticates a local account from a {@link LoginRequest} and creates access/refresh tokens.
   *
   * @param request validated {@link LoginRequest}
   * @return {@link LoginResult} containing response data and refresh token cookie metadata
   */
  LoginResult login(@Valid LoginRequest request);

  /**
   * Renews an authenticated session using a refresh token cookie.
   *
   * @param refreshToken opaque refresh token read from the HttpOnly cookie
   * @return {@link LoginResult} containing a new access token and refresh token cookie metadata
   */
  LoginResult refreshToken(String refreshToken);

  /**
   * Revokes a refresh token during logout.
   *
   * @param refreshToken opaque refresh token read from the HttpOnly cookie
   */
  void logout(String refreshToken);

  /**
   * Verifies a pending account email address using a token from {@link VerifyEmailRequest}.
   *
   * @param request validated {@link VerifyEmailRequest}
   */
  void verifyEmail(@Valid VerifyEmailRequest request);

  /**
   * Starts the password reset flow from a {@link ForgotPasswordRequest}.
   *
   * @param request validated {@link ForgotPasswordRequest}
   */
  void forgotPassword(@Valid ForgotPasswordRequest request);

  /**
   * Sets a new password using a valid one-time token from {@link ResetPasswordRequest}.
   *
   * @param request validated {@link ResetPasswordRequest}
   */
  void resetPassword(@Valid ResetPasswordRequest request);
}
