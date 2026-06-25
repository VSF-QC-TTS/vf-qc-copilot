package vn.vinfast.vfqc.api.service;

import vn.vinfast.vfqc.api.model.user.User;

/**
 * Project: server
 *
 * @author nghlong3004
 * @since 4/21/2026
 */
public interface TokenService {

  String createAccessToken(User user);

  String createRefreshToken(User user);

  String readRefreshTokenSubject(String refreshToken);

  void revokeRefreshToken(String refreshToken);

  long accessTokenExpiresInSeconds();

  long refreshTokenExpiresInSeconds();
}
