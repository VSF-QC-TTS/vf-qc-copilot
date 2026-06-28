package vn.vinfast.vfqc.api.model.runner;

import java.util.UUID;

public record RunnerCaseStartedRequest(UUID datasetRowPublicId, Integer caseIndex) {}
