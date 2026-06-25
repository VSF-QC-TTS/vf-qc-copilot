package vn.vinfast.vfqc.api.service.impl;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.service.TokenService;

/**
 * Project: server
 *
 * @author nghlong3004
 * @since 4/21/2026
 */
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

  private static final String ISSUER = "vfqc-api";
  private static final String REFRESH_TOKEN_KEY_PREFIX = "vfqc:auth:refresh:";

  @Value("${vfqc.security.access-expiration}")
  private long accessExpirationMinutes;

  @Value("${vfqc.security.refresh-expiration}")
  private long refreshExpirationMinutes;

  private final JwtEncoder jwtEncoder;
  private final StringRedisTemplate stringRedisTemplate;

  @Override
  public String createAccessToken(User user) {
    return createToken(user, accessTokenExpiresInSeconds());
  }

  @Override
  public String createRefreshToken(User user) {
    String refreshToken = UUID.randomUUID().toString();
    stringRedisTemplate
        .opsForValue()
        .set(
            refreshTokenKey(refreshToken),
            user.getEmail(),
            Duration.ofSeconds(refreshTokenExpiresInSeconds()));
    return refreshToken;
  }

  @Override
  public String readRefreshTokenSubject(String refreshToken) {
    if (refreshToken == null || refreshToken.isBlank()) {
      throw new BadJwtException("Refresh token is missing");
    }

    try {
      UUID.fromString(refreshToken);
    } catch (IllegalArgumentException ex) {
      throw new BadJwtException("Refresh token format is invalid", ex);
    }

    String subject = stringRedisTemplate.opsForValue().get(refreshTokenKey(refreshToken));
    if (subject == null || subject.isBlank()) {
      throw new BadJwtException("Refresh token is missing or expired");
    }
    return subject;
  }

  @Override
  public void revokeRefreshToken(String refreshToken) {
    if (refreshToken == null || refreshToken.isBlank()) {
      return;
    }

    try {
      UUID.fromString(refreshToken);
    } catch (IllegalArgumentException ex) {
      return;
    }

    stringRedisTemplate.delete(refreshTokenKey(refreshToken));
  }

  @Override
  public long accessTokenExpiresInSeconds() {
    return accessExpirationMinutes * 60;
  }

  @Override
  public long refreshTokenExpiresInSeconds() {
    return refreshExpirationMinutes * 60;
  }

  private String createToken(User user, long expiresInSeconds) {
    Instant now = Instant.now();
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer(ISSUER)
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiresInSeconds))
            .subject(user.getEmail())
            .claim("scope", user.getRole().getAuthority())
            .claim("user_public_id", user.getPublicId().toString())
            .build();
    JwsHeader headers = JwsHeader.with(MacAlgorithm.HS256).build();
    return jwtEncoder.encode(JwtEncoderParameters.from(headers, claims)).getTokenValue();
  }

  private String refreshTokenKey(String refreshToken) {
    return REFRESH_TOKEN_KEY_PREFIX + refreshToken;
  }
}
