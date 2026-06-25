package vn.vinfast.vfqc.api.controller;

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
import vn.vinfast.vfqc.api.model.judgeconfig.request.SaveJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.request.TestJudgeConfigRequest;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeConfigResponse;
import vn.vinfast.vfqc.api.model.judgeconfig.response.JudgeExecutionResult;
import vn.vinfast.vfqc.api.service.JudgeConfigService;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@RestController
@RequestMapping(value = "/api/v1/projects/{publicId}/config/judge", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Judge Config", description = "Judge LLM Configuration")
public class JudgeConfigController {

  private final JudgeConfigService judgeConfigService;

  @Operation(summary = "Save Judge Config", description = "Saves or updates the LLM judge configuration.")
  @PutMapping
  public JudgeConfigResponse save(
      @PathVariable UUID publicId,
      @Valid @RequestBody SaveJudgeConfigRequest req) {
    return judgeConfigService.save(publicId, req);
  }

  @Operation(summary = "Get Judge Config", description = "Gets the LLM judge configuration. Secrets are masked.")
  @GetMapping
  public JudgeConfigResponse get(@PathVariable UUID publicId) {
    return judgeConfigService.get(publicId);
  }

  @Operation(summary = "Test Judge Config", description = "Tests the LLM connection with sample prompts.")
  @PostMapping("/test")
  public JudgeExecutionResult test(
      @PathVariable UUID publicId,
      @Valid @RequestBody TestJudgeConfigRequest req) {
    return judgeConfigService.test(publicId, req);
  }
}
