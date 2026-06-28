package vn.vinfast.vfqc.api.controller;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.model.runner.CancelStatusResponse;
import vn.vinfast.vfqc.api.model.runner.EvalRunRequestResponse;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseResultRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerCaseStartedRequest;
import vn.vinfast.vfqc.api.model.runner.RunnerFailureRequest;
import vn.vinfast.vfqc.api.service.runner.InternalRunService;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@RestController
@RequestMapping(value = "/api/v1/internal/runs/{runPublicId}", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class InternalRunController {

  private static final String INTERNAL_TOKEN_HEADER = "X-VFQC-Internal-Token";

  private final InternalRunService internalRunService;

  @Value("${vfqc.runner.internal-token:}")
  private String internalToken;

  @GetMapping("/eval-request")
  public EvalRunRequestResponse getEvalRequest(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token) {
    requireInternalToken(token);
    return internalRunService.getEvalRequest(runPublicId);
  }

  @PostMapping("/started")
  public void started(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token) {
    requireInternalToken(token);
    internalRunService.markStarted(runPublicId);
  }

  @PostMapping("/case-started")
  public void caseStarted(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token,
      @RequestBody RunnerCaseStartedRequest request) {
    requireInternalToken(token);
    internalRunService.markCaseStarted(runPublicId, request);
  }

  @PostMapping("/case-results")
  public void caseResults(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token,
      @RequestBody RunnerCaseResultRequest request) {
    requireInternalToken(token);
    internalRunService.saveCaseResult(runPublicId, request);
  }

  @PostMapping("/complete")
  public void complete(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token) {
    requireInternalToken(token);
    internalRunService.complete(runPublicId);
  }

  @PostMapping("/fail")
  public void fail(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token,
      @RequestBody(required = false) RunnerFailureRequest request) {
    requireInternalToken(token);
    internalRunService.fail(runPublicId, request);
  }

  @PostMapping("/cancelled")
  public void cancelled(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token) {
    requireInternalToken(token);
    internalRunService.cancel(runPublicId);
  }

  @GetMapping("/cancel-status")
  public CancelStatusResponse cancelStatus(
      @PathVariable UUID runPublicId,
      @RequestHeader(INTERNAL_TOKEN_HEADER) String token) {
    requireInternalToken(token);
    return internalRunService.getCancelStatus(runPublicId);
  }

  private void requireInternalToken(String token) {
    if (internalToken == null || internalToken.isBlank() || !internalToken.equals(token)) {
      throw ResourceException.of(ErrorCode.FORBIDDEN, "Invalid internal runner token.");
    }
  }
}
