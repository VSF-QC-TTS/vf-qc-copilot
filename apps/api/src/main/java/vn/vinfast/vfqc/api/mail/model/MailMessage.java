package vn.vinfast.vfqc.api.mail.model;

import java.util.Map;
import lombok.Builder;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Builder
public record MailMessage(String to, String subject, String templatePath, Map<String, ?> model) {}
