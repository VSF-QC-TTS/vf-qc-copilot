package vn.vinfast.vfqc.api.service;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import vn.vinfast.vfqc.api.model.judgeconfig.request.SaveJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.request.TestJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeConfigResponse;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeExecutionResult;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Validated
public interface JudgeConfigService {

  /**
   * Saves or updates the judge API configuration for a project.
   * If an API Key is provided, it is securely encrypted and saved.
   *
   * @param projectPublicId the public ID of the project
   * @param req the judge configuration details to save
   * @return the saved judge configuration
   */
  JudgeConfigResponse save(UUID projectPublicId, @Valid SaveJudgeConfigRequest req);

  /**
   * Retrieves the current judge configuration for a project.
   *
   * @param projectPublicId the public ID of the project
   * @return the judge configuration
   */
  JudgeConfigResponse get(UUID projectPublicId);

  /**
   * Executes a test of the saved judge configuration using a sample prompt.
   * It uses the configured LLM provider and decrypted API Key.
   *
   * @param projectPublicId the public ID of the project
   * @param req the test request containing the system and user prompts
   * @return the execution result
   */
  JudgeExecutionResult test(UUID projectPublicId, @Valid TestJudgeConfigRequest req);
}
