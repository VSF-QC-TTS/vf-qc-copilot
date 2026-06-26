package vn.vinfast.vfqc.api.shared.crypto;

import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.AesBytesEncryptor;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.keygen.KeyGenerators;
import org.springframework.stereotype.Component;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Component
public class SecretEncryptor {

  private final BytesEncryptor bytesEncryptor;

  public SecretEncryptor(@Value("${vfqc.security.encryption-key}") String encryptionKey,
                         @Value("${vfqc.security.encryption-salt:5c0744940b5c369b}") String salt) {
    this.bytesEncryptor = new AesBytesEncryptor(
        encryptionKey,
        salt,
        KeyGenerators.secureRandom(16),
        AesBytesEncryptor.CipherAlgorithm.GCM
    );
  }

  public String encrypt(String plaintext) {
    if (plaintext == null) {
      return null;
    }
    byte[] encrypted = bytesEncryptor.encrypt(plaintext.getBytes());
    return Base64.getEncoder().encodeToString(encrypted);
  }

  public String decrypt(String ciphertext) {
    if (ciphertext == null) {
      return null;
    }
    byte[] decoded = Base64.getDecoder().decode(ciphertext);
    byte[] decrypted = bytesEncryptor.decrypt(decoded);
    return new String(decrypted);
  }

  public String mask(String value) {
    if (value == null || value.isBlank()) {
      return value;
    }
    if (value.length() <= 8) {
      return "***";
    }
    return value.substring(0, 4) + "***" + value.substring(value.length() - 4);
  }
}
