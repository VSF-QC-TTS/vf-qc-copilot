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
import vn.vinfast.vfqc.api.model.targetconfig.response.ConnectResponse;
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
  @Transactional
  public ConnectResponse connect(UUID projectPublicId, ExecuteCurlRequest req) {
    log.info("Connecting target config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);
    ParsedCurlCommand parsed = curlParser.parse(req.curl());

    // 1. Scan & encrypt secrets
    SecretScanResult secrets = secretManager.scanAndEncrypt(
        parsed.headers(), parsed.queryParams(), project.getId(), "TARGET_CONFIG", project.getId());

    // 2. Build/update TargetConfig entity
    TargetConfig entity = targetConfigRepository.findByProjectId(project.getId())
        .orElseGet(() -> TargetConfig.builder()
            .projectId(project.getId())
            .build());

    entity.setMethod(parsed.method());
    entity.setUrl(parsed.url());
    entity.setBodyTemplate(parsed.body());
    entity.setTimeoutMs(30000);

    // Redact secrets in cURL before saving
    String redactedCurl = req.curl();
    if (parsed.headers() != null) {
      for (Map.Entry<String, String> entry : parsed.headers().entrySet()) {
        String sanitized = secrets.sanitizedHeaders().get(entry.getKey());
        if ("SECRET_REDACTED".equals(sanitized) && entry.getValue() != null && !entry.getValue().isEmpty()) {
          redactedCurl = redactedCurl.replace(entry.getValue(), "SECRET_REDACTED");
        }
      }
    }
    if (parsed.queryParams() != null) {
      for (Map.Entry<String, String> entry : parsed.queryParams().entrySet()) {
        String sanitized = secrets.sanitizedParams().get(entry.getKey());
        if ("SECRET_REDACTED".equals(sanitized) && entry.getValue() != null && !entry.getValue().isEmpty()) {
          redactedCurl = redactedCurl.replace(entry.getValue(), "SECRET_REDACTED");
        }
      }
    }
    entity.setRawCurl(redactedCurl);

    try {
      entity.setHeaders(objectMapper.writeValueAsString(secrets.sanitizedHeaders()));
      entity.setQueryParams(objectMapper.writeValueAsString(secrets.sanitizedParams()));
    } catch (JsonProcessingException e) {
      log.error("Failed to serialize headers/params", e);
    }

    // 3. Persist secrets
    secretManager.replaceSecrets("TARGET_CONFIG", project.getId(), secrets.detectedSecrets());

    // Update version
    if (entity.getId() != null) {
      entity.setVersion(entity.getVersion() + 1);
    }

    // 4. Execute the HTTP request (using original parsed headers, NOT the sanitized ones)
    TestExecutionResult executionResult = targetHttpExecutor.execute(parsed, 30000);

    // 5. Update test status & response snapshot
    entity.setLastTestedAt(OffsetDateTime.now());
    entity.setLastTestStatus(executionResult.httpStatus() >= 200 && executionResult.httpStatus() < 300 ? "SUCCESS" : "FAILED");

    try {
      if (executionResult.responseFieldTree() != null) {
        entity.setResponseFieldSnapshot(objectMapper.writeValueAsString(executionResult.responseFieldTree()));
      }
    } catch (JsonProcessingException e) {
      log.error("Failed to serialize response field tree", e);
    }

    TargetConfig saved = targetConfigRepository.save(entity);

    // 6. Build response
    List<SecretDetection> detections = new ArrayList<>();
    for (SecretRef ref : secrets.detectedSecrets()) {
      detections.add(new SecretDetection(ref.getSecretLocation(), ref.getSecretName(), "REDACTED"));
    }

    TargetConfigResponse configResponse = mapToResponse(saved, secrets.sanitizedHeaders(), secrets.sanitizedParams());
    return new ConnectResponse(configResponse, detections, executionResult);
  }

  @Override
  @Transactional
  public TargetConfigResponse save(UUID projectPublicId, SaveTargetConfigRequest req) {
    log.info("Saving target config for project: {}", projectPublicId);
    Project project = getProjectOrThrow(projectPublicId);

    TargetConfig entity = targetConfigRepository.findByProjectId(project.getId())
        .orElseThrow(() -> ResourceException.of(ErrorCode.TARGET_CONFIG_NOT_FOUND));

    // Only update lightweight fields
    entity.setResponsePath(req.responsePath());
    if (req.name() != null) {
      entity.setName(req.name());
    }
    if (req.timeoutMs() > 0) {
      entity.setTimeoutMs(req.timeoutMs());
    }

    // Update version
    entity.setVersion(entity.getVersion() + 1);

    TargetConfig saved = targetConfigRepository.save(entity);
    return mapToResponse(saved, parseJson(entity.getHeaders()), parseJson(entity.getQueryParams()));
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

    return result;
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
        res.rawCurl(),
        res.lastTestStatus(),
        res.lastTestedAt(),
        res.createdAt(),
        res.updatedAt()
    );
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
      for (int i = 0; i < node.size(); i++) {
        flattenJsonPaths(node.get(i), prefix + "[" + i + "]", paths);
      }
    } else {
      paths.add(prefix);
    }
  }
}
