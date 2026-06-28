package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.targetconfig.request.ExecuteCurlRequest;
import vn.vinfast.vfqc.api.model.targetconfig.request.SaveTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.request.TestTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.response.ConnectResponse;
import vn.vinfast.vfqc.api.model.targetconfig.response.TargetConfigResponse;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.TestExecutionResult;
import vn.vinfast.vfqc.api.model.targetconfig.response.ResponseFieldExampleResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Validated
public interface TargetConfigService {

  /**
   * Parses a raw cURL command, executes it, and saves the configuration in one atomic operation.
   * Secrets are detected, encrypted, and persisted. The cURL is stored for later viewing.
   *
   * @param projectPublicId the public ID of the project
   * @param req the request containing the raw cURL command
   * @return the connect response including saved config, detected secrets, and test result
   */
  ConnectResponse connect(UUID projectPublicId, @Valid ExecuteCurlRequest req);

  /**
   * Saves or updates the target API configuration for a project.
   * Only updates lightweight fields (responsePath, name, timeoutMs).
   * Any detected secrets are securely encrypted before saving.
   *
   * @param projectPublicId the public ID of the project
   * @param req the target configuration details to save
   * @return the saved target configuration
   */
  TargetConfigResponse save(UUID projectPublicId, @Valid SaveTargetConfigRequest req);

  /**
   * Retrieves the current target configuration for a project.
   * Sensitive data (secrets) are masked in the response.
   *
   * @param projectPublicId the public ID of the project
   * @return the target configuration
   */
  TargetConfigResponse get(UUID projectPublicId);

  /**
   * Executes a test of the saved target configuration using sample inputs.
   * It decrypts any stored secrets before sending the request.
   *
   * @param projectPublicId the public ID of the project
   * @param req the sample input variables for template substitution
   * @return the result of the test execution
   */
  TestExecutionResult test(UUID projectPublicId, @Valid TestTargetConfigRequest req);

  /**
   * Extracts a flat list of JSON paths from the stored response field snapshot.
   * Frontend uses this list to render dropdown or drag-and-drop for field mapping.
   *
   * @param projectPublicId the public ID of the project
   * @return a list of JSON paths (e.g. "$.data.vin", "$.data.engine.power")
   */
  List<String> getResponseFields(UUID projectPublicId);

  /**
   * Extracts JSON paths and sample values from the stored response field snapshot.
   *
   * @param projectPublicId the public ID of the project
   * @return response fields with example values from the latest successful target test
   */
  List<ResponseFieldExampleResponse> getResponseFieldExamples(UUID projectPublicId);
}
