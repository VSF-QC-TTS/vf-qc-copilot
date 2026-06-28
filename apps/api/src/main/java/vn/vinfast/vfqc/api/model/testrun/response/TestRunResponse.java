package vn.vinfast.vfqc.api.model.testrun.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.testrun.TestRunStatus;

public record TestRunResponse(
    UUID publicId,
    String name,
    TestRunStatus status,
    Long projectId,
    Long targetConfigId,
    Integer targetConfigVersion,
    Long aiConfigId,
    Integer aiConfigVersion,
    Long projectSchemaId,
    Integer projectSchemaVersion,
    Long datasetId,
    Long datasetVersionId,
    Integer datasetVersionNumber,
    Long verificationConfigId,
    Integer verificationConfigVersion,
    Integer totalCases,
    Integer passedCases,
    Integer failedCases,
    Integer errorCases,
    BigDecimal score,
    OffsetDateTime queuedAt,
    OffsetDateTime startedAt,
    OffsetDateTime finishedAt,
    Long durationMs,
    Boolean cancellationRequested,
    String errorMessage,
    OffsetDateTime createdAt) {}
