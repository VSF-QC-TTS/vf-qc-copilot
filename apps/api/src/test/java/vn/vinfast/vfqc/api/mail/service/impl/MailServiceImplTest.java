package vn.vinfast.vfqc.api.mail.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Map;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import vn.vinfast.vfqc.api.mail.config.MailProperties;
import vn.vinfast.vfqc.api.mail.factory.MailStrategyFactory;
import vn.vinfast.vfqc.api.mail.model.MailMessage;
import vn.vinfast.vfqc.api.mail.model.MailRequest;
import vn.vinfast.vfqc.api.mail.model.MailType;
import vn.vinfast.vfqc.api.mail.strategy.MailStrategy;
import vn.vinfast.vfqc.api.mail.template.HtmlMailTemplateRenderer;

@ExtendWith(MockitoExtension.class)
class MailServiceImplTest {

  @Mock private JavaMailSender mailSender;
  @Mock private HtmlMailTemplateRenderer templateRenderer;
  @Mock private MailStrategyFactory mailStrategyFactory;
  @Mock private MailStrategy mailStrategy;

  private MailServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new MailServiceImpl(
            mailSender,
            new MailProperties("no-reply@example.test"),
            templateRenderer,
            mailStrategyFactory);
  }

  @Test
  void sendBuildsHtmlMimeMessageWithPlainTextAlternative() throws Exception {
    MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
    MailRequest request =
        MailRequest.builder()
            .to("qc@example.test")
            .displayName("QC Demo")
            .actionUrl("https://app.example.test/action")
            .build();
    MailMessage mailMessage =
        MailMessage.builder()
            .to("qc@example.test")
            .subject("Verify account")
            .templatePath("templates/mail/email-verification.html")
            .model(
                Map.of(
                    "title", "Verify your email",
                    "greeting", "Hi QC Demo,",
                    "body", "Confirm this account.",
                    "actionUrl", "https://app.example.test/action",
                    "expiryNote", "Expires soon.",
                    "automatedNote", "Automated message."))
            .build();
    when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    when(mailStrategyFactory.get(MailType.EMAIL_VERIFICATION)).thenReturn(mailStrategy);
    when(mailStrategy.buildMessage(request)).thenReturn(mailMessage);
    when(templateRenderer.render(mailMessage.templatePath(), mailMessage.model()))
        .thenReturn("<html><body>Verify</body></html>");

    service.send(MailType.EMAIL_VERIFICATION, request);

    ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
    verify(mailSender).send(messageCaptor.capture());
    MimeMessage sent = messageCaptor.getValue();
    assertThat(sent.getSubject()).isEqualTo("Verify account");
    assertThat(sent.getFrom()[0].toString()).isEqualTo("no-reply@example.test");
    assertThat(sent.getRecipients(Message.RecipientType.TO)[0].toString())
        .isEqualTo("qc@example.test");
    sent.saveChanges();
    assertThat(sent.getContentType()).contains("multipart");
  }

  @Test
  void sendSwallowsMailFailureAfterLogging() {
    MailRequest request = MailRequest.builder().to("qc@example.test").build();
    when(mailStrategyFactory.get(MailType.PASSWORD_RESET)).thenReturn(mailStrategy);
    when(mailStrategy.buildMessage(request))
        .thenReturn(
            MailMessage.builder()
                .to("qc@example.test")
                .subject("Reset")
                .templatePath("templates/mail/password-reset.html")
                .model(Map.of())
                .build());
    when(mailSender.createMimeMessage()).thenThrow(new MailSendException("smtp down"));

    service.send(MailType.PASSWORD_RESET, request);

    verify(mailSender, never()).send(any(MimeMessage.class));
  }
}
