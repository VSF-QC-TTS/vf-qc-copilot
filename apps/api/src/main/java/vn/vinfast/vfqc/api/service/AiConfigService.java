package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.ai.request.SaveAiConfigRequest;
import vn.vinfast.vfqc.api.model.ai.request.TestAiConfigRequest;
import vn.vinfast.vfqc.api.model.ai.response.AiConfigResponse;
import vn.vinfast.vfqc.api.shared.ai.AiExecutionResult;

/**
 * Application service for AI configuration management.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Validated
public interface AiConfigService {

  /**
   * Saves or updates the AI configuration for a project. If an API Key is provided, it is securely
   * encrypted and saved.
   *
   * @param projectPublicId the public ID of the project
   * @param req the AI configuration details to save
   * @return the saved AI configuration
   */
  AiConfigResponse save(UUID projectPublicId, @Valid SaveAiConfigRequest req);

  /**
   * Retrieves the current AI configuration for a project.
   *
   * @param projectPublicId the public ID of the project
   * @return the AI configuration
   */
  AiConfigResponse get(UUID projectPublicId);

  /**
   * Executes a test of the saved AI configuration using sample prompts. Uses the configured AI
   * provider and decrypted API Key.
   *
   * @param projectPublicId the public ID of the project
   * @param req the test request containing the system and user prompts
   * @return the execution result
   */
  AiExecutionResult test(UUID projectPublicId, @Valid TestAiConfigRequest req);
}
