package vn.vinfast.vfqc.api.shared.crypto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.vinfast.vfqc.api.model.targetconfig.SecretRef;
import vn.vinfast.vfqc.api.repository.SecretRefRepository;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Component
@RequiredArgsConstructor
public class SecretManager {

  private final SecretEncryptor encryptor;
  private final SecretRefRepository repository;

  public record SecretScanResult(
      Map<String, String> sanitizedHeaders,
      Map<String, String> sanitizedParams,
      List<SecretRef> detectedSecrets) {}

  /**
   * Scans headers and params for secrets, encrypts them, and returns sanitized maps along with the created SecretRefs.
   */
  public SecretScanResult scanAndEncrypt(
      Map<String, String> headers,
      Map<String, String> params,
      Long projectId,
      String ownerType,
      Long ownerId) {

    List<SecretRef> secrets = new ArrayList<>();
    Map<String, String> sanitizedHeaders = new HashMap<>();
    Map<String, String> sanitizedParams = new HashMap<>();

    if (headers != null) {
      headers.forEach((key, value) -> {
        if (isSecretHeader(key)) {
          secrets.add(buildSecretRef(projectId, ownerType, ownerId, key, "HEADER", null, value));
          sanitizedHeaders.put(key, "SECRET_REDACTED");
        } else {
          sanitizedHeaders.put(key, value);
        }
      });
    }

    if (params != null) {
      params.forEach((key, value) -> {
        if (isSecretParam(key)) {
          secrets.add(buildSecretRef(projectId, ownerType, ownerId, key, "QUERY", null, value));
          sanitizedParams.put(key, "SECRET_REDACTED");
        } else {
          sanitizedParams.put(key, value);
        }
      });
    }

    return new SecretScanResult(sanitizedHeaders, sanitizedParams, secrets);
  }

  /**
   * Decrypts all secrets for a given owner, returning a map of secret name to plaintext value.
   */
  @Transactional(readOnly = true)
  public Map<String, String> decryptForOwner(String ownerType, Long ownerId) {
    return repository.findByOwnerTypeAndOwnerId(ownerType, ownerId).stream()
        .collect(Collectors.toMap(
            SecretRef::getSecretName,
            ref -> encryptor.decrypt(ref.getEncryptedValue())));
  }

  /**
   * Deletes existing secrets and replaces them with the new refs.
   */
  @Transactional
  public void replaceSecrets(String ownerType, Long ownerId, List<SecretRef> newRefs) {
    repository.deleteByOwnerTypeAndOwnerId(ownerType, ownerId);
    if (newRefs != null && !newRefs.isEmpty()) {
      repository.saveAll(newRefs);
    }
  }

  /**
   * Encrypts a single plaintext secret and returns a SecretRef entity ready to save.
   */
  public SecretRef encryptSingleSecret(
      Long projectId, String ownerType, Long ownerId, String secretName, String plaintext) {
    return buildSecretRef(projectId, ownerType, ownerId, secretName, "API_KEY", null, plaintext);
  }

  private SecretRef buildSecretRef(
      Long projectId,
      String ownerType,
      Long ownerId,
      String secretName,
      String location,
      String path,
      String plaintext) {
    return SecretRef.builder()
        .projectId(projectId)
        .ownerType(ownerType)
        .ownerId(ownerId)
        .secretName(secretName)
        .secretLocation(location)
        .secretPath(path)
        .encryptedValue(encryptor.encrypt(plaintext))
        .maskedValue(encryptor.mask(plaintext))
        .build();
  }

  private boolean isSecretHeader(String key) {
    if (key == null) return false;
    String lower = key.toLowerCase();
    return lower.contains("authorization") || lower.contains("api-key") || lower.contains("apikey") || lower.contains("secret");
  }

  private boolean isSecretParam(String key) {
    if (key == null) return false;
    String lower = key.toLowerCase();
    return lower.contains("api-key") || lower.contains("apikey") || lower.contains("secret") || lower.contains("token");
  }
}
