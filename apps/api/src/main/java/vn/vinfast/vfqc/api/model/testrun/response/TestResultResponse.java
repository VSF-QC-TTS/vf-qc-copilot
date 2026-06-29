package vn.vinfast.vfqc.api.model.testrun.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.testrun.TestCaseStatus;

public record TestResultResponse(
    UUID publicId,
    UUID runPublicId,
    Long datasetRowId,
    Integer caseIndex,
    String inputData,
    String actualOutput,
    TestCaseStatus status,
    Boolean passed,
    BigDecimal score,
    String errorMessage,
    Long latencyMs,
    List<AssertionResultResponse> assertions,
    List<CustomValueResponse> customValues,
    TestResultOverrideResponse override,
    OffsetDateTime createdAt) {}
