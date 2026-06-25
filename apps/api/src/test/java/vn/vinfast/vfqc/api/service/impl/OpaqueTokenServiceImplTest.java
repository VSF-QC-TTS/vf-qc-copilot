package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OpaqueTokenServiceImplTest {

  private final OpaqueTokenServiceImpl service = new OpaqueTokenServiceImpl();

  @Test
  void generateRawTokenReturnsUrlSafeToken() {
    String token = service.generateRawToken();

    assertThat(token).isNotBlank();
    assertThat(token).doesNotContain("=");
    assertThat(token).matches("[A-Za-z0-9_-]+");
  }

  @Test
  void hashReturnsDeterministicSha256Hex() {
    String first = service.hash("raw-token");
    String second = service.hash("raw-token");

    assertThat(first).isEqualTo(second);
    assertThat(first).hasSize(64);
    assertThat(first).matches("[0-9a-f]{64}");
  }
}
