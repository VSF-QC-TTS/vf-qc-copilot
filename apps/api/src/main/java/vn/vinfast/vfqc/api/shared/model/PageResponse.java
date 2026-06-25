package vn.vinfast.vfqc.api.shared.model;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Standard paginated response wrapper.
 *
 * @param <T> type of the content items
 *
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@Schema(name = "PageResponse", description = "Standard paginated response")
public record PageResponse<T>(
    @Schema(description = "List of items for the current page.") List<T> content,
    @Schema(description = "Current page number (0-indexed).", example = "0") int page,
    @Schema(description = "Number of items per page.", example = "20") int size,
    @Schema(description = "Total number of items across all pages.", example = "100")
        long totalElements,
    @Schema(description = "Total number of pages.", example = "5") int totalPages,
    @Schema(description = "Indicates whether this is the last page.", example = "false")
        boolean last) {

  public static <T> PageResponse<T> of(Page<T> page) {
    return new PageResponse<>(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isLast());
  }
}
