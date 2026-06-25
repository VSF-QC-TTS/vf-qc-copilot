package vn.vinfast.vfqc.api.model.verificationconfig;

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import org.springframework.util.StringUtils;
import vn.vinfast.vfqc.api.model.verificationconfig.request.FieldCheckRequest;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/26/2026
 */
@Getter
@RequiredArgsConstructor
public enum CheckOperator {
  EQUALS("Equals", "Exact string or number match") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  CONTAINS("Contains", "Checks if the response contains the expected substring") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  ICONTAINS("Contains (case-insensitive)", "Case-insensitive substring match") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  NOT_CONTAINS("Not Contains", "Checks that the response does NOT contain the expected substring") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  CONTAINS_ALL("Contains All", "Checks that the response contains ALL of the expected values (comma-separated)") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  CONTAINS_ANY("Contains Any", "Checks that the response contains at least one of the expected values (comma-separated)") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  STARTS_WITH("Starts With", "Checks if the response starts with the expected string") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValueOrColumn(check);
    }
  },
  REGEX("Regex", "Regular expression match") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValue(check);
      try {
        Pattern.compile(check.expectedValue());
      } catch (PatternSyntaxException e) {
        throw ResourceException.of(ErrorCode.BAD_REQUEST, "Invalid regex pattern: " + e.getMessage());
      }
    }
  },
  NOT_EMPTY("Not Empty", "Checks if the field is present and not empty") {
    @Override
    public void validate(FieldCheckRequest check) {
      // No expected value needed
    }
  },
  IS_JSON("Is JSON", "Validates that the field value is valid JSON") {
    @Override
    public void validate(FieldCheckRequest check) {
      // No expected value needed
    }
  },
  JAVASCRIPT("JavaScript", "Custom JavaScript expression to evaluate the field (must return true/false)") {
    @Override
    public void validate(FieldCheckRequest check) {
      requireExpectedValue(check);
    }
  },
  LLM_JUDGE("LLM Judge", "Uses configured LLM judge to evaluate the field against a rubric") {
    @Override
    public void validate(FieldCheckRequest check) {
      // Expected value is the prompt/rubric
      requireExpectedValue(check);
    }
  };

  private final String displayName;
  private final String description;

  public abstract void validate(FieldCheckRequest check);

  protected static void requireExpectedValueOrColumn(FieldCheckRequest check) {
    if (check.expectedSource() == ExpectedSource.LITERAL && !StringUtils.hasText(check.expectedValue())) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "expectedValue is required for LITERAL source");
    }
    if (check.expectedSource() == ExpectedSource.DATASET_COLUMN && !StringUtils.hasText(check.expectedColumn())) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "expectedColumn is required for DATASET_COLUMN source");
    }
  }

  protected static void requireExpectedValue(FieldCheckRequest check) {
    if (!StringUtils.hasText(check.expectedValue())) {
      throw ResourceException.of(ErrorCode.BAD_REQUEST, "expectedValue is required for this operator");
    }
  }
}
