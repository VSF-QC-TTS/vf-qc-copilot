package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.service.VerificationConfigService;
import vn.vinfast.vfqc.api.model.verification.CheckOperator;
import vn.vinfast.vfqc.api.model.verification.request.SaveVerificationRequest;
import vn.vinfast.vfqc.api.model.verification.response.OperatorCatalogResponse;
import vn.vinfast.vfqc.api.model.verification.response.VerificationConfigResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@RestController
@RequestMapping(value = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Verification Config", description = "Project Verification Logic")
public class VerificationConfigController {

  private final VerificationConfigService verificationConfigService;

  @Operation(
      summary = "Get Verification Config",
      description = "Retrieves the verification configuration for a project.")
  @GetMapping("/projects/{publicId}/config/verification")
  public VerificationConfigResponse get(@PathVariable UUID publicId) {
    return verificationConfigService.get(publicId);
  }

  @Operation(
      summary = "Save Verification Config",
      description = "Saves or updates the verification configuration.")
  @PutMapping("/projects/{publicId}/config/verification")
  public VerificationConfigResponse save(
      @PathVariable UUID publicId, @Valid @RequestBody SaveVerificationRequest request) {
    return verificationConfigService.save(publicId, request);
  }

  @Operation(summary = "List Operators", description = "Lists all available check operators.")
  @GetMapping("/verification/operators")
  public List<OperatorCatalogResponse> listOperators() {
    return Arrays.stream(CheckOperator.values())
        .map(
            op ->
                new OperatorCatalogResponse(
                    op,
                    op.getDisplayName(),
                    op.getDescription(),
                    op.getCategory(),
                    op.isRequiresExpected(),
                    op.getSupportedExpectedSources()))
        .toList();
  }
}
