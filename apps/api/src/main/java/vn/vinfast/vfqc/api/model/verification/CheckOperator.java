package vn.vinfast.vfqc.api.model.verification;

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * Verification check operators with built-in validation logic (Strategy Pattern).
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/27/2026
 */
@Getter
@RequiredArgsConstructor
public enum CheckOperator {
  EQUALS("Equals", "Exact string or number match") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  CONTAINS("Contains", "Checks if the response contains the expected substring") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  ICONTAINS("Contains (case-insensitive)", "Case-insensitive substring match") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  NOT_CONTAINS("Not Contains", "Checks that the response does NOT contain the expected substring") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  CONTAINS_ALL(
      "Contains All",
      "Checks that the response contains ALL of the expected values (comma-separated)") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  CONTAINS_ANY(
      "Contains Any",
      "Checks that the response contains at least one of the expected values (comma-separated)") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  STARTS_WITH("Starts With", "Checks if the response starts with the expected string") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValueOrColumn(rule);
    }
  },
  REGEX("Regex", "Regular expression match") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValue(rule);
      try {
        Pattern.compile(rule.getExpectedValue());
      } catch (PatternSyntaxException e) {
        throw ResourceException.of(
            ErrorCode.BAD_REQUEST, "Invalid regex pattern: " + e.getMessage());
      }
    }
  },
  NOT_EMPTY("Not Empty", "Checks if the field is present and not empty") {
    @Override
    public void validate(FieldCheckRule rule) {
      // No expected value needed
    }
  },
  IS_JSON("Is JSON", "Validates that the field value is valid JSON") {
    @Override
    public void validate(FieldCheckRule rule) {
      // No expected value needed
    }
  },
  JAVASCRIPT(
      "JavaScript", "Custom JavaScript expression to evaluate the field (must return true/false)") {
    @Override
    public void validate(FieldCheckRule rule) {
      requireExpectedValue(rule);
    }
  },
  LLM_JUDGE("LLM Judge", "Uses configured AI provider to evaluate the field against a rubric") {
    @Override
    public void validate(FieldCheckRule rule) {
      // Expected value is the prompt/rubric
      requireExpectedValue(rule);
    }
  };

  private final String displayName;
  private final String description;

  public abstract void validate(FieldCheckRule rule);

  protected static void requireExpectedValueOrColumn(FieldCheckRule rule) {
    if (rule.getExpectedSource() == ExpectedSource.LITERAL
        && !StringUtils.hasText(rule.getExpectedValue())) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "expectedValue is required for LITERAL source");
    }
    if (rule.getExpectedSource() == ExpectedSource.DATASET_COLUMN
        && rule.getExpectedColumnKey() == null) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "expectedColumnKey is required for DATASET_COLUMN source");
    }
  }

  protected static void requireExpectedValue(FieldCheckRule rule) {
    if (!StringUtils.hasText(rule.getExpectedValue())) {
      throw ResourceException.of(
          ErrorCode.BAD_REQUEST, "expectedValue is required for this operator");
    }
  }
}
