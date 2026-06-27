package vn.vinfast.vfqc.api.model.dataset.response;

import java.util.UUID;

public record DatasetColumnMappingSuggestionResponse(
    String sourceColumn,
    UUID schemaColumnPublicId,
    String targetColumn,
    boolean newColumn) {}
