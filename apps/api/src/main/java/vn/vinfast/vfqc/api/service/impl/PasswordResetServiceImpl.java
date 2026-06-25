package vn.vinfast.vfqc.api.service.impl;

import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.token.PasswordResetToken;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.repository.PasswordResetTokenRepository;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.OpaqueTokenService;
import vn.vinfast.vfqc.api.service.PasswordResetService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

  private static final long TOKEN_TTL_HOURS = 1;

  private final PasswordResetTokenRepository tokenRepository;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final OpaqueTokenService opaqueTokenService;

  @Override
  @Transactional
  public String createResetToken(User user) {
    String rawToken = opaqueTokenService.generateRawToken();
    PasswordResetToken token =
        PasswordResetToken.builder()
            .user(user)
            .tokenHash(opaqueTokenService.hash(rawToken))
            .expiresAt(OffsetDateTime.now().plusHours(TOKEN_TTL_HOURS))
            .build();

    tokenRepository.save(token);
    return rawToken;
  }

  @Override
  @Transactional
  public void resetPassword(String rawToken, String newPassword) {
    OffsetDateTime now = OffsetDateTime.now();
    PasswordResetToken token =
        tokenRepository
            .findByTokenHash(opaqueTokenService.hash(rawToken))
            .orElseThrow(() -> new ResourceException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN));

    if (token.isUsed()) {
      throw new ResourceException(ErrorCode.PASSWORD_RESET_TOKEN_USED);
    }
    if (token.isExpired(now)) {
      throw new ResourceException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
    }

    User user = token.getUser();
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    token.setUsedAt(now);
    userRepository.save(user);
    tokenRepository.save(token);
  }
}
