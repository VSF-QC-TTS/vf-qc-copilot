package vn.vinfast.vfqc.api.model.dataset.request;

import jakarta.validation.constraints.Size;

public record UpdateDatasetRequest(
    @Size(max = 255) String name,
    @Size(max = 2000) String description) {}
