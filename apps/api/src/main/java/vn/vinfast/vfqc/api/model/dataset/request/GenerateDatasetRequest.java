package vn.vinfast.vfqc.api.model.dataset.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateDatasetRequest(
    @NotBlank @Size(max = 20000) String context,
    @Min(1) @Max(500) int rowCount,
    @Size(max = 2000) String notes) {}
