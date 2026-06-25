package vn.vinfast.vfqc.api.mail.model;

import lombok.Builder;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Builder
public record MailRequest(String to, String displayName, String actionUrl) {}
