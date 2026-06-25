package vn.vinfast.vfqc.api.service.judge;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.model.judgeconfig.LlmProvider;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Component
public class LlmProviderRegistry {

  private final Map<LlmProvider, LlmProviderClient> clients;

  public LlmProviderRegistry(List<LlmProviderClient> clientList) {
    this.clients = clientList.stream()
        .collect(Collectors.toMap(LlmProviderClient::getSupportedProvider, Function.identity()));
  }

  public LlmProviderClient getClient(LlmProvider provider) {
    LlmProviderClient client = clients.get(provider);
    if (client == null) {
      throw ResourceException.of(ErrorCode.UNSUPPORTED_LLM_PROVIDER, "Provider " + provider + " is not supported yet.");
    }
    return client;
  }
}
