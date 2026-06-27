package vn.vinfast.vfqc.api.model.dataset.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;

public record SaveDatasetRowsRequest(@NotEmpty List<Map<String, Object>> rows) {}
