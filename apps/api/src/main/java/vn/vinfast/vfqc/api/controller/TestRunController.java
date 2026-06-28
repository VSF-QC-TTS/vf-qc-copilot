package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.response.RunEventResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunResponse;
import vn.vinfast.vfqc.api.service.TestRunService;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

@RestController
@RequestMapping(value = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Test Runs", description = "Test run lifecycle and result APIs")
public class TestRunController {

  private final TestRunService testRunService;

  @Operation(summary = "List project test runs")
  @GetMapping("/projects/{projectPublicId}/runs")
  public PageResponse<TestRunResponse> list(
      @PathVariable UUID projectPublicId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return testRunService.list(projectPublicId, page, size);
  }

  @Operation(summary = "Create test run")
  @PostMapping("/projects/{projectPublicId}/runs")
  public TestRunResponse create(
      @PathVariable UUID projectPublicId,
      @RequestBody(required = false) CreateTestRunRequest request,
      Principal principal) {
    return testRunService.create(projectPublicId, request, principal.getName());
  }

  @Operation(summary = "Get test run")
  @GetMapping("/runs/{runPublicId}")
  public TestRunResponse get(@PathVariable UUID runPublicId) {
    return testRunService.get(runPublicId);
  }

  @Operation(summary = "List test run results")
  @GetMapping("/runs/{runPublicId}/results")
  public PageResponse<TestResultResponse> results(
      @PathVariable UUID runPublicId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    return testRunService.listResults(runPublicId, page, size);
  }

  @Operation(summary = "List test run events")
  @GetMapping("/runs/{runPublicId}/events")
  public List<RunEventResponse> events(@PathVariable UUID runPublicId) {
    return testRunService.listEvents(runPublicId);
  }

  @Operation(summary = "Cancel test run")
  @PostMapping("/runs/{runPublicId}/cancel")
  public TestRunResponse cancel(@PathVariable UUID runPublicId) {
    return testRunService.cancel(runPublicId);
  }
}
