package vn.vinfast.vfqc.api.model.testrun.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record OverrideResultRequest(
    @NotBlank
    String overriddenStatus,
    
    @NotNull
    BigDecimal overriddenScore,
    
    String correctedReason) {}
