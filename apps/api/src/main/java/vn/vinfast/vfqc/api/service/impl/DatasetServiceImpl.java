package vn.vinfast.vfqc.api.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vn.vinfast.vfqc.api.model.ai.AiConfig;
import vn.vinfast.vfqc.api.model.ai.AiUseCase;
import vn.vinfast.vfqc.api.model.dataset.Dataset;
import vn.vinfast.vfqc.api.model.dataset.DatasetColumnMappingAction;
import vn.vinfast.vfqc.api.model.dataset.DatasetJob;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetJobType;
import vn.vinfast.vfqc.api.model.dataset.DatasetRow;
import vn.vinfast.vfqc.api.model.dataset.DatasetRowValidationStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetSource;
import vn.vinfast.vfqc.api.model.dataset.DatasetStatus;
import vn.vinfast.vfqc.api.model.dataset.DatasetValidationError;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersion;
import vn.vinfast.vfqc.api.model.dataset.DatasetVersionStatus;
import vn.vinfast.vfqc.api.model.dataset.request.ConfirmDatasetImportRequest;
import vn.vinfast.vfqc.api.model.dataset.request.CreateDatasetRequest;
import vn.vinfast.vfqc.api.model.dataset.request.DatasetColumnMappingRequest;
import vn.vinfast.vfqc.api.model.dataset.request.GenerateDatasetRequest;
import vn.vinfast.vfqc.api.model.dataset.request.SaveDatasetRowsRequest;
import vn.vinfast.vfqc.api.model.dataset.request.UpdateDatasetRequest;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetColumnMappingSuggestionResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetDetailResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetJobEventResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetJobResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetRowResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetSummaryResponse;
import vn.vinfast.vfqc.api.model.dataset.response.DatasetVersionSummaryResponse;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.schema.ProjectSchema;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.repository.JpaAiConfigRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetJobRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetRowRepository;
import vn.vinfast.vfqc.api.repository.JpaDatasetVersionRepository;
import vn.vinfast.vfqc.api.repository.JpaProjectSchemaRepository;
import vn.vinfast.vfqc.api.repository.JpaSchemaColumnRepository;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.shared.ai.AiExecutionResult;
import vn.vinfast.vfqc.api.shared.ai.AiProviderFactory;
import vn.vinfast.vfqc.api.shared.ai.AiRequest;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

@Slf4j
@Service
@RequiredArgsConstructor
public class DatasetServiceImpl {

  private static final TypeReference<List<Map<String, Object>>> ROWS_TYPE = new TypeReference<>() {};
  private static final TypeReference<List<DatasetValidationError>> ERRORS_TYPE = new TypeReference<>() {};
  private static final TypeReference<List<DatasetColumnMappingSuggestionResponse>> SUGGESTIONS_TYPE =
      new TypeReference<>() {};

  private final ProjectRepository projectRepository;
  private final UserRepository userRepository;
  private final JpaProjectSchemaRepository schemaRepository;
  private final JpaSchemaColumnRepository columnRepository;
  private final JpaDatasetRepository datasetRepository;
  private final JpaDatasetVersionRepository versionRepository;
  private final JpaDatasetRowRepository rowRepository;
  private final JpaDatasetJobRepository jobRepository;
  private final JpaAiConfigRepository aiConfigRepository;
  private final AiProviderFactory providerFactory;
  private final SecretManager secretManager;
  private final DatasetValidationServiceImpl validationService;
  private final ObjectMapper objectMapper;
  private final Executor taskExecutor;
  private final TransactionTemplate transactionTemplate;

  @Transactional(readOnly = true)
  public PageResponse<DatasetSummaryResponse> list(UUID projectPublicId, int page, int size) {
    Project project = getProjectOrThrow(projectPublicId);
    int pageNumber = Math.max(page, 0);
    int pageSize = Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(pageNumber, pageSize);
    return PageResponse.of(
        datasetRepository
            .findByProjectIdAndDeletedAtIsNullOrderByCreatedAtDesc(project.getId(), pageable)
            .map(this::toSummary));
  }

  @Transactional
  public DatasetDetailResponse create(UUID projectPublicId, CreateDatasetRequest request, String email) {
    Project project = getProjectOrThrow(projectPublicId);
    User user = getUser(email);
    ProjectSchema schema = getSchemaOrThrow(project.getId());
    Dataset dataset =
        datasetRepository.save(
            Dataset.builder()
                .projectId(project.getId())
                .name(request.name().trim())
                .description(request.description())
                .source(DatasetSource.MANUAL)
                .schemaVersionId(schema.getId())
                .createdBy(user.getId())
                .status(DatasetStatus.DRAFT)
                .build());
    log.info("Dataset created: publicId={}, name='{}', projectId={}", dataset.getPublicId(), dataset.getName(), project.getPublicId());
    return get(dataset.getPublicId());
  }

