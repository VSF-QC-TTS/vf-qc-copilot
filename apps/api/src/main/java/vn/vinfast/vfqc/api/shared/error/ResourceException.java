package vn.vinfast.vfqc.api.shared.error;

import lombok.Getter;

/**
 * Base runtime exception for expected business/API errors.
 *
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Getter
public class ResourceException extends RuntimeException {

  private final ErrorCode errorCode;
  private final String detail;

  public ResourceException(ErrorCode errorCode) {
    super(errorCode.getDefaultDetail());
    this.errorCode = errorCode;
    this.detail = errorCode.getDefaultDetail();
  }

  public ResourceException(ErrorCode errorCode, String detail) {
    super(detail);
    this.errorCode = errorCode;
    this.detail = detail;
  }

  public ResourceException(ErrorCode errorCode, String detail, Throwable cause) {
    super(detail, cause);
    this.errorCode = errorCode;
    this.detail = detail;
  }

  public static ResourceException of(ErrorCode errorCode) {
    return new ResourceException(errorCode);
  }

  public static ResourceException of(ErrorCode errorCode, String detail) {
    return new ResourceException(errorCode, detail);
  }
}
