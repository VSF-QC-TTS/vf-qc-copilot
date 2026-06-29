package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.validation.Valid;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;
import vn.vinfast.vfqc.api.model.testrun.request.AddCustomColumnRequest;
import vn.vinfast.vfqc.api.model.testrun.request.CreateTestRunRequest;
import vn.vinfast.vfqc.api.model.testrun.request.OverrideResultRequest;
import vn.vinfast.vfqc.api.model.testrun.request.SaveCustomValueRequest;
import vn.vinfast.vfqc.api.model.testrun.response.CustomColumnResponse;
import vn.vinfast.vfqc.api.model.testrun.response.RunEventResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestResultOverrideResponse;
import vn.vinfast.vfqc.api.model.testrun.response.TestRunJobResponse;
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
  private final Executor taskExecutor;

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

  @Operation(summary = "List custom columns of a test run")
  @GetMapping("/runs/{runPublicId}/custom-columns")
  public List<CustomColumnResponse> listCustomColumns(@PathVariable UUID runPublicId) {
    return testRunService.listCustomColumns(runPublicId);
  }

  @Operation(summary = "Add a custom column to a test run")
  @PostMapping("/runs/{runPublicId}/custom-columns")
  public CustomColumnResponse addCustomColumn(
      @PathVariable UUID runPublicId,
      @Valid @RequestBody AddCustomColumnRequest request) {
    return testRunService.addCustomColumn(runPublicId, request);
  }

  @Operation(summary = "Save value of a custom column on a test case result")
  @PostMapping("/results/{resultPublicId}/custom-values")
  public void saveCustomValue(
      @PathVariable UUID resultPublicId,
      @Valid @RequestBody SaveCustomValueRequest request) {
    testRunService.saveCustomValue(resultPublicId, request);
  }

  @Operation(summary = "QC override status/score of a test case result")
  @PostMapping("/results/{resultPublicId}/override")
  public TestResultOverrideResponse overrideResult(
      @PathVariable UUID resultPublicId,
      @Valid @RequestBody OverrideResultRequest request,
      Principal principal) {
    return testRunService.overrideResult(resultPublicId, request, principal.getName());
  }

  @Operation(summary = "Start test run Excel export job asynchronously")
  @PostMapping("/projects/{projectPublicId}/runs/{runPublicId}/exports/excel")
  public TestRunJobResponse startExport(
      @PathVariable UUID projectPublicId,
      @PathVariable UUID runPublicId,
      Principal principal) {
    return testRunService.startExport(runPublicId, principal.getName());
  }

  @Operation(summary = "Stream test run export job progress via SSE")
  @GetMapping(value = "/runs/jobs/{jobPublicId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamJob(@PathVariable UUID jobPublicId) {
    SseEmitter emitter = new SseEmitter(120_000L);
    taskExecutor.execute(
        () -> {
          try {
            while (true) {
              TestRunJobResponse event = testRunService.getJobEvent(jobPublicId);
              emitter.send(SseEmitter.event().name("test-run-job").data(event));
              if (event.status() == DatasetJobStatus.COMPLETED
                  || event.status() == DatasetJobStatus.FAILED
                  || event.status() == DatasetJobStatus.CANCELLED) {
                emitter.complete();
                break;
              }
              Thread.sleep(1000L);
            }
          } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            emitter.completeWithError(ex);
          } catch (Exception ex) {
            emitter.completeWithError(ex);
          }
        });
    return emitter;
  }

  @Operation(summary = "Download exported test run Excel report")
  @GetMapping(value = "/projects/{projectPublicId}/runs/{runPublicId}/downloads/{jobPublicId}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
  public ResponseEntity<byte[]> downloadExcel(
      @PathVariable UUID projectPublicId,
      @PathVariable UUID runPublicId,
      @PathVariable UUID jobPublicId) {
    return testRunService.downloadExcel(runPublicId, jobPublicId);
  }
}
