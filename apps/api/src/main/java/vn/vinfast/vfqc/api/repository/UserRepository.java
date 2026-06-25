package vn.vinfast.vfqc.api.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.user.User;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
public interface UserRepository extends JpaRepository<User, Long> {

  /**
   * Checks whether a normalized email is already registered as a {@link User}.
   *
   * @param Email normalized email stored in the Email column
   * @return true when the user exists
   */
  boolean existsByEmail(String Email);

  /**
   * Finds a {@link User} by normalized email.
   *
   * @param Email normalized email stored in the Email column
   * @return {@link Optional} containing the matching {@link User} when present
   */
  Optional<User> findByEmail(String Email);

  /**
   * Finds a {@link User} by public identifier.
   *
   * @param publicId public user identifier
   * @return {@link Optional} containing the matching {@link User} when present
   */
  Optional<User> findByPublicId(UUID publicId);
}
