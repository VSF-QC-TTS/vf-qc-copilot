package vn.vinfast.vfqc.api.model.testrun.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SaveCustomValueRequest(
    @NotNull
    UUID customColumnPublicId,
    
    String value) {}
