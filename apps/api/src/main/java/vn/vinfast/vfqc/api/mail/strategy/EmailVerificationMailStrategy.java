package vn.vinfast.vfqc.api.mail.strategy;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import vn.vinfast.vfqc.api.mail.model.MailMessage;
import vn.vinfast.vfqc.api.mail.model.MailRequest;
import vn.vinfast.vfqc.api.mail.model.MailType;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Component
@RequiredArgsConstructor
public class EmailVerificationMailStrategy implements MailStrategy {

  private static final String TEMPLATE_PATH = "templates/mail/email-verification.html";
  private final MessageSource messageSource;

  @Override
  public MailType type() {
    return MailType.EMAIL_VERIFICATION;
  }

  @Override
  public MailMessage buildMessage(MailRequest request) {
    var locale = LocaleContextHolder.getLocale();
    var appName = "VF QC Copilot";
    var subject = messageSource.getMessage("mail.verify.subject", null, locale);

    return MailMessage.builder()
        .to(request.to())
        .subject(subject)
        .templatePath(TEMPLATE_PATH)
        .model(
            Map.of(
                "appName", appName,
                "title", messageSource.getMessage("mail.verify.title", null, locale),
                "greeting",
                    messageSource.getMessage(
                        "mail.verify.greeting", new Object[] {request.displayName()}, locale),
                "body", messageSource.getMessage("mail.verify.body", null, locale),
                "buttonText", messageSource.getMessage("mail.verify.button", null, locale),
                "expiryNote", messageSource.getMessage("mail.verify.expiry", null, locale),
                "automatedNote",
                    messageSource.getMessage(
                        "mail.common.automated", new Object[] {appName}, locale),
                "actionUrl", request.actionUrl(),
                "preheader", messageSource.getMessage("mail.verify.body", null, locale)))
        .build();
  }
}
