package vn.vinfast.vfqc.api.shared.mail.service.impl;

import jakarta.mail.MessagingException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vn.vinfast.vfqc.api.shared.mail.config.MailProperties;
import vn.vinfast.vfqc.api.shared.mail.factory.MailStrategyFactory;
import vn.vinfast.vfqc.api.shared.mail.model.MailMessage;
import vn.vinfast.vfqc.api.shared.mail.model.MailRequest;
import vn.vinfast.vfqc.api.shared.mail.model.MailType;
import vn.vinfast.vfqc.api.shared.mail.service.MailService;
import vn.vinfast.vfqc.api.shared.mail.template.HtmlMailTemplateRenderer;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

  private final JavaMailSender mailSender;
  private final MailProperties mailProperties;
  private final HtmlMailTemplateRenderer templateRenderer;
  private final MailStrategyFactory mailStrategyFactory;

  @Async
  @Override
  public void send(MailType type, MailRequest request) {
    try {
      MailMessage mailMessage = mailStrategyFactory.get(type).buildMessage(request);
      var message = mailSender.createMimeMessage();
      var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
      helper.setFrom(mailProperties.from());
      helper.setTo(mailMessage.to());
      helper.setSubject(mailMessage.subject());
      helper.setText(toPlainText(mailMessage), render(mailMessage));

      mailSender.send(message);
      log.info("Sent {} mail message", type);
    } catch (IllegalStateException | MailException | MessagingException ex) {
      log.warn("Failed to send {} mail message", type, ex);
    }
  }

  private String render(MailMessage mailMessage) {
    return templateRenderer.render(mailMessage.templatePath(), mailMessage.model());
  }

  private String toPlainText(MailMessage mailMessage) {
    List<String> lines =
        List.of(
            value(mailMessage, "title"),
            "",
            value(mailMessage, "greeting"),
            "",
            value(mailMessage, "body"),
            "",
            value(mailMessage, "actionUrl"),
            "",
            value(mailMessage, "expiryNote"),
            "",
            value(mailMessage, "automatedNote"));
    return String.join(System.lineSeparator(), lines).strip();
  }

  private String value(MailMessage mailMessage, String key) {
    return Objects.toString(mailMessage.model().get(key), "");
  }
}
