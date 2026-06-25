package vn.vinfast.vfqc.api.service;

import java.util.Map;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.TestExecutionResult;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
public interface TargetHttpExecutor {

  /**
   * Executes an HTTP request based on a parsed cURL command.
   *
   * @param parsed the parsed cURL command containing URL, headers, and body
   * @param timeoutMs the execution timeout in milliseconds
   * @return the result of the execution including status code and response body
   */
  TestExecutionResult execute(ParsedCurlCommand parsed, Integer timeoutMs);

  /**
   * Executes an HTTP request using a saved TargetConfig, applying decrypted secrets and sample inputs.
   *
   * @param config the target configuration entity
   * @param decryptedSecrets a map of decrypted secrets to inject into headers or query parameters
   * @param sampleInput a map of sample values to substitute into the body template
   * @return the result of the execution including status code and response body
   */
  TestExecutionResult execute(TargetConfig config, Map<String, String> decryptedSecrets, Map<String, String> sampleInput);
}
