package vn.vinfast.vfqc.api.mapper;

import org.mapstruct.Mapper;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.model.user.response.UserResponse;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/9/2026
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

  /**
   * Maps an internal {@link User} entity to a public API response.
   *
   * @param user internal {@link User} entity
   * @return public {@link UserResponse}
   */
  UserResponse toResponse(User user);
}
