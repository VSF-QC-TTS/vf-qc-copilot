package vn.vinfast.vfqc.api.mail.template;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;
import vn.vinfast.vfqc.api.shared.mail.template.HtmlMailTemplateRenderer;

class HtmlMailTemplateRendererTest {

  private final HtmlMailTemplateRenderer renderer =
      new HtmlMailTemplateRenderer(new DefaultResourceLoader());

  @Test
  void renderEscapesModelValuesAndResolvesAllPlaceholders() {
    String html =
        renderer.render(
            "templates/mail/email-verification.html",
            Map.of(
                "appName", "VF <QC>",
                "title", "Verify & activate",
                "greeting", "Hi <Long>",
                "body", "Confirm your account",
                "buttonText", "Verify",
                "expiryNote", "This link expires soon",
                "automatedNote", "Do not reply",
                "actionUrl", "https://app.example.test/verify?token=a&next=/home",
                "preheader", "Confirm now"));

    assertThat(html).contains("VF &lt;QC&gt;");
    assertThat(html).contains("Verify &amp; activate");
    assertThat(html).contains("https://app.example.test/verify?token=a&amp;next=/home");
    assertThat(html).doesNotContain("{{");
  }

  @Test
  void renderFailsWhenTemplateHasMissingPlaceholderValue() {
    assertThatThrownBy(
            () ->
                renderer.render(
                    "templates/mail/email-verification.html",
                    Map.of(
                        "appName", "VF QC Copilot",
                        "title", "Verify",
                        "greeting", "Hi",
                        "body", "Confirm",
                        "buttonText", "Verify",
                        "expiryNote", "Expires",
                        "automatedNote", "Automated",
                        "preheader", "Confirm")))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("{{actionUrl}}");
  }
}
