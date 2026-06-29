package vn.vinfast.vfqc.api.model.testrun.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddCustomColumnRequest(
    @NotBlank
    @Size(max = 255)
    String columnName,
    
    @NotBlank
    @Size(max = 50)
    String dataType) {}
