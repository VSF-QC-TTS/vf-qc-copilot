package vn.vinfast.vfqc.api.mail.strategy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Locale;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.StaticMessageSource;
import vn.vinfast.vfqc.api.shared.mail.model.MailRequest;
import vn.vinfast.vfqc.api.shared.mail.model.MailType;
import vn.vinfast.vfqc.api.shared.mail.strategy.EmailVerificationMailStrategy;
import vn.vinfast.vfqc.api.shared.mail.strategy.PasswordResetMailStrategy;

class MailStrategyTest {

  @AfterEach
  void tearDown() {
    LocaleContextHolder.resetLocaleContext();
  }

  @Test
  void emailVerificationStrategyBuildsExpectedMessage() {
    StaticMessageSource messages = messages();
    LocaleContextHolder.setLocale(Locale.ENGLISH);
    EmailVerificationMailStrategy strategy = new EmailVerificationMailStrategy(messages);

    var message =
        strategy.buildMessage(
            MailRequest.builder()
                .to("qc@example.test")
                .displayName("QC Demo")
                .actionUrl("https://app.example.test/verify")
                .build());

    assertThat(strategy.type()).isEqualTo(MailType.EMAIL_VERIFICATION);
    assertThat(message.to()).isEqualTo("qc@example.test");
    assertThat(message.subject()).isEqualTo("Verify subject");
    assertThat(message.templatePath()).isEqualTo("templates/mail/email-verification.html");
    assertThat(message.model().get("greeting")).isEqualTo("Hi QC Demo,");
    assertThat(message.model().get("actionUrl")).isEqualTo("https://app.example.test/verify");
  }

  @Test
  void passwordResetStrategyBuildsExpectedMessage() {
    StaticMessageSource messages = messages();
    LocaleContextHolder.setLocale(Locale.ENGLISH);
    PasswordResetMailStrategy strategy = new PasswordResetMailStrategy(messages);

    var message =
        strategy.buildMessage(
            MailRequest.builder()
                .to("qc@example.test")
                .displayName("QC Demo")
                .actionUrl("https://app.example.test/reset")
                .build());

    assertThat(strategy.type()).isEqualTo(MailType.PASSWORD_RESET);
    assertThat(message.to()).isEqualTo("qc@example.test");
    assertThat(message.subject()).isEqualTo("Reset subject");
    assertThat(message.templatePath()).isEqualTo("templates/mail/password-reset.html");
    assertThat(message.model().get("buttonText")).isEqualTo("Reset password");
    assertThat(message.model().get("actionUrl")).isEqualTo("https://app.example.test/reset");
  }

  private static StaticMessageSource messages() {
    StaticMessageSource source = new StaticMessageSource();
    source.addMessage("mail.verify.subject", Locale.ENGLISH, "Verify subject");
    source.addMessage("mail.verify.title", Locale.ENGLISH, "Verify title");
    source.addMessage("mail.verify.greeting", Locale.ENGLISH, "Hi {0},");
    source.addMessage("mail.verify.body", Locale.ENGLISH, "Verify body");
    source.addMessage("mail.verify.button", Locale.ENGLISH, "Verify email");
    source.addMessage("mail.verify.expiry", Locale.ENGLISH, "Verify expiry");
    source.addMessage("mail.reset.subject", Locale.ENGLISH, "Reset subject");
    source.addMessage("mail.reset.title", Locale.ENGLISH, "Reset title");
    source.addMessage("mail.reset.greeting", Locale.ENGLISH, "Hi {0},");
    source.addMessage("mail.reset.body", Locale.ENGLISH, "Reset body");
    source.addMessage("mail.reset.button", Locale.ENGLISH, "Reset password");
    source.addMessage("mail.reset.expiry", Locale.ENGLISH, "Reset expiry");
    source.addMessage("mail.common.automated", Locale.ENGLISH, "Automated from {0}");
    return source;
  }
}
