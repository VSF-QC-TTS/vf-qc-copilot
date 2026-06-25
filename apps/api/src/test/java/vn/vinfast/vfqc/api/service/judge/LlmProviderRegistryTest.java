package vn.vinfast.vfqc.api.service.judge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
class LlmProviderRegistryTest {

  @Test
  void getClient_Success() {
    OpenAiProviderClient openAiClient = new OpenAiProviderClient(null, null);
    LlmProviderRegistry registry = new LlmProviderRegistry(List.of(openAiClient));

    LlmProviderClient client = registry.getClient(LlmProvider.OPENAI);
    assertThat(client).isInstanceOf(OpenAiProviderClient.class);
  }

  @Test
  void getClient_NotFound_ThrowsException() {
    LlmProviderRegistry registry = new LlmProviderRegistry(List.of());

    assertThatThrownBy(() -> registry.getClient(LlmProvider.OPENAI))
        .isInstanceOf(ResourceException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNSUPPORTED_LLM_PROVIDER);
  }
}
