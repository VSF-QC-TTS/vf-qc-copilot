package vn.vinfast.vfqc.api.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.vinfast.vfqc.api.model.targetconfig.SecretRef;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public interface SecretRefRepository extends JpaRepository<SecretRef, Long> {

  /**
   * Finds all secrets for a specific owner.
   *
   * @param ownerType type of owner (e.g., "TARGET_CONFIG", "JUDGE_CONFIG")
   * @param ownerId   internal ID of the owner
   * @return list of matching {@link SecretRef}s
   */
  List<SecretRef> findByOwnerTypeAndOwnerId(String ownerType, Long ownerId);

  /**
   * Deletes all secrets for a specific owner.
   *
   * @param ownerType type of owner
   * @param ownerId   internal ID of the owner
   */
  void deleteByOwnerTypeAndOwnerId(String ownerType, Long ownerId);
}
