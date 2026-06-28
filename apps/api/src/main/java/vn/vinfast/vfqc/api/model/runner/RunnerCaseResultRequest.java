package vn.vinfast.vfqc.api.model.runner;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.testrun.TestCaseStatus;

public record RunnerCaseResultRequest(
    UUID datasetRowPublicId,
    Integer caseIndex,
    String inputData,
    String actualOutput,
    TestCaseStatus status,
    Boolean passed,
    BigDecimal score,
    String errorMessage,
    Long latencyMs,
    String rawTargetResponse,
    List<RunnerAssertionResultRequest> assertions) {}
