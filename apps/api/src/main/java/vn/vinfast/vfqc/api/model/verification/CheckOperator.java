package vn.vinfast.vfqc.api.model.verification;

import java.util.Set;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Deterministic field assertion operators.
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Getter
@RequiredArgsConstructor
public enum CheckOperator {
  EQUALS(
      "Equals",
      "Exact string, boolean, number, or JSON value match",
      OperatorCategory.TEXT,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  NOT_EQUALS(
      "Not Equals",
      "Checks that the actual value differs from the expected value",
      OperatorCategory.TEXT,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  CONTAINS(
      "Contains",
      "Checks that the actual text contains the expected text",
      OperatorCategory.TEXT,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  NOT_CONTAINS(
      "Not Contains",
      "Checks that the actual text does not contain the expected text",
      OperatorCategory.TEXT,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  REGEX(
      "Regex",
      "Checks that the actual text matches a regular expression",
      OperatorCategory.TEXT,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  GREATER_THAN(
      "Greater Than",
      "Checks that the actual numeric value is greater than expected",
      OperatorCategory.NUMBER,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  GREATER_THAN_OR_EQUALS(
      "Greater Than Or Equals",
      "Checks that the actual numeric value is greater than or equal to expected",
      OperatorCategory.NUMBER,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  LESS_THAN(
      "Less Than",
      "Checks that the actual numeric value is less than expected",
      OperatorCategory.NUMBER,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  LESS_THAN_OR_EQUALS(
      "Less Than Or Equals",
      "Checks that the actual numeric value is less than or equal to expected",
      OperatorCategory.NUMBER,
      true,
      Set.of(ExpectedSource.DATASET_COLUMN)),
  NOT_EMPTY(
      "Not Empty",
      "Checks that the actual value is present and not empty",
      OperatorCategory.PRESENCE,
      false,
      Set.of()),
  IS_JSON(
      "Is JSON",
      "Checks that the actual value is valid JSON",
      OperatorCategory.STRUCTURE,
      false,
      Set.of());

  private final String displayName;
  private final String description;
  private final OperatorCategory category;
  private final boolean requiresExpected;
  private final Set<ExpectedSource> supportedExpectedSources;
}
