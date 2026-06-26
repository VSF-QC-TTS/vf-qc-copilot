package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.model.targetconfig.request.ExecuteCurlRequest;
import vn.vinfast.vfqc.api.model.targetconfig.request.SaveTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.request.TestTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.response.ConnectResponse;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.TestExecutionResult;
import vn.vinfast.vfqc.api.model.targetconfig.response.TargetConfigResponse;
import vn.vinfast.vfqc.api.service.TargetConfigService;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@RestController
@RequestMapping(value = "/api/v1/projects/{publicId}/config/target", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Target Config", description = "Target API Configuration")
public class TargetConfigController {

  private final TargetConfigService targetConfigService;

  @Operation(summary = "Connect via cURL", description = "Parses a cURL command, executes it, and saves the configuration in one atomic operation.")
  @PostMapping("/connect")
  public ConnectResponse connect(
      @PathVariable UUID publicId,
      @Valid @RequestBody ExecuteCurlRequest req) {
    return targetConfigService.connect(publicId, req);
  }

  @Operation(summary = "Save Target Config", description = "Updates lightweight fields (responsePath, name, timeoutMs) of the target API configuration.")
  @PutMapping
  public TargetConfigResponse save(
      @PathVariable UUID publicId,
      @Valid @RequestBody SaveTargetConfigRequest req) {
    return targetConfigService.save(publicId, req);
  }

  @Operation(summary = "Get Target Config", description = "Gets the target API configuration with secrets masked.")
  @GetMapping
  public TargetConfigResponse get(@PathVariable UUID publicId) {
    return targetConfigService.get(publicId);
  }

  @Operation(summary = "Test Target Config", description = "Re-tests the saved target config with sample input.")
  @PostMapping("/test")
  public TestExecutionResult test(
      @PathVariable UUID publicId,
      @Valid @RequestBody TestTargetConfigRequest req) {
    return targetConfigService.test(publicId, req);
  }

  @Operation(summary = "Get Response Fields", description = "Returns a flat list of JSON paths extracted from the last test response. Used for drag-and-drop field mapping in verification config.")
  @GetMapping("/response-fields")
  public List<String> getResponseFields(@PathVariable UUID publicId) {
    return targetConfigService.getResponseFields(publicId);
  }
}
