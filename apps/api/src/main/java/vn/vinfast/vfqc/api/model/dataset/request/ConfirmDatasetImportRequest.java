package vn.vinfast.vfqc.api.model.dataset.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ConfirmDatasetImportRequest(
    @Valid @NotEmpty List<DatasetColumnMappingRequest> mappings) {}
