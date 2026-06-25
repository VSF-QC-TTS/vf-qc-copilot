package vn.vinfast.vfqc.api.mail.factory;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.mail.model.MailType;
import vn.vinfast.vfqc.api.mail.strategy.MailStrategy;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Component
public class MailStrategyFactory {

  private final Map<MailType, MailStrategy> strategies;

  public MailStrategyFactory(List<MailStrategy> strategies) {
    this.strategies = new EnumMap<>(MailType.class);
    for (MailStrategy strategy : strategies) {
      this.strategies.put(strategy.type(), strategy);
    }
  }

  public MailStrategy get(MailType type) {
    MailStrategy strategy = strategies.get(type);
    if (strategy == null) {
      throw new IllegalArgumentException("Unsupported mail type: " + type);
    }
    return strategy;
  }
}
