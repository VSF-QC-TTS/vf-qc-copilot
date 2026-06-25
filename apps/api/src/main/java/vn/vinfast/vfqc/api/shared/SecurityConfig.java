package vn.vinfast.vfqc.api.shared;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.vinfast.vfqc.api.oauth.filter.OAuth2RedirectToFilter;
import vn.vinfast.vfqc.api.oauth.handler.OAuth2LoginSuccessHandler;
import vn.vinfast.vfqc.api.oauth.userinfo.ProviderAwareOAuth2UserService;
import vn.vinfast.vfqc.api.shared.web.TraceIdFilter;

/**
 * @author nghlong3004 (Nguyen Hoang Long)
 * @since 5/24/2026
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
  private static final String COMMON_PATH = "/api";
  private static final String API_VERSION = "/v1";
  private static final String API_BASE_PATH = COMMON_PATH + API_VERSION;
  private static final String[] API_POST_PUBLIC = {
    API_BASE_PATH + "/auth/login",
    API_BASE_PATH + "/auth/register",
    API_BASE_PATH + "/auth/verify-email",
    API_BASE_PATH + "/auth/forgot-password",
    API_BASE_PATH + "/auth/reset-password",
    API_BASE_PATH + "/auth/refresh-token",
    API_BASE_PATH + "/auth/logout",
  };

  private static final String[] API_GET_PUBLIC = {};

  private static final String[] SWAGGER_PATHS = {
    "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**"
  };

  private static final String[] INTERNAL_PATHS = {API_BASE_PATH + "/internal/**"};

  private static final String[] ACTUATOR_GET_PUBLIC = {};

  @Value("${vfqc.client.base-url}")
  private String webBaseUrl;

  private final UserDetailsService userDetailsService;
  private final PasswordEncoder passwordEncoder;
  private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
  private final ProviderAwareOAuth2UserService providerAwareOAuth2UserService;
  private final OAuth2RedirectToFilter oAuth2RedirectToFilter;
  private final TraceIdFilter traceIdFilter;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) {
    http.csrf(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(SWAGGER_PATHS)
                    .permitAll()
                    .requestMatchers(INTERNAL_PATHS)
                    .permitAll()
                    .requestMatchers(HttpMethod.OPTIONS, "/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, API_POST_PUBLIC)
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, API_GET_PUBLIC)
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, ACTUATOR_GET_PUBLIC)
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .oauth2Login(
            oauth2 ->
                oauth2
                    .authorizationEndpoint(
                        authorization ->
                            authorization.baseUri(API_BASE_PATH + "/oauth2/authorization"))
                    .redirectionEndpoint(
                        redirection -> redirection.baseUri(API_BASE_PATH + "/login/oauth2/code/*"))
                    .userInfoEndpoint(
                        userInfo -> userInfo.userService(providerAwareOAuth2UserService))
                    .successHandler(oAuth2LoginSuccessHandler))
        .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
        .oauth2ResourceServer(
            oauth2 ->
                oauth2
                    .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                    .bearerTokenResolver(bearerTokenResolver())
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
        .addFilterBefore(traceIdFilter, BearerTokenAuthenticationFilter.class)
        .addFilterBefore(oAuth2RedirectToFilter, OAuth2AuthorizationRequestRedirectFilter.class)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));
    return http.build();
  }

  @Bean
  public BearerTokenResolver bearerTokenResolver() {
    DefaultBearerTokenResolver headerResolver = new DefaultBearerTokenResolver();
    return request -> {
      if (isPublicRequest(request)) {
        return null;
      }
      return headerResolver.resolve(request);
    };
  }

  private boolean isPublicRequest(HttpServletRequest request) {
    String path = request.getServletPath();
    String method = request.getMethod();

    if (HttpMethod.OPTIONS.matches(method)) {
      return true;
    }

    for (String internalPath : INTERNAL_PATHS) {
      if (internalPath.endsWith("/**")
          && path.startsWith(internalPath.substring(0, internalPath.length() - 3))) {
        return true;
      }
      if (internalPath.equals(path)) {
        return true;
      }
    }

    if (HttpMethod.POST.matches(method)) {
      for (String publicPath : API_POST_PUBLIC) {
        if (publicPath.equals(path)) {
          return true;
        }
      }
    }

    if (HttpMethod.GET.matches(method)) {
      for (String publicPath : API_GET_PUBLIC) {
        if (publicPath.equals(path)) {
          return true;
        }
      }

      for (String publicPath : ACTUATOR_GET_PUBLIC) {
        if (publicPath.equals(path)) {
          return true;
        }
      }
    }

    return false;
  }

  @Bean
  public AuthenticationManager authenticationManager() {
    var authenticationProvider = new DaoAuthenticationProvider(userDetailsService);
    authenticationProvider.setPasswordEncoder(passwordEncoder);
    var providerManager = new ProviderManager(authenticationProvider);
    providerManager.setEraseCredentialsAfterAuthentication(true);

    return providerManager;
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of(webBaseUrl));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
        new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
    grantedAuthoritiesConverter.setAuthorityPrefix("");
    JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return jwtAuthenticationConverter;
  }
}