  @Transactional(readOnly = true)
  public DatasetDetailResponse get(UUID datasetPublicId) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    List<DatasetVersionSummaryResponse> versions =
        versionRepository.findByDatasetIdOrderByVersionNumberDesc(dataset.getId()).stream()
            .map(this::toVersionSummary)
            .toList();
    return new DatasetDetailResponse(
        dataset.getPublicId(),
        dataset.getName(),
        dataset.getDescription(),
        dataset.getSource(),
        dataset.getStatus(),
        versionSummary(dataset.getLatestVersionId()),
        versionSummary(dataset.getActiveVersionId()),
        versions,
        dataset.getCreatedAt(),
        dataset.getUpdatedAt());
  }

  @Transactional
  public DatasetDetailResponse update(UUID datasetPublicId, UpdateDatasetRequest request) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    if (StringUtils.hasText(request.name())) {
      dataset.setName(request.name().trim());
    }
    if (request.description() != null) {
      dataset.setDescription(request.description());
    }
    datasetRepository.save(dataset);
    return get(datasetPublicId);
  }

  @Transactional
  public void archive(UUID datasetPublicId) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    log.info("Archiving dataset: publicId={}, name='{}'", dataset.getPublicId(), dataset.getName());
    dataset.softDelete();
    datasetRepository.save(dataset);
  }

  @Transactional
  public DatasetJobResponse startImport(UUID datasetPublicId, MultipartFile file, String sheetName, String email) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    User user = getUser(email);
    log.info("Starting Excel import: dataset={}, file='{}', size={} bytes, sheet='{}', user={}",
        datasetPublicId, file.getOriginalFilename(), file.getSize(), sheetName, email);
    DatasetJob job =
        jobRepository.save(
            DatasetJob.builder()
                .projectId(dataset.getProjectId())
                .datasetId(dataset.getId())
                .type(DatasetJobType.IMPORT_EXCEL)
                .payload(writeJson(Map.of("sheetName", sheetName != null ? sheetName : "")))
                .createdBy(user.getId())
                .message("Queued Excel import")
                .build());
    byte[] bytes = readFileBytes(file);
    log.info("Excel import job queued: jobId={}, datasetId={}", job.getPublicId(), datasetPublicId);
    executeAfterCommit(() -> runImport(job.getPublicId(), bytes));
    return toJobResponse(job);
  }

  public List<String> getExcelSheets(MultipartFile file) {
    try (var input = file.getInputStream();
        var workbook = WorkbookFactory.create(input)) {
      List<String> sheets = new ArrayList<>();
      for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
        sheets.add(workbook.getSheetName(i));
      }
      return sheets;
    } catch (Exception e) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Failed to parse Excel sheet names: " + e.getMessage());
    }
  }

  @Transactional
  public DatasetJobResponse confirmImport(UUID jobPublicId, ConfirmDatasetImportRequest request) {
    DatasetJob job = getJobOrThrow(jobPublicId);
    if (job.getStatus() != DatasetJobStatus.NEEDS_CONFIRMATION) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Import job is not waiting for confirmation.");
    }
    log.info("Import confirmation received: jobId={}, mappings={}", jobPublicId, request.mappings().size());
    executeAfterCommit(() -> runImportConfirmation(jobPublicId, request));
    return toJobResponse(job);
  }

  @Transactional
  public DatasetJobResponse startGeneration(UUID datasetPublicId, GenerateDatasetRequest request, String email) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    User user = getUser(email);
    DatasetJob job =
        jobRepository.save(
            DatasetJob.builder()
                .projectId(dataset.getProjectId())
                .datasetId(dataset.getId())
                .type(DatasetJobType.AI_GENERATE)
                .payload(writeJson(request))
                .createdBy(user.getId())
                .message("Queued AI generation")
                .build());
    executeAfterCommit(() -> runGeneration(job.getPublicId()));
    return toJobResponse(job);
  }

  @Transactional
  public DatasetJobResponse startExport(UUID datasetPublicId, UUID versionPublicId, String email) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    DatasetVersion version = getVersionOrThrow(versionPublicId);
    if (!version.getDatasetId().equals(dataset.getId())) {
      throw ResourceException.of(ErrorCode.DATASET_NOT_FOUND);
    }
    User user = getUser(email);
    DatasetJob job =
        jobRepository.save(
            DatasetJob.builder()
                .projectId(dataset.getProjectId())
                .datasetId(dataset.getId())
                .datasetVersionId(version.getId())
                .type(DatasetJobType.EXPORT_EXCEL)
                .createdBy(user.getId())
                .message("Queued Excel export")
                .build());
    executeAfterCommit(() -> runExport(job.getPublicId()));
    return toJobResponse(job);
  }

  private void executeAfterCommit(Runnable task) {
    if (TransactionSynchronizationManager.isActualTransactionActive()) {
      TransactionSynchronizationManager.registerSynchronization(
          new TransactionSynchronization() {
            @Override
            public void afterCommit() {
              taskExecutor.execute(task);
            }
          });
    } else {
      taskExecutor.execute(task);
    }
  }

  @Transactional
  public DatasetJobResponse cancelJob(UUID jobPublicId) {
    DatasetJob job = getJobOrThrow(jobPublicId);
    if (isTerminal(job.getStatus())) {
      return toJobResponse(job);
    }
    job.setStatus(DatasetJobStatus.CANCEL_REQUESTED);
    job.setMessage("Cancel requested");
    return toJobResponse(jobRepository.save(job));
  }

  @Transactional(readOnly = true)
  public DatasetJobResponse getJob(UUID jobPublicId) {
    return toJobResponse(getJobOrThrow(jobPublicId));
  }

  @Transactional(readOnly = true)
  public DatasetJobEventResponse getJobEvent(UUID jobPublicId) {
    return toJobEvent(getJobOrThrow(jobPublicId));
  }

  @Transactional(readOnly = true)
  public PageResponse<DatasetRowResponse> listRows(UUID datasetPublicId, UUID versionPublicId, int page, int size) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    DatasetVersion version = getVersionOrThrow(versionPublicId);
    if (!version.getDatasetId().equals(dataset.getId())) {
      throw ResourceException.of(ErrorCode.DATASET_NOT_FOUND);
    }
    Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200));
    return PageResponse.of(
        rowRepository
            .findByDatasetVersionIdOrderByRowIndexAsc(version.getId(), pageable)
            .map(this::toRowResponse));
  }

  @Transactional
  public DatasetDetailResponse saveRows(UUID datasetPublicId, UUID versionPublicId, SaveDatasetRowsRequest request, String email) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    DatasetVersion baseVersion = getVersionOrThrow(versionPublicId);
    if (!baseVersion.getDatasetId().equals(dataset.getId())) {
      throw ResourceException.of(ErrorCode.DATASET_NOT_FOUND);
    }
    User user = getUser(email);
    List<SchemaColumn> columns = columnsForVersion(baseVersion.getSchemaVersionId());
    DatasetVersion newVersion = createVersion(dataset, baseVersion.getSchemaVersionId(), DatasetSource.MANUAL, user.getId(), request.rows(), columns);
    dataset.setLatestVersionId(newVersion.getId());
    datasetRepository.save(dataset);
    return get(datasetPublicId);
  }

  @Transactional
  public DatasetDetailResponse activate(UUID datasetPublicId, UUID versionPublicId) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    DatasetVersion version = getVersionOrThrow(versionPublicId);
    if (!version.getDatasetId().equals(dataset.getId())) {
      throw ResourceException.of(ErrorCode.DATASET_NOT_FOUND);
    }
    if (version.getInvalidRows() > 0 || version.getStatus() == DatasetVersionStatus.INVALID) {
      throw ResourceException.of(ErrorCode.VALIDATION_ERROR, "Cannot activate an invalid dataset version.");
    }
    log.info("Activating dataset version: dataset={}, version=v{}, rows={}",
        datasetPublicId, version.getVersionNumber(), version.getTotalRows());
    version.setStatus(DatasetVersionStatus.ACTIVE);
    versionRepository.save(version);
    dataset.setActiveVersionId(version.getId());
    dataset.setLatestVersionId(version.getId());
    dataset.setStatus(DatasetStatus.ACTIVE);
    datasetRepository.save(dataset);
    return get(datasetPublicId);
  }

  @Transactional(readOnly = true)
  public ResponseEntity<byte[]> download(UUID datasetPublicId, UUID versionPublicId) {
    Dataset dataset = getDatasetOrThrow(datasetPublicId);
    DatasetVersion version = getVersionOrThrow(versionPublicId);
    if (!version.getDatasetId().equals(dataset.getId())) {
      throw ResourceException.of(ErrorCode.DATASET_NOT_FOUND);
    }
    byte[] bytes = buildWorkbookBytes(version);
    String filename = safeFilename(dataset.getName()) + "-v" + version.getVersionNumber() + ".xlsx";
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .body(bytes);
  }

  private void runImport(UUID jobPublicId, byte[] bytes) {
    log.info("[IMPORT] Starting async import: jobId={}, fileSize={} bytes", jobPublicId, bytes.length);
    transactionTemplate.executeWithoutResult(status -> {
      DatasetJob job = markRunning(jobPublicId, "Parsing Excel", 10);
      if (isCancelRequested(job)) {
        log.info("[IMPORT] Job cancelled before start: jobId={}", jobPublicId);
        markCancelled(job);
        return;
      }
      try {
        String sheetName = null;
        if (StringUtils.hasText(job.getPayload())) {
          try {
            Map<String, String> payloadMap = objectMapper.readValue(job.getPayload(), new TypeReference<>() {});
            sheetName = payloadMap.get("sheetName");
          } catch (Exception ignored) {}
        }
        ImportPayload payload = parseExcel(bytes, sheetName);
        log.info("[IMPORT] Parsed Excel: jobId={}, headers={}, rows={}", jobPublicId, payload.headers(), payload.rows().size());
        Dataset dataset = getDatasetById(job.getDatasetId());
        List<SchemaColumn> columns = currentColumns(dataset.getProjectId());
        List<DatasetColumnMappingSuggestionResponse> suggestions = suggestMappings(payload.headers(), columns);
        boolean needsConfirmation = suggestions.stream().anyMatch(DatasetColumnMappingSuggestionResponse::newColumn);
        log.info("[IMPORT] Column mapping: jobId={}, needsConfirmation={}, suggestions={}", jobPublicId, needsConfirmation, suggestions.size());
        job.setPayload(writeJson(Map.of("headers", payload.headers(), "rows", payload.rows())));
        if (needsConfirmation) {
          job.setStatus(DatasetJobStatus.NEEDS_CONFIRMATION);
          job.setProgress(50);
          job.setMessage("Confirm column mapping");
          job.setResult(writeJson(suggestions));
          jobRepository.save(job);
          log.info("[IMPORT] Awaiting user confirmation: jobId={}", jobPublicId);
          return;
        }
        List<Map<String, Object>> mappedRows =
            applyMappings(payload.rows(), mappingRequestsFromSuggestions(suggestions), columns);
        DatasetVersion version =
            createVersion(dataset, dataset.getSchemaVersionId(), DatasetSource.IMPORTED, job.getCreatedBy(), mappedRows, columns);
        completeJob(job, version, "Import completed");
        log.info("[IMPORT] Completed: jobId={}, version=v{}, rows={}", jobPublicId, version.getVersionNumber(), mappedRows.size());
      } catch (Exception ex) {
        log.error("[IMPORT] Failed: jobId={}", jobPublicId, ex);
        status.setRollbackOnly();
        transactionTemplate.executeWithoutResult(s -> failJob(getJobOrThrow(jobPublicId), "Import failed: " + ex.getMessage()));
      }
    });
  }

  private void runImportConfirmation(UUID jobPublicId, ConfirmDatasetImportRequest request) {
    log.info("[IMPORT-CONFIRM] Starting: jobId={}, mappings={}", jobPublicId, request.mappings().size());
    transactionTemplate.executeWithoutResult(status -> {
      DatasetJob job = markRunning(jobPublicId, "Applying mapping", 60);
      if (isCancelRequested(job)) {
        log.info("[IMPORT-CONFIRM] Cancelled: jobId={}", jobPublicId);
        markCancelled(job);
        return;
      }
      try {
        Map<String, Object> payload = readMap(job.getPayload());
        List<Map<String, Object>> rawRows = objectMapper.convertValue(payload.get("rows"), ROWS_TYPE);
        Dataset dataset = getDatasetById(job.getDatasetId());
        List<SchemaColumn> columns = currentColumns(dataset.getProjectId());
        List<Map<String, Object>> mappedRows = applyMappings(rawRows, request.mappings(), columns);
        List<SchemaColumn> updatedColumns = currentColumns(dataset.getProjectId());
        DatasetVersion version = createVersion(dataset, dataset.getSchemaVersionId(), DatasetSource.IMPORTED, job.getCreatedBy(), mappedRows, updatedColumns);
        completeJob(job, version, "Import completed");
        log.info("[IMPORT-CONFIRM] Completed: jobId={}, version=v{}, rows={}", jobPublicId, version.getVersionNumber(), mappedRows.size());
      } catch (Exception ex) {
        log.error("[IMPORT-CONFIRM] Failed: jobId={}", jobPublicId, ex);
        status.setRollbackOnly();
        transactionTemplate.executeWithoutResult(s -> failJob(getJobOrThrow(jobPublicId), "Import confirmation failed: " + ex.getMessage()));
      }
    });
  }

  private void runGeneration(UUID jobPublicId) {
    log.info("[AI-GEN] Starting: jobId={}", jobPublicId);
    transactionTemplate.executeWithoutResult(status -> {
      DatasetJob job = markRunning(jobPublicId, "Preparing AI prompt", 15);
      if (isCancelRequested(job)) {
        log.info("[AI-GEN] Cancelled: jobId={}", jobPublicId);
        markCancelled(job);
        return;
      }
      try {
        GenerateDatasetRequest request = objectMapper.readValue(job.getPayload(), GenerateDatasetRequest.class);
        Dataset dataset = getDatasetById(job.getDatasetId());
        List<SchemaColumn> columns = currentColumns(dataset.getProjectId());
        AiConfig aiConfig =
            aiConfigRepository
                .findByProjectId(dataset.getProjectId())
                .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_AI_CONFIG));
        String apiKey = secretManager.decryptForOwner("AI_CONFIG", dataset.getProjectId()).get("API_KEY");
        if (!StringUtils.hasText(apiKey)) {
          throw ResourceException.of(ErrorCode.BAD_REQUEST, "Missing AI API key.");
        }
        log.info("[AI-GEN] Calling provider: jobId={}, provider={}, model={}", jobPublicId, aiConfig.getProvider(), aiConfig.getEvaluationModel());
        updateJob(job, DatasetJobStatus.RUNNING, 35, "Calling AI provider");
        AiExecutionResult result =
            providerFactory
                .getAdapter(aiConfig.getProvider())
                .execute(new AiRequest(aiConfig, apiKey, AiUseCase.GENERATION, generationSystemPrompt(columns), generationUserPrompt(request)));
        if (!result.successful() || !StringUtils.hasText(result.generatedText())) {
          throw ResourceException.of(ErrorCode.BAD_REQUEST, result.errorMessage() != null ? result.errorMessage() : "AI generation failed.");
        }
        List<Map<String, Object>> rows = parseGeneratedRows(result.generatedText());
        DatasetVersion version = createVersion(dataset, dataset.getSchemaVersionId(), DatasetSource.AI_GENERATED, job.getCreatedBy(), rows, columns);
        completeJob(job, version, "AI generation completed");
        log.info("[AI-GEN] Completed: jobId={}, version=v{}, rows={}", jobPublicId, version.getVersionNumber(), rows.size());
      } catch (Exception ex) {
        log.error("[AI-GEN] Failed: jobId={}", jobPublicId, ex);
        status.setRollbackOnly();
        transactionTemplate.executeWithoutResult(s -> failJob(getJobOrThrow(jobPublicId), "AI generation failed: " + ex.getMessage()));
      }
    });
  }

  private void runExport(UUID jobPublicId) {
    log.info("[EXPORT] Starting: jobId={}", jobPublicId);
    transactionTemplate.executeWithoutResult(status -> {
      DatasetJob job = markRunning(jobPublicId, "Preparing Excel export", 40);
      if (isCancelRequested(job)) {
        log.info("[EXPORT] Cancelled: jobId={}", jobPublicId);
        markCancelled(job);
        return;
      }
      try {
        DatasetVersion version = getVersionById(job.getDatasetVersionId());
        buildWorkbookBytes(version);
        completeJob(job, version, "Export ready");
        log.info("[EXPORT] Completed: jobId={}, version=v{}", jobPublicId, version.getVersionNumber());
      } catch (Exception ex) {
        log.error("[EXPORT] Failed: jobId={}", jobPublicId, ex);
        status.setRollbackOnly();
        transactionTemplate.executeWithoutResult(s -> failJob(getJobOrThrow(jobPublicId), "Export failed: " + ex.getMessage()));
      }
    });
  }

  private DatasetVersion createVersion(
      Dataset dataset,
      Long schemaVersionId,
      DatasetSource source,
      Long userId,
      List<Map<String, Object>> rows,
      List<SchemaColumn> columns) {
    log.debug("Creating version: dataset={}, source={}, rows={}, columns={}",
        dataset.getPublicId(), source, rows.size(), columns.size());
    List<DatasetValidationError> schemaErrors = validationService.validateSchemaReadiness(columns);
    if (!schemaErrors.isEmpty()) {
      log.warn("Schema not ready: dataset={}, errors={}", dataset.getPublicId(), schemaErrors);
      throw ResourceException.of(
          ErrorCode.VALIDATION_ERROR,
          schemaErrors.stream()
              .map(DatasetValidationError::message)
              .reduce((left, right) -> left + " " + right)
              .orElse("Dataset schema is not ready."));
    }
    List<DatasetValidationError> allErrors = validationService.validateRows(columns, rows);
    Map<Integer, List<DatasetValidationError>> errorsByRow = new HashMap<>();
    for (DatasetValidationError error : allErrors) {
      if (error.rowIndex() != null) {
        errorsByRow.computeIfAbsent(error.rowIndex(), ignored -> new ArrayList<>()).add(error);
      }
    }
    int versionNumber =
        versionRepository
            .findTopByDatasetIdOrderByVersionNumberDesc(dataset.getId())
            .map(version -> version.getVersionNumber() + 1)
            .orElse(1);
    int invalidRows = errorsByRow.size();
    log.info("Version created: dataset={}, v{}, total={}, valid={}, invalid={}, source={}",
        dataset.getPublicId(), versionNumber, rows.size(), rows.size() - invalidRows, invalidRows, source);
    DatasetVersion version =
        versionRepository.save(
            DatasetVersion.builder()
                .datasetId(dataset.getId())
                .schemaVersionId(schemaVersionId)
                .versionNumber(versionNumber)
                .source(source)
                .status(invalidRows == 0 && allErrors.isEmpty() ? DatasetVersionStatus.VALID : DatasetVersionStatus.INVALID)
                .totalRows(rows.size())
                .validRows(rows.size() - invalidRows)
                .invalidRows(invalidRows)
                .createdBy(userId)
                .build());
    AtomicInteger rowIndex = new AtomicInteger();
    rowRepository.saveAll(
        rows.stream()
            .map(
                row -> {
                  int index = rowIndex.getAndIncrement();
                  List<DatasetValidationError> rowErrors = errorsByRow.getOrDefault(index, List.of());
                  return DatasetRow.builder()
                      .datasetId(dataset.getId())
                      .datasetVersionId(version.getId())
                      .rowIndex(index)
                      .data(writeJson(row))
                      .validationStatus(rowErrors.isEmpty() ? DatasetRowValidationStatus.VALID : DatasetRowValidationStatus.INVALID)
                      .validationErrors(writeJson(rowErrors))
                      .build();
                })
            .toList());
    dataset.setSource(source);
    dataset.setLatestVersionId(version.getId());
    dataset.setTotalRows(rows.size());
    datasetRepository.save(dataset);
    return version;
  }

  private ImportPayload parseExcel(byte[] bytes, String sheetName) throws IOException {
    try (var input = new java.io.ByteArrayInputStream(bytes);
        var workbook = WorkbookFactory.create(input)) {
      var sheet = workbook.getSheetAt(0);
      if (StringUtils.hasText(sheetName)) {
        var targetSheet = workbook.getSheet(sheetName);
        if (targetSheet != null) {
          sheet = targetSheet;
        }
      }
      Row headerRow = sheet.getRow(0);
      if (headerRow == null) {
        throw ResourceException.of(ErrorCode.BAD_REQUEST, "Excel file must contain a header row.");
      }
      List<String> headers = new ArrayList<>();
      for (Cell cell : headerRow) {
        String header = cellValue(cell);
        if (StringUtils.hasText(header)) {
          headers.add(header.trim());
        }
      }
      List<Map<String, Object>> rows = new ArrayList<>();
      for (int i = 1; i <= sheet.getLastRowNum(); i++) {
        Row row = sheet.getRow(i);
        if (row == null) {
          continue;
        }
        Map<String, Object> data = new LinkedHashMap<>();
        boolean hasValue = false;
        for (int c = 0; c < headers.size(); c++) {
          String value = cellValue(row.getCell(c));
          if (StringUtils.hasText(value)) {
            hasValue = true;
          }
          data.put(headers.get(c), value);
        }
        if (hasValue) {
          rows.add(data);
        }
      }
      return new ImportPayload(headers, rows);
    }
  }

  private List<DatasetColumnMappingSuggestionResponse> suggestMappings(
      List<String> headers, List<SchemaColumn> columns) {
    return headers.stream()
        .map(
            header -> {
              Optional<SchemaColumn> match =
                  columns.stream()
                      .filter(column -> normalize(column.getColumnName()).equals(normalize(header)))
                      .findFirst();
              return match
                  .map(
                      column ->
                          new DatasetColumnMappingSuggestionResponse(
                              header, column.getPublicId(), column.getColumnName(), false))
                  .orElse(new DatasetColumnMappingSuggestionResponse(header, null, header, true));
            })
        .toList();
  }

  private List<DatasetColumnMappingRequest> mappingRequestsFromSuggestions(
      List<DatasetColumnMappingSuggestionResponse> suggestions) {
    return suggestions.stream()
        .map(
            suggestion ->
                new DatasetColumnMappingRequest(
                    suggestion.sourceColumn(),
                    DatasetColumnMappingAction.MAP_TO_SCHEMA,
                    suggestion.schemaColumnPublicId(),
                    null,
                    null,
                    null))
        .toList();
  }

  private List<Map<String, Object>> applyMappings(
      List<Map<String, Object>> rawRows,
      List<DatasetColumnMappingRequest> mappings,
      List<SchemaColumn> existingColumns) {
    List<SchemaColumn> mutableColumns = new ArrayList<>(existingColumns);
    Map<UUID, SchemaColumn> columnsByPublicId = new HashMap<>();
    for (SchemaColumn column : mutableColumns) {
      columnsByPublicId.put(column.getPublicId(), column);
    }
    List<ColumnMapping> resolved = new ArrayList<>();
    for (DatasetColumnMappingRequest mapping : mappings) {
      DatasetColumnMappingAction action =
          mapping.action() == null ? DatasetColumnMappingAction.MAP_TO_SCHEMA : mapping.action();
      if (action == DatasetColumnMappingAction.IGNORE) {
        continue;
      }
      if (action == DatasetColumnMappingAction.ADD_TO_SCHEMA) {
        if (mutableColumns.isEmpty()) {
          throw ResourceException.of(ErrorCode.MISSING_DATASET_SCHEMA);
        }
        ProjectSchema schema = schemaRepository
            .findById(mutableColumns.get(0).getSchemaVersionId())
            .orElseThrow(() -> ResourceException.of(ErrorCode.MISSING_DATASET_SCHEMA));
        schema.bumpVersion();
        schemaRepository.save(schema);
        SchemaColumn newColumn =
            columnRepository.save(
                SchemaColumn.builder()
                    .schemaVersionId(schema.getId())
                    .columnName(StringUtils.hasText(mapping.newColumnName()) ? mapping.newColumnName().trim() : mapping.sourceColumn().trim())
                    .role(StringUtils.hasText(mapping.newColumnRole()) ? mapping.newColumnRole().trim().toUpperCase(Locale.ROOT) : "EXPECTED")
                    .dataType(StringUtils.hasText(mapping.newColumnDataType()) ? mapping.newColumnDataType().trim().toUpperCase(Locale.ROOT) : "STRING")
                    .build());
        mutableColumns.add(newColumn);
        resolved.add(new ColumnMapping(mapping.sourceColumn(), newColumn.getColumnName()));
      } else {
        SchemaColumn target = columnsByPublicId.get(mapping.schemaColumnPublicId());
        if (target != null) {
          resolved.add(new ColumnMapping(mapping.sourceColumn(), target.getColumnName()));
        }
      }
    }
    return rawRows.stream()
        .map(
            row -> {
              Map<String, Object> mapped = new LinkedHashMap<>();
              for (ColumnMapping mapping : resolved) {
                mapped.put(mapping.targetColumn(), row.get(mapping.sourceColumn()));
              }
              return mapped;
            })
        .toList();
  }

  private byte[] buildWorkbookBytes(DatasetVersion version) {
    List<SchemaColumn> columns = columnsForVersion(version.getSchemaVersionId());
    List<DatasetRow> rows = rowRepository.findByDatasetVersionIdOrderByRowIndexAsc(version.getId());
    try (var workbook = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
      var sheet = workbook.createSheet("dataset");
      Row header = sheet.createRow(0);
      for (int i = 0; i < columns.size(); i++) {
        header.createCell(i).setCellValue(columns.get(i).getColumnName());
      }
      for (int r = 0; r < rows.size(); r++) {
        Row excelRow = sheet.createRow(r + 1);
        Map<String, Object> data = readRowsMap(rows.get(r).getData());
        for (int c = 0; c < columns.size(); c++) {
          Object value = data.get(columns.get(c).getColumnName());
          excelRow.createCell(c).setCellValue(value == null ? "" : String.valueOf(value));
        }
      }
      workbook.write(out);
      return out.toByteArray();
    } catch (IOException ex) {
      throw ResourceException.of(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to build Excel export.");
    }
  }

  private DatasetJob markRunning(UUID jobPublicId, String message, int progress) {
    DatasetJob job = getJobOrThrow(jobPublicId);
    return updateJob(job, DatasetJobStatus.RUNNING, progress, message);
  }

  private DatasetJob updateJob(DatasetJob job, DatasetJobStatus status, int progress, String message) {
    job.setStatus(status);
    job.setProgress(progress);
    job.setMessage(message);
    return jobRepository.save(job);
  }

  private void completeJob(DatasetJob job, DatasetVersion version, String message) {
    job.setDatasetVersionId(version.getId());
    job.setStatus(DatasetJobStatus.COMPLETED);
    job.setProgress(100);
    job.setMessage(message);
    job.setCompletedAt(OffsetDateTime.now());
    jobRepository.save(job);
  }

  private void failJob(DatasetJob job, String message) {
    log.warn("Dataset job {} failed: {}", job.getPublicId(), message);
    job.setStatus(DatasetJobStatus.FAILED);
    job.setErrorMessage(message);
    job.setMessage("Failed");
    job.setCompletedAt(OffsetDateTime.now());
    jobRepository.save(job);
  }

  private void markCancelled(DatasetJob job) {
    job.setStatus(DatasetJobStatus.CANCELLED);
    job.setMessage("Cancelled");
    job.setCompletedAt(OffsetDateTime.now());
    jobRepository.save(job);
  }

  private boolean isCancelRequested(DatasetJob job) {
    return jobRepository
        .findById(job.getId())
        .map(current -> current.getStatus() == DatasetJobStatus.CANCEL_REQUESTED)
        .orElse(false);
  }

  private boolean isTerminal(DatasetJobStatus status) {
    return status == DatasetJobStatus.COMPLETED
        || status == DatasetJobStatus.FAILED
        || status == DatasetJobStatus.CANCELLED;
  }

  private String generationSystemPrompt(List<SchemaColumn> columns) {
    return """
        You generate chatbot QA dataset rows. Return only valid JSON array.
        Each item must include exactly the schema column names below.
        Do not include markdown fences.
        Schema:
        """
        + columns.stream()
            .map(column -> "- " + column.getColumnName() + " role=" + column.getRole() + " type=" + column.getDataType())
            .reduce("", (left, right) -> left + right + "\n");
  }

  private String generationUserPrompt(GenerateDatasetRequest request) {
    return "Generate "
        + request.rowCount()
        + " rows from this business context:\n"
        + request.context()
        + "\nNotes:\n"
        + (request.notes() == null ? "" : request.notes());
  }

  private List<Map<String, Object>> parseGeneratedRows(String generatedText) throws IOException {
    String text = generatedText.trim();
    if (text.startsWith("```")) {
      text = text.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
    }
    return objectMapper.readValue(text, ROWS_TYPE);
  }

  private String cellValue(Cell cell) {
    if (cell == null || cell.getCellType() == CellType.BLANK) {
      return "";
    }
    if (cell.getCellType() == CellType.ERROR) {
      return "";
    }
    if (cell.getCellType() == CellType.NUMERIC) {
      if (DateUtil.isCellDateFormatted(cell)) {
        return cell.getLocalDateTimeCellValue().toString();
      }
      double value = cell.getNumericCellValue();
      if (value == Math.floor(value) && !Double.isInfinite(value)) {
        return String.valueOf((long) value);
      }
      return String.valueOf(value);
    }
    if (cell.getCellType() == CellType.BOOLEAN) {
      return String.valueOf(cell.getBooleanCellValue());
    }
    if (cell.getCellType() == CellType.FORMULA) {
      try {
        return cell.getStringCellValue();
      } catch (Exception ex) {
        return String.valueOf(cell.getNumericCellValue());
      }
    }
    return cell.getStringCellValue();
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository
        .findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private User getUser(String email) {
    return userRepository
        .findByEmail(email.toLowerCase(Locale.ROOT))
        .orElseThrow(() -> ResourceException.of(ErrorCode.USER_NOT_FOUND));
  }

  private ProjectSchema getSchemaOrThrow(Long projectId) {
    return schemaRepository
        .findByProjectId(projectId)
        .orElseThrow(
            () ->
                ResourceException.of(
                    ErrorCode.MISSING_DATASET_SCHEMA,
                    "Create a project schema before creating or updating datasets."));
  }

  private List<SchemaColumn> currentColumns(Long projectId) {
    ProjectSchema schema = getSchemaOrThrow(projectId);
    return columnRepository.findBySchemaVersionIdOrderByIdAsc(schema.getId());
  }

  private List<SchemaColumn> columnsForVersion(Long schemaVersionId) {
    return columnRepository.findBySchemaVersionIdOrderByIdAsc(schemaVersionId);
  }

  private Dataset getDatasetOrThrow(UUID publicId) {
    return datasetRepository
        .findByPublicId(publicId)
        .filter(dataset -> dataset.getDeletedAt() == null)
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_NOT_FOUND));
  }

  private Dataset getDatasetById(Long id) {
    return datasetRepository
        .findById(id)
        .orElseThrow(() -> ResourceException.of(ErrorCode.DATASET_NOT_FOUND));
  }

  private DatasetVersion getVersionOrThrow(UUID publicId) {
    return versionRepository
        .findByPublicId(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
  }

  private DatasetVersion getVersionById(Long id) {
    return versionRepository
        .findById(id)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
  }

  private DatasetJob getJobOrThrow(UUID publicId) {
    return jobRepository
        .findByPublicId(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.RESOURCE_NOT_FOUND));
  }

  private DatasetSummaryResponse toSummary(Dataset dataset) {
    return new DatasetSummaryResponse(
        dataset.getPublicId(),
        dataset.getName(),
        dataset.getDescription(),
        dataset.getSource(),
        dataset.getStatus(),
        versionSummary(dataset.getLatestVersionId()),
        versionSummary(dataset.getActiveVersionId()),
        dataset.getCreatedAt(),
        dataset.getUpdatedAt());
  }

  private DatasetVersionSummaryResponse versionSummary(Long id) {
    if (id == null) {
      return null;
    }
    return versionRepository.findById(id).map(this::toVersionSummary).orElse(null);
  }

  private DatasetVersionSummaryResponse toVersionSummary(DatasetVersion version) {
    ProjectSchema schema = schemaRepository.findById(version.getSchemaVersionId()).orElse(null);
    return new DatasetVersionSummaryResponse(
        version.getPublicId(),
        version.getVersionNumber(),
        schema == null ? null : schema.getPublicId(),
        version.getSource(),
        version.getStatus(),
        version.getTotalRows(),
        version.getValidRows(),
        version.getInvalidRows(),
        version.getCreatedAt());
  }

  private DatasetRowResponse toRowResponse(DatasetRow row) {
    return new DatasetRowResponse(
        row.getPublicId(),
        row.getRowIndex(),
        readRowsMap(row.getData()),
        row.getValidationStatus(),
        readErrors(row.getValidationErrors()),
        row.getCreatedAt());
  }

  private DatasetJobResponse toJobResponse(DatasetJob job) {
    UUID datasetPublicId = null;
    if (job.getDatasetId() != null) {
      datasetPublicId = datasetRepository.findById(job.getDatasetId())
          .map(Dataset::getPublicId)
          .orElse(null);
    }
    UUID versionPublicId = null;
    if (job.getDatasetVersionId() != null) {
      versionPublicId = versionRepository.findById(job.getDatasetVersionId())
          .map(DatasetVersion::getPublicId)
          .orElse(null);
    }
    return new DatasetJobResponse(
        job.getPublicId(),
        datasetPublicId,
        versionPublicId,
        job.getType(),
        job.getStatus(),
        job.getProgress(),
        job.getMessage(),
        job.getErrorMessage(),
        readSuggestions(job.getResult()),
        job.getCreatedAt(),
        job.getUpdatedAt(),
        job.getCompletedAt());
  }

  private DatasetJobEventResponse toJobEvent(DatasetJob job) {
    DatasetJobResponse response = toJobResponse(job);
    return new DatasetJobEventResponse(
        response.publicId(),
        response.type(),
        response.status(),
        response.progress(),
        response.message(),
        response.errorMessage(),
        response.datasetPublicId(),
        response.datasetVersionPublicId(),
        response.mappingSuggestions());
  }

  private byte[] readFileBytes(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Excel file is required.");
    }
    String filename = file.getOriginalFilename();
    if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Only .xlsx files are supported.");
    }
    try {
      return file.getBytes();
    } catch (IOException ex) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "Failed to read Excel file.");
    }
  }

  private String writeJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (IOException ex) {
      throw ResourceException.of(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to serialize dataset payload.");
    }
  }

  private Map<String, Object> readMap(String json) {
    try {
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (IOException ex) {
      throw ResourceException.of(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to read dataset payload.");
    }
  }

  private Map<String, Object> readRowsMap(String json) {
    try {
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (IOException ex) {
      return Map.of();
    }
  }

  private List<DatasetValidationError> readErrors(String json) {
    if (!StringUtils.hasText(json)) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, ERRORS_TYPE);
    } catch (IOException ex) {
      return List.of();
    }
  }

  private List<DatasetColumnMappingSuggestionResponse> readSuggestions(String json) {
    if (!StringUtils.hasText(json)) {
      return List.of();
    }
    try {
      return objectMapper.readValue(json, SUGGESTIONS_TYPE);
    } catch (IOException ex) {
      return List.of();
    }
  }

  private String normalize(String value) {
    return value == null
        ? ""
        : value.trim().toLowerCase(Locale.ROOT).replaceAll("[\\s\\-]+", "_");
  }

  private String safeFilename(String value) {
    return normalize(StringUtils.hasText(value) ? value : "dataset").replaceAll("[^a-z0-9_]+", "_");
  }

  private record ImportPayload(List<String> headers, List<Map<String, Object>> rows) {}

  private record ColumnMapping(String sourceColumn, String targetColumn) {}
}
