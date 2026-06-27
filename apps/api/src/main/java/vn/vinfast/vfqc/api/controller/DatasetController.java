package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.UUID;
import java.util.concurrent.Executor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.HttpStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;
import vn.vinfast.vfqc.api.model.dataset.request.ConfirmDatasetImportRequest;
import vn.vinfast.vfqc.api.model.dataset.request.CreateDatasetRequest;
import vn.vinfast.vfqc.api.model.dataset.request.GenerateDatasetRequest;
import vn.vinfast.vfqc.api.model.dataset.request.SaveDatasetRowsRequest;
import vn.vinfast.vfqc.api.model.dataset.request.UpdateDatasetRequest;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetDetailResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetJobEventResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetJobResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetRowResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetSummaryResponse;
import vn.vinfast.vfqc.api.service.impl.DatasetServiceImpl;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;

@RestController
@RequestMapping(value = "/api/v1", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Tag(name = "Datasets", description = "Dataset import, generation, export, and row management APIs")
public class DatasetController {

  private final DatasetServiceImpl datasetService;
  private final Executor taskExecutor;

  @Operation(summary = "List project datasets")
  @GetMapping("/projects/{projectPublicId}/datasets")
  public PageResponse<DatasetSummaryResponse> list(
      @PathVariable UUID projectPublicId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return datasetService.list(projectPublicId, page, size);
  }

  @Operation(summary = "Create dataset")
  @PostMapping(
      value = "/projects/{projectPublicId}/datasets",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public DatasetDetailResponse create(
      @PathVariable UUID projectPublicId,
      @RequestBody CreateDatasetRequest request,
      Principal principal) {
    return datasetService.create(projectPublicId, request, principal.getName());
  }

  @Operation(summary = "Get dataset")
  @GetMapping("/datasets/{datasetPublicId}")
  public DatasetDetailResponse get(@PathVariable UUID datasetPublicId) {
    return datasetService.get(datasetPublicId);
  }

  @Operation(summary = "Update dataset")
  @PatchMapping(value = "/datasets/{datasetPublicId}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public DatasetDetailResponse update(
      @PathVariable UUID datasetPublicId, @RequestBody UpdateDatasetRequest request) {
    return datasetService.update(datasetPublicId, request);
  }

  @Operation(summary = "Archive dataset")
  @DeleteMapping("/datasets/{datasetPublicId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void archive(@PathVariable UUID datasetPublicId) {
    datasetService.archive(datasetPublicId);
  }

  @Operation(summary = "Import Excel dataset")
  @PostMapping(
      value = "/datasets/{datasetPublicId}/imports/excel",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public DatasetJobResponse importExcel(
      @PathVariable UUID datasetPublicId,
      @RequestPart("file") MultipartFile file,
      Principal principal) {
    return datasetService.startImport(datasetPublicId, file, principal.getName());
  }

  @Operation(summary = "Confirm Excel import column mappings")
  @PostMapping(
      value = "/datasets/{datasetPublicId}/imports/{jobPublicId}/confirm",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public DatasetJobResponse confirmImport(
      @PathVariable UUID datasetPublicId,
      @PathVariable UUID jobPublicId,
      @RequestBody ConfirmDatasetImportRequest request) {
    return datasetService.confirmImport(jobPublicId, request);
  }

  @Operation(summary = "Generate dataset rows with AI")
  @PostMapping(
      value = "/datasets/{datasetPublicId}/generations",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public DatasetJobResponse generate(
      @PathVariable UUID datasetPublicId,
      @RequestBody GenerateDatasetRequest request,
      Principal principal) {
    return datasetService.startGeneration(datasetPublicId, request, principal.getName());
  }

  @Operation(summary = "Prepare Excel export")
  @PostMapping("/datasets/{datasetPublicId}/versions/{versionPublicId}/exports/excel")
  public DatasetJobResponse exportExcel(
      @PathVariable UUID datasetPublicId,
      @PathVariable UUID versionPublicId,
      Principal principal) {
    return datasetService.startExport(datasetPublicId, versionPublicId, principal.getName());
  }

  @Operation(summary = "Download Excel export")
  @GetMapping(
      value = "/datasets/{datasetPublicId}/versions/{versionPublicId}/download.xlsx",
      produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  public ResponseEntity<byte[]> downloadExcel(
      @PathVariable UUID datasetPublicId, @PathVariable UUID versionPublicId) {
    return datasetService.download(datasetPublicId, versionPublicId);
  }

  @Operation(summary = "List dataset rows")
  @GetMapping("/datasets/{datasetPublicId}/versions/{versionPublicId}/rows")
  public PageResponse<DatasetRowResponse> listRows(
      @PathVariable UUID datasetPublicId,
      @PathVariable UUID versionPublicId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) {
    return datasetService.listRows(datasetPublicId, versionPublicId, page, size);
  }

  @Operation(summary = "Save dataset rows as a draft version")
  @PostMapping(
      value = "/datasets/{datasetPublicId}/versions/{versionPublicId}/rows",
      consumes = MediaType.APPLICATION_JSON_VALUE)
  public DatasetDetailResponse saveRows(
      @PathVariable UUID datasetPublicId,
      @PathVariable UUID versionPublicId,
      @RequestBody SaveDatasetRowsRequest request,
      Principal principal) {
    return datasetService.saveRows(datasetPublicId, versionPublicId, request, principal.getName());
  }

  @Operation(summary = "Activate dataset version")
  @PostMapping("/datasets/{datasetPublicId}/versions/{versionPublicId}/activate")
  public DatasetDetailResponse activate(
      @PathVariable UUID datasetPublicId, @PathVariable UUID versionPublicId) {
    return datasetService.activate(datasetPublicId, versionPublicId);
  }

  @Operation(summary = "Get dataset job")
  @GetMapping("/dataset-jobs/{jobPublicId}")
  public DatasetJobResponse getJob(@PathVariable UUID jobPublicId) {
    return datasetService.getJob(jobPublicId);
  }

  @Operation(summary = "Cancel dataset job")
  @PostMapping("/dataset-jobs/{jobPublicId}/cancel")
  public DatasetJobResponse cancelJob(@PathVariable UUID jobPublicId) {
    return datasetService.cancelJob(jobPublicId);
  }

  @Operation(summary = "Stream dataset job progress")
  @GetMapping(value = "/dataset-jobs/{jobPublicId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamJob(@PathVariable UUID jobPublicId) {
    SseEmitter emitter = new SseEmitter(120_000L);
    taskExecutor.execute(
        () -> {
          try {
            while (true) {
              DatasetJobEventResponse event = datasetService.getJobEvent(jobPublicId);
              emitter.send(SseEmitter.event().name("dataset-job").data(event));
              if (isTerminal(event.status())) {
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

  private boolean isTerminal(DatasetJobStatus status) {
    return status == DatasetJobStatus.COMPLETED
        || status == DatasetJobStatus.FAILED
        || status == DatasetJobStatus.CANCELLED;
  }
}
