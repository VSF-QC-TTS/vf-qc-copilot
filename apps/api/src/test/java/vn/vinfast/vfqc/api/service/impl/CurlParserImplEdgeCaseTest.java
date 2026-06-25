package vn.vinfast.vfqc.api.service.impl;

import org.junit.jupiter.api.Test;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;

import static org.assertj.core.api.Assertions.assertThat;

class CurlParserImplEdgeCaseTest {

  private final CurlParserImpl parser = new CurlParserImpl();

  @Test
  void simpleGetWorks() {
    String curl = "curl 'https://api.vinfast.vn/v1/vehicles?vin=VF8123'";
    ParsedCurlCommand parsed = parser.parse(curl);
    assertThat(parsed.url()).isEqualTo("https://api.vinfast.vn/v1/vehicles");
    assertThat(parsed.queryParams()).containsEntry("vin", "VF8123");
  }

  @Test
  void multiLineWithBackslash() {
    String curl = """
        curl -X POST \\
          'https://api.vinfast.vn/v1/vehicle/diagnostic' \\
          -H 'Content-Type: application/json' \\
          -H 'Authorization: Bearer sk-abc123' \\
          --data '{"vin":"VF8-2026","module":"ECU"}'
        """;
    ParsedCurlCommand parsed = parser.parse(curl);
    assertThat(parsed.method()).isEqualTo("POST");
    assertThat(parsed.headers()).containsEntry("Content-Type", "application/json");
    assertThat(parsed.headers()).containsEntry("Authorization", "Bearer sk-abc123");
    assertThat(parsed.body()).contains("VF8-2026");
  }

  @Test
  void headerWithColonInValue() {
    // Authorization: Basic dXNlcjpwYXNz contains a colon in base64
    String curl = "curl -H 'X-Custom: value:with:colons' 'https://api.example.com/test'";
    ParsedCurlCommand parsed = parser.parse(curl);
    assertThat(parsed.headers().get("X-Custom")).isEqualTo("value:with:colons");
  }

  @Test
  void bodyWithNestedQuotes() {
    // In real life, user pastes: --data-raw '{"text":"Hello it'\''s a test","voice":"vi-VN"}'
    // In Java, we need \\ to represent a literal backslash
    String curl = """
        curl -X POST 'https://api.vinfast.vn/v1/tts' \
          -H 'Content-Type: application/json' \
          --data-raw '{"text":"Hello it'\\''s a test","voice":"vi-VN"}'
        """;
    ParsedCurlCommand parsed = parser.parse(curl);
    assertThat(parsed.body()).isNotNull();
    // Strict: verify the FULL JSON body is captured, not truncated
    assertThat(parsed.body()).contains("vi-VN");
    assertThat(parsed.body()).contains("voice");
    assertThat(parsed.body()).contains("Hello it's a test");
  }
}
