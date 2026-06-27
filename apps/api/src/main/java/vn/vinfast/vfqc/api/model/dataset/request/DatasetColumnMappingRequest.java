package vn.vinfast.vfqc.api.model.dataset.request;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import vn.vinfast.vfqc.api.model.dataset.DatasetColumnMappingAction;

public record DatasetColumnMappingRequest(
    @NotBlank String sourceColumn,
    DatasetColumnMappingAction action,
    UUID schemaColumnPublicId,
    String newColumnName,
    String newColumnRole,
    String newColumnDataType) {}
