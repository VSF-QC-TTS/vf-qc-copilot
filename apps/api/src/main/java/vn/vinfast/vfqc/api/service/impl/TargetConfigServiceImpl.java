package vn.vinfast.vfqc.api.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.mapper.TargetConfigMapper;
import vn.vinfast.vfqc.api.model.project.Project;
import vn.vinfast.vfqc.api.model.targetconfig.SecretRef;
import vn.vinfast.vfqc.api.model.targetconfig.TargetConfig;
import vn.vinfast.vfqc.api.model.targetconfig.request.ExecuteCurlRequest;
import vn.vinfast.vfqc.api.model.targetconfig.request.ParsedCurlCommand;
import vn.vinfast.vfqc.api.model.targetconfig.request.SaveTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.request.TestTargetConfigRequest;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.SecretDetection;
import vn.vinfast.vfqc.api.model.targetconfig.response.ExecuteCurlResponse.TestExecutionResult;
import vn.vinfast.vfqc.api.model.targetconfig.response.TargetConfigResponse;
import vn.vinfast.vfqc.api.repository.ProjectRepository;
import vn.vinfast.vfqc.api.repository.TargetConfigRepository;
import vn.vinfast.vfqc.api.service.TargetConfigService;
import vn.vinfast.vfqc.api.service.TargetHttpExecutor;
import vn.vinfast.vfqc.api.service.CurlParser;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager;
import vn.vinfast.vfqc.api.shared.crypto.SecretManager.SecretScanResult;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TargetConfigServiceImpl implements TargetConfigService {

  private final ProjectRepository projectRepository;
  private final TargetConfigRepository targetConfigRepository;
  private final TargetConfigMapper targetConfigMapper;
  private final CurlParser curlParser;
  private final TargetHttpExecutor targetHttpExecutor;
  private final SecretManager secretManager;
  private final ObjectMapper objectMapper;

  @Override
  @Transactional(readOnly = true)
  public ExecuteCurlResponse executeCurl(UUID projectPublicId, ExecuteCurlRequest req) {
    log.info("Executing curl command for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    ParsedCurlCommand parsed = curlParser.parse(req.curl());

    // Scan for secrets but don't save them to DB yet, just detect them for the response
    SecretScanResult secrets = secretManager.scanAndEncrypt(
        parsed.headers(), parsed.queryParams(), project.getId(), "TARGET_CONFIG_TEMP", project.getId());

    TestExecutionResult executionResult = targetHttpExecutor.execute(parsed, 30000);

    List<SecretDetection> detections = new ArrayList<>();
    for (SecretRef ref : secrets.detectedSecrets()) {
      detections.add(new SecretDetection(ref.getSecretLocation(), ref.getSecretName(), "REDACTED"));
    }

    SaveTargetConfigRequest configRequest = new SaveTargetConfigRequest(
        parsed.method(),
        parsed.url(),
        secrets.sanitizedHeaders(),
        secrets.sanitizedParams(),
        parsed.body(),
        null,
        30000,
        null
    );

    return new ExecuteCurlResponse(configRequest, detections, executionResult);
  }

  @Override
  @Transactional
  public TargetConfigResponse save(UUID projectPublicId, SaveTargetConfigRequest req) {
    log.info("Saving target config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    
    // First, scan and encrypt secrets
    SecretScanResult secretScan = secretManager.scanAndEncrypt(
        req.headers(), req.queryParams(), project.getId(), "TARGET_CONFIG", project.getId());

    TargetConfig entity = targetConfigRepository.findByProjectId(project.getId())
        .orElseGet(() -> TargetConfig.builder()
            .projectId(project.getId())
            .build());

    // Copy fields
    entity.setMethod(req.method());
    entity.setUrl(req.url());
    entity.setName(req.name());
    entity.setBodyTemplate(req.bodyTemplate());
    entity.setResponsePath(req.responsePath());
    entity.setTimeoutMs(req.timeoutMs());
    
    try {
      entity.setHeaders(objectMapper.writeValueAsString(secretScan.sanitizedHeaders()));
      entity.setQueryParams(objectMapper.writeValueAsString(secretScan.sanitizedParams()));
    } catch (JsonProcessingException e) {
      log.error("Failed to serialize headers/params", e);
    }

    // Replace old secrets with new ones
    secretManager.replaceSecrets("TARGET_CONFIG", project.getId(), secretScan.detectedSecrets());

    // Update version
    if (entity.getId() != null) {
      entity.setVersion(entity.getVersion() + 1);
    }

    TargetConfig saved = targetConfigRepository.save(entity);
    return mapToResponse(saved, secretScan.sanitizedHeaders(), secretScan.sanitizedParams());
  }

  @Override
  @Transactional(readOnly = true)
  public TargetConfigResponse get(UUID projectPublicId) {
    log.debug("Fetching target config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    TargetConfig entity = targetConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.TARGET_CONFIG_NOT_FOUND));

    return mapToResponse(entity, parseJson(entity.getHeaders()), parseJson(entity.getQueryParams()));
  }

  @Override
  @Transactional
  public TestExecutionResult test(UUID projectPublicId, TestTargetConfigRequest req) {
    log.info("Testing target config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    TargetConfig entity = targetConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.TARGET_CONFIG_NOT_FOUND));

    // Decrypt secrets
    Map<String, String> decryptedSecrets = secretManager.decryptForOwner("TARGET_CONFIG", project.getId());

    // Execute
    TestExecutionResult result = targetHttpExecutor.execute(entity, decryptedSecrets, req.sampleInput());

    // Update test status
    entity.setLastTestedAt(OffsetDateTime.now());
    entity.setLastTestStatus(result.httpStatus() >= 200 && result.httpStatus() < 300 ? "SUCCESS" : "FAILED");
    
    try {
      if (result.responseFieldTree() != null) {
        entity.setResponseFieldSnapshot(objectMapper.writeValueAsString(result.responseFieldTree()));
      }
    } catch (JsonProcessingException e) {
      log.error("Failed to serialize response field tree", e);
    }

    targetConfigRepository.save(entity);

    if (result.httpStatus() < 200 || result.httpStatus() >= 300) {
      throw ResourceException.of(ErrorCode.TARGET_TEST_FAILED, result.errorMessage() != null ? result.errorMessage() : "HTTP " + result.httpStatus());
    }

    return result;
  }

  private Project getProjectOrThrow(UUID publicId) {
    return projectRepository.findByPublicIdAndDeletedAtIsNull(publicId)
        .orElseThrow(() -> ResourceException.of(ErrorCode.PROJECT_NOT_FOUND));
  }

  private Map<String, String> parseJson(String json) {
    if (json == null || json.isBlank()) return new HashMap<>();
    try {
      return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (Exception e) {
      return new HashMap<>();
    }
  }

  private TargetConfigResponse mapToResponse(TargetConfig entity, Map<String, String> headers, Map<String, String> queryParams) {
    TargetConfigResponse res = targetConfigMapper.toResponse(entity);
    return new TargetConfigResponse(
        res.publicId(),
        res.version(),
        res.name(),
        res.method(),
        res.url(),
        headers,
        queryParams,
        res.bodyTemplate(),
        res.responsePath(),
        res.timeoutMs(),
        res.requestFieldSnapshot(),
        res.responseFieldSnapshot(),
        res.lastTestStatus(),
        res.lastTestedAt(),
        res.createdAt(),
        res.updatedAt()
    );
  }
  @Override
  @Transactional(readOnly = true)
  public List<String> getResponseFields(UUID projectPublicId) {
    log.debug("Extracting response fields for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    TargetConfig entity = targetConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.TARGET_CONFIG_NOT_FOUND));

    if (entity.getResponseFieldSnapshot() == null || entity.getResponseFieldSnapshot().isBlank()) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "No response snapshot available. Please test the target config first.");
    }

    try {
      JsonNode tree = objectMapper.readTree(entity.getResponseFieldSnapshot());
      List<String> paths = new ArrayList<>();
      flattenJsonPaths(tree, "$", paths);
      return paths;
    } catch (JsonProcessingException e) {
      log.error("Failed to parse response field snapshot", e);
      return new ArrayList<>();
    }
  }

  private void flattenJsonPaths(JsonNode node, String prefix, List<String> paths) {
    if (node.isObject()) {
      node.fields().forEachRemaining(entry -> {
        String path = prefix + "." + entry.getKey();
        if (entry.getValue().isValueNode()) {
          paths.add(path);
        } else {
          flattenJsonPaths(entry.getValue(), path, paths);
        }
      });
    } else if (node.isArray() && !node.isEmpty()) {
      // For arrays, extract paths from the first element as sample
      flattenJsonPaths(node.get(0), prefix + "[0]", paths);
    } else {
      paths.add(prefix);
    }
  }
}
