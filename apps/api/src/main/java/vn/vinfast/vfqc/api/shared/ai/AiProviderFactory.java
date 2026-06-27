package vn.vinfast.vfqc.api.shared.ai;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.model.ai.AiProvider;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * Factory that resolves the correct AI provider adapter based on provider type. Uses Spring
 * auto-discovery of all AiProviderPort implementations.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Component
public class AiProviderFactory {

  private final Map<AiProvider, AiProviderPort> adapters;

  public AiProviderFactory(List<AiProviderPort> adapterList) {
    this.adapters =
        adapterList.stream()
            .collect(Collectors.toMap(AiProviderPort::getSupportedProvider, Function.identity()));
  }

  /**
   * Returns the adapter for the given provider.
   *
   * @param provider the AI provider type
   * @return the matching adapter
   * @throws ResourceException if the provider is not supported
   */
  public AiProviderPort getAdapter(AiProvider provider) {
    AiProviderPort adapter = adapters.get(provider);
    if (adapter == null) {
      throw ResourceException.of(
          ErrorCode.UNSUPPORTED_AI_PROVIDER, "Provider " + provider + " is not supported yet.");
    }
    return adapter;
  }
}
