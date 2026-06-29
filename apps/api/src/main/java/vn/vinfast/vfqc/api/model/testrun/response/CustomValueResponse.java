package vn.vinfast.vfqc.api.model.testrun.response;

import java.util.UUID;

public record CustomValueResponse(
    UUID customColumnPublicId,
    String value) {}
