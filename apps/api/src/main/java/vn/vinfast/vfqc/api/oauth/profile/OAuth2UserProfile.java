package vn.vinfast.vfqc.api.oauth.profile;

import vn.vinfast.vfqc.api.oauth.AuthProvider;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
public record OAuth2UserProfile(
    AuthProvider provider, String email, String firstName, String lastName, String avatarUrl) {}
