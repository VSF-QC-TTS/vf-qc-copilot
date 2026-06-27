package vn.vinfast.vfqc.api.application.verification;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.interfaces.dto.verification.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.interfaces.dto.verification.response.VerificationConfigResponse;

/**
 * Application service for verification configuration management.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Validated
public interface VerificationConfigService {

  /**
   * Retrieves the current verification configuration for a project.
   *
   * @param projectPublicId the public ID of the project
   * @return the verification configuration
   */
  VerificationConfigResponse get(UUID projectPublicId);

  /**
   * Saves or updates the verification configuration for a project.
   *
   * @param projectPublicId the public ID of the project
   * @param request the verification configuration details
   * @return the saved verification configuration
   */
  VerificationConfigResponse save(UUID projectPublicId, @Valid SaveVerificationRequest request);
}
