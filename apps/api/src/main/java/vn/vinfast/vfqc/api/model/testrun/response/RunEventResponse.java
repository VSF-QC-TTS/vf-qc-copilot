package vn.vinfast.vfqc.api.model.testrun.response;

import java.time.OffsetDateTime;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.testrun.RunEventType;

public record RunEventResponse(
    UUID publicId,
    UUID runPublicId,
    RunEventType eventType,
    String payload,
    OffsetDateTime createdAt) {}
