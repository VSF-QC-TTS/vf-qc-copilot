package vn.vinfast.vfqc.api.shared;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.*;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/23/2026
 */
@Configuration
public class JwtConfig {
  @Value("${vfqc.security.jwt.secret-key}")
  private String jwtSecretKey;

  @Bean
  public SecretKey secretKey() {
    byte[] keyBytes = jwtSecretKey.getBytes(StandardCharsets.UTF_8);
    return new SecretKeySpec(keyBytes, "HmacSHA256");
  }

  @Bean
  public JwtEncoder jwtEncoder(SecretKey secretKey) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
  }

  @Bean
  public JwtDecoder jwtDecoder(SecretKey secretKey) {
    return NimbusJwtDecoder.withSecretKey(secretKey).build();
  }
}
