package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;
import vn.vinfast.vfqc.api.service.CurlParser;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
class CurlParserImplTest {

  private final CurlParser curlParser = new CurlParserImpl();

  @Test
  void parse_SimpleGet() {
    String curl = "curl 'https://api.example.com/v1/users?page=1'";
    ParsedCurlCommand parsed = curlParser.parse(curl);

    assertThat(parsed.method()).isEqualTo("GET");
    assertThat(parsed.url()).isEqualTo("https://api.example.com/v1/users");
    assertThat(parsed.queryParams()).containsEntry("page", "1");
    assertThat(parsed.headers()).isEmpty();
    assertThat(parsed.body()).isNull();
  }

  @Test
  void parse_PostWithHeadersAndBody() {
    String curl = """
        curl -X POST 'https://api.example.com/v1/users' \\
        -H 'Authorization: Bearer token123' \\
        -H 'Content-Type: application/json' \\
        --data-raw '{"name": "test"}'
        """;
    ParsedCurlCommand parsed = curlParser.parse(curl);

    assertThat(parsed.method()).isEqualTo("POST");
    assertThat(parsed.url()).isEqualTo("https://api.example.com/v1/users");
    assertThat(parsed.headers())
        .containsEntry("Authorization", "Bearer token123")
        .containsEntry("Content-Type", "application/json");
    assertThat(parsed.body()).isEqualTo("{\"name\": \"test\"}");
  }

  @Test
  void parse_InvalidCurl_ThrowsException() {
    assertThatThrownBy(() -> curlParser.parse("not a curl command"))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_CURL);
  }
}
