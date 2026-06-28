package vn.vinfast.vfqc.api.model.verification;

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
      OperatorCategory.TEXT),
  NOT_EQUALS(
      "Not Equals",
      "Checks that the actual value differs from the expected value",
      OperatorCategory.TEXT),
  CONTAINS(
      "Contains",
      "Checks that the actual text contains the expected text",
      OperatorCategory.TEXT),
  NOT_CONTAINS(
      "Not Contains",
      "Checks that the actual text does not contain the expected text",
      OperatorCategory.TEXT),
  REGEX(
      "Regex",
      "Checks that the actual text matches a regular expression",
      OperatorCategory.TEXT),
  GREATER_THAN(
      "Greater Than",
      "Checks that the actual numeric value is greater than expected",
      OperatorCategory.NUMBER),
  GREATER_THAN_OR_EQUALS(
      "Greater Than Or Equals",
      "Checks that the actual numeric value is greater than or equal to expected",
      OperatorCategory.NUMBER),
  LESS_THAN(
      "Less Than",
      "Checks that the actual numeric value is less than expected",
      OperatorCategory.NUMBER),
  LESS_THAN_OR_EQUALS(
      "Less Than Or Equals",
      "Checks that the actual numeric value is less than or equal to expected",
      OperatorCategory.NUMBER);

  private final String displayName;
  private final String description;
  private final OperatorCategory category;
}
