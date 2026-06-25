package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.token.PasswordResetToken;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

  /**
   * Finds a {@link PasswordResetToken} by its persisted hash.
   *
   * @param tokenHash SHA-256 hash of the raw token
   * @return {@link Optional} containing the matching {@link PasswordResetToken} when present
   */
  Optional<PasswordResetToken> findByTokenHash(String tokenHash);
}
