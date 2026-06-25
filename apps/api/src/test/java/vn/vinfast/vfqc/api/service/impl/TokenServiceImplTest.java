package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.util.ReflectionTestUtils;
import vn.vinfast.vfqc.api.model.user.Role;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;

@ExtendWith(MockitoExtension.class)
class TokenServiceImplTest {

  @Mock private JwtEncoder jwtEncoder;
  @Mock private StringRedisTemplate stringRedisTemplate;
  @Mock private ValueOperations<String, String> valueOperations;

  private TokenServiceImpl service;

  @BeforeEach
  void setUp() {
    service = new TokenServiceImpl(jwtEncoder, stringRedisTemplate);
    ReflectionTestUtils.setField(service, "accessExpirationMinutes", 15L);
    ReflectionTestUtils.setField(service, "refreshExpirationMinutes", 60L);
  }

  @Test
  void createAccessTokenReturnsEncodedJwtValue() {
    Jwt jwt =
        new Jwt(
            "access-token",
            Instant.now(),
            Instant.now().plusSeconds(900),
            Map.of("alg", "HS256"),
            Map.of("sub", "qc@example.com"));
    when(jwtEncoder.encode(any(JwtEncoderParameters.class))).thenReturn(jwt);

    assertThat(service.createAccessToken(user())).isEqualTo("access-token");
  }

  @Test
  void createRefreshTokenStoresUuidTokenInRedis() {
    when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

    String refreshToken = service.createRefreshToken(user());

    assertThat(refreshToken).isNotBlank();
    UUID.fromString(refreshToken);
    verify(valueOperations)
        .set(
            eq("vfqc:auth:refresh:" + refreshToken),
            eq("qc@example.com"),
            eq(Duration.ofSeconds(3600)));
  }

  @Test
  void readRefreshTokenRejectsBlankToken() {
    assertThatThrownBy(() -> service.readRefreshTokenSubject(" "))
        .isInstanceOf(BadJwtException.class)
        .hasMessageContaining("missing");
  }

  @Test
  void readRefreshTokenRejectsInvalidUuid() {
    assertThatThrownBy(() -> service.readRefreshTokenSubject("not-a-uuid"))
        .isInstanceOf(BadJwtException.class)
        .hasMessageContaining("format");
  }

  @Test
  void readRefreshTokenRejectsMissingRedisValue() {
    String token = UUID.randomUUID().toString();
    when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    when(valueOperations.get("vfqc:auth:refresh:" + token)).thenReturn(null);

    assertThatThrownBy(() -> service.readRefreshTokenSubject(token))
        .isInstanceOf(BadJwtException.class)
        .hasMessageContaining("missing or expired");
  }

  @Test
  void readRefreshTokenReturnsStoredSubject() {
    String token = UUID.randomUUID().toString();
    when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    when(valueOperations.get("vfqc:auth:refresh:" + token)).thenReturn("qc@example.com");

    assertThat(service.readRefreshTokenSubject(token)).isEqualTo("qc@example.com");
  }

  @Test
  void revokeRefreshTokenIgnoresBlankAndInvalidValues() {
    service.revokeRefreshToken(" ");
    service.revokeRefreshToken("not-a-uuid");

    verify(stringRedisTemplate, never()).delete(any(String.class));
  }

  @Test
  void revokeRefreshTokenDeletesRedisKey() {
    String token = UUID.randomUUID().toString();

    service.revokeRefreshToken(token);

    verify(stringRedisTemplate).delete("vfqc:auth:refresh:" + token);
  }

  @Test
  void expirationAccessorsReturnSeconds() {
    assertThat(service.accessTokenExpiresInSeconds()).isEqualTo(900);
    assertThat(service.refreshTokenExpiresInSeconds()).isEqualTo(3600);
  }

  private static User user() {
    return User.builder()
        .publicId(UUID.randomUUID())
        .email("qc@example.com")
        .passwordHash("hash")
        .displayName("QC Demo")
        .role(Role.QC_MEMBER)
        .status(UserStatus.ACTIVE)
        .build();
  }
}
