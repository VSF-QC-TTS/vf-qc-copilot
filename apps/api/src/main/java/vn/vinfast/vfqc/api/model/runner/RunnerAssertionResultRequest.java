package vn.vinfast.vfqc.api.model.runner;

import java.math.BigDecimal;

public record RunnerAssertionResultRequest(
    String assertionName,
    String assertionType,
    String responsePath,
    Boolean passed,
    BigDecimal score,
    String reason,
    String expectedValue,
    String actualValue) {}
