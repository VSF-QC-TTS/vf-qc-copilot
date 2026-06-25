package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.token.EmailVerificationToken;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.UserStatus;
import vn.vinfast.vfqc.api.repository.EmailVerificationTokenRepository;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.EmailVerificationService;
import vn.vinfast.vfqc.api.service.OpaqueTokenService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

  private static final long TOKEN_TTL_HOURS = 24;

  private final EmailVerificationTokenRepository tokenRepository;
  private final UserRepository userRepository;
  private final OpaqueTokenService opaqueTokenService;

  @Override
  @Transactional
  public String createVerificationToken(User user) {
    String rawToken = opaqueTokenService.generateRawToken();
    EmailVerificationToken token =
        EmailVerificationToken.builder()
            .user(user)
            .tokenHash(opaqueTokenService.hash(rawToken))
            .expiresAt(OffsetDateTime.now().plusHours(TOKEN_TTL_HOURS))
            .build();

    tokenRepository.save(token);
    return rawToken;
  }

  @Override
  @Transactional
  public User verifyEmail(String rawToken) {
    OffsetDateTime now = OffsetDateTime.now();
    EmailVerificationToken token =
        tokenRepository
            .findByTokenHash(opaqueTokenService.hash(rawToken))
            .orElseThrow(() -> new ResourceException(ErrorCode.INVALID_EMAIL_VERIFICATION_TOKEN));

    if (token.isUsed()) {
      throw new ResourceException(ErrorCode.EMAIL_VERIFICATION_TOKEN_USED);
    }
    if (token.isExpired(now)) {
      throw new ResourceException(ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED);
    }

    User user = token.getUser();
    user.setStatus(UserStatus.ACTIVE);
    token.setUsedAt(now);
    userRepository.save(user);
    tokenRepository.save(token);
    return user;
  }
}
