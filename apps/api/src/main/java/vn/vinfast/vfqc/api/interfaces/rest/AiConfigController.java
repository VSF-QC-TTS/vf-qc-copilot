package vn.vinfast.vfqc.api.interfaces.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
import vn.vinfast.vfqc.api.application.ai.AiConfigService;
import vn.vinfast.vfqc.api.interfaces.dto.ai.request.SaveAiConfigRequest;
import vn.vinfast.vfqc.api.interfaces.dto.ai.request.TestAiConfigRequest;
import vn.vinfast.vfqc.api.interfaces.dto.ai.response.AiConfigResponse;
import vn.vinfast.vfqc.api.infrastructure.ai.AiExecutionResult;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@RestController
@RequestMapping(value = "/api/v1/projects/{publicId}/config/ai", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "AI Config", description = "AI Configuration (evaluation + generation)")
public class AiConfigController {

  private final AiConfigService aiConfigService;

  @Operation(summary = "Save AI Config", description = "Saves or updates the AI configuration.")
  @PutMapping
  public AiConfigResponse save(
      @PathVariable UUID publicId,
      @Valid @RequestBody SaveAiConfigRequest req) {
    return aiConfigService.save(publicId, req);
  }

  @Operation(summary = "Get AI Config", description = "Gets the AI configuration. Secrets are masked.")
  @GetMapping
  public AiConfigResponse get(@PathVariable UUID publicId) {
    return aiConfigService.get(publicId);
  }

  @Operation(summary = "Test AI Config", description = "Tests the AI connection with sample prompts.")
  @PostMapping("/test")
  public AiExecutionResult test(
      @PathVariable UUID publicId,
      @Valid @RequestBody TestAiConfigRequest req) {
    return aiConfigService.test(publicId, req);
  }
}
