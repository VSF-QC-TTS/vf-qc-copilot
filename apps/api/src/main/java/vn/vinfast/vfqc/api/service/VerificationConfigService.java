package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.verificationconfig.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.model.verificationconfig.response.VerificationConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Validated
public interface VerificationConfigService {

  VerificationConfigResponse get(UUID projectPublicId);

  VerificationConfigResponse save(UUID projectPublicId, @Valid SaveVerificationRequest request);
}
