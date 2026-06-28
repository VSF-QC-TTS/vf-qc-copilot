package vn.vinfast.vfqc.api.model.testrun.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AssertionResultResponse(
    UUID publicId,
    String assertionName,
    String assertionType,
    String responsePath,
    Boolean passed,
    BigDecimal score,
    String reason,
    String expectedValue,
    String actualValue,
    OffsetDateTime createdAt) {}
