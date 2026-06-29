package vn.vinfast.vfqc.api.model.testrun.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TestResultOverrideResponse(
    UUID publicId,
    String overriddenStatus,
    BigDecimal overriddenScore,
    String correctedReason,
    String correctedByUserEmail,
    OffsetDateTime createdAt) {}
