package vn.vinfast.vfqc.api.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.model.dataset.DatasetValidationError;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;

@Service
public class DatasetValidationServiceImpl {

  public List<DatasetValidationError> validateSchemaReadiness(List<SchemaColumn> columns) {
    List<DatasetValidationError> errors = new ArrayList<>();
    boolean hasInput = columns.stream().anyMatch(column -> role(column).equals("INPUT"));
    boolean hasExpected =
        columns.stream()
            .anyMatch(column -> role(column).equals("EXPECTED") || role(column).equals("GROUND_TRUTH"));

    if (!hasInput) {
      errors.add(error(null, null, "MISSING_INPUT_COLUMN", "Schema requires at least one INPUT column."));
    }
    if (!hasExpected) {
      errors.add(
          error(
              null,
              null,
              "MISSING_EXPECTED_COLUMN",
              "Schema requires at least one EXPECTED or GROUND_TRUTH column."));
    }
    return errors;
  }

  public List<DatasetValidationError> validateRows(
      List<SchemaColumn> columns, List<Map<String, Object>> rows) {
    List<DatasetValidationError> errors = new ArrayList<>(validateSchemaReadiness(columns));
    for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
      Map<String, Object> row = rows.get(rowIndex);
      for (SchemaColumn column : columns) {
        Object value = row.get(column.getColumnName());
        String role = role(column);
        if ((role.equals("INPUT") || role.equals("EXPECTED") || role.equals("GROUND_TRUTH"))
            && isEmpty(value)) {
          errors.add(
              error(rowIndex, column.getColumnName(), "EMPTY_REQUIRED_VALUE", "Required value is empty."));
          continue;
        }
        if (!isEmpty(value)) {
          validateType(rowIndex, column, value, errors);
        }
      }
    }
    return errors;
  }

  private void validateType(
      int rowIndex, SchemaColumn column, Object value, List<DatasetValidationError> errors) {
    String dataType =
        column.getDataType() == null ? "STRING" : column.getDataType().trim().toUpperCase(Locale.ROOT);
    switch (dataType) {
      case "NUMBER" -> {
        try {
          new BigDecimal(String.valueOf(value).trim());
        } catch (NumberFormatException ex) {
          errors.add(error(rowIndex, column.getColumnName(), "INVALID_NUMBER", "Value must be a number."));
        }
      }
      case "BOOLEAN" -> {
        String normalized = String.valueOf(value).trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("true") && !normalized.equals("false")) {
          errors.add(error(rowIndex, column.getColumnName(), "INVALID_BOOLEAN", "Value must be true or false."));
        }
      }
      case "JSON" -> {
        String text = String.valueOf(value).trim();
        if (!(text.startsWith("{") && text.endsWith("}")) && !(text.startsWith("[") && text.endsWith("]"))) {
          errors.add(error(rowIndex, column.getColumnName(), "INVALID_JSON", "Value must be JSON."));
        }
      }
      default -> {
        // STRING and unknown future types are accepted as text for MVP.
      }
    }
  }

  private static DatasetValidationError error(
      Integer rowIndex, String columnName, String code, String message) {
    return new DatasetValidationError(rowIndex, columnName, code, message);
  }

  private static String role(SchemaColumn column) {
    return column.getRole() == null ? "" : column.getRole().trim().toUpperCase(Locale.ROOT);
  }

  private static boolean isEmpty(Object value) {
    return value == null || !StringUtils.hasText(String.valueOf(value));
  }
}
