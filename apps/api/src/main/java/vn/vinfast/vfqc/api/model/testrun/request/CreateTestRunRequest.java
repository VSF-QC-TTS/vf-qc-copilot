package vn.vinfast.vfqc.api.model.testrun.request;

import java.util.UUID;

public record CreateTestRunRequest(String name, UUID datasetPublicId) {}
