package vn.vinfast.vfqc.api.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;
import vn.vinfast.vfqc.api.service.OpaqueTokenService;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Service
public class OpaqueTokenServiceImpl implements OpaqueTokenService {

  private static final int TOKEN_BYTES = 32;

  private final SecureRandom secureRandom = new SecureRandom();

  @Override
  public String generateRawToken() {
    byte[] bytes = new byte[TOKEN_BYTES];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  @Override
  public String hash(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      StringBuilder builder = new StringBuilder(hash.length * 2);
      for (byte b : hash) {
        builder.append(String.format("%02x", b));
      }
      return builder.toString();
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 is not available", ex);
    }
  }
}
