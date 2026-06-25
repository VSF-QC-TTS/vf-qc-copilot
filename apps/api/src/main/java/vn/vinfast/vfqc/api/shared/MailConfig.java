package vn.vinfast.vfqc.api.shared;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import vn.vinfast.vfqc.api.mail.config.MailProperties;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Configuration
@EnableConfigurationProperties(MailProperties.class)
public class MailConfig {}
