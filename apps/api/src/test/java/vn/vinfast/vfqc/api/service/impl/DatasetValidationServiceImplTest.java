package vn.vinfast.vfqc.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import vn.vinfast.vfqc.api.model.dataset.DatasetValidationError;
import vn.vinfast.vfqc.api.model.schema.SchemaColumn;

class DatasetValidationServiceImplTest {

  private final DatasetValidationServiceImpl service = new DatasetValidationServiceImpl();

  @Test
  void validateSchemaReadiness_RequiresInputAndExpectedRoles() {
    List<DatasetValidationError> errors =
        service.validateSchemaReadiness(
            List.of(column("question", "STRING", "INPUT"), column("metadata", "STRING", "CONTEXT")));

    assertThat(errors)
        .extracting(DatasetValidationError::code)
        .contains("MISSING_EXPECTED_COLUMN");
  }

  @Test
  void validateRows_ChecksRequiredValuesAndTypes() {
    List<SchemaColumn> columns =
        List.of(
            column("question", "STRING", "INPUT"),
            column("ground_truth", "STRING", "GROUND_TRUTH"),
            column("score", "NUMBER", "EXPECTED"));

    List<DatasetValidationError> errors =
        service.validateRows(
            columns,
            List.of(
                Map.of("question", "Xe VF 8 co may phien ban?", "ground_truth", "", "score", "abc")));

    assertThat(errors)
        .extracting(DatasetValidationError::code)
        .contains("EMPTY_REQUIRED_VALUE", "INVALID_NUMBER");
  }

  private static SchemaColumn column(String name, String dataType, String role) {
    return SchemaColumn.builder().columnName(name).dataType(dataType).role(role).build();
  }
}
