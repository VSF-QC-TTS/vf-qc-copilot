package vn.vinfast.vfqc.api.model.testrun.response;

import java.util.UUID;

public record CustomColumnResponse(
    UUID publicId,
    String columnName,
    String dataType) {}
