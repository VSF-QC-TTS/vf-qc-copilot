package vn.vinfast.vfqc.api.shared.crypto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@ExtendWith(MockitoExtension.class)
class SecretEncryptorTest {

  private SecretEncryptor secretEncryptor;

  @BeforeEach
  void setUp() {
    // 32-byte hex string (256 bits) for AES-256
    String testKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    secretEncryptor = new SecretEncryptor(testKey);
  }

  @Test
  void testEncryptAndDecrypt_Success() {
    String plaintext = "my-super-secret-api-key";

    String encrypted = secretEncryptor.encrypt(plaintext);
    assertThat(encrypted).isNotNull().isNotEqualTo(plaintext);

    String decrypted = secretEncryptor.decrypt(encrypted);
    assertThat(decrypted).isEqualTo(plaintext);
  }

  @Test
  void testEncrypt_Null() {
    assertThat(secretEncryptor.encrypt(null)).isNull();
  }

  @Test
  void testDecrypt_Null() {
    assertThat(secretEncryptor.decrypt(null)).isNull();
  }

  @Test
  void testMask() {
    assertThat(secretEncryptor.mask(null)).isNull();
    assertThat(secretEncryptor.mask("")).isEmpty();
    assertThat(secretEncryptor.mask("short")).isEqualTo("***");
    assertThat(secretEncryptor.mask("sk-1234567890-xyz")).isEqualTo("sk-1***-xyz");
  }
}
