package vn.vinfast.vfqc.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vinfast.vfqc.api.model.project.request.CreateProjectRequest;
import vn.vinfast.vfqc.api.model.project.request.UpdateProjectRequest;
import vn.vinfast.vfqc.api.model.project.response.ProjectResponse;
import vn.vinfast.vfqc.api.model.project.response.ProjectSetupStatus;
import vn.vinfast.vfqc.api.model.user.User;
import vn.vinfast.vfqc.api.repository.UserRepository;
import vn.vinfast.vfqc.api.service.ProjectService;
import vn.vinfast.vfqc.api.shared.dto.PageResponse;
import vn.vinfast.vfqc.api.shared.error.ErrorCode;
import vn.vinfast.vfqc.api.shared.error.ErrorResponse;
import vn.vinfast.vfqc.api.shared.error.ResourceException;

/**
 * @author nghlong3004 (Long Nguyen Hoang)
 * @since 6/25/2026
 */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management APIs")
public class ProjectController {

  private final ProjectService projectService;
  private final UserRepository userRepository;

  @Operation(summary = "Create project", description = "Creates a new QC project.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "201",
        description = "Project created successfully",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ProjectResponse.class))),
    @ApiResponse(
        responseCode = "400",
        description = "Validation failed",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  @PostMapping(
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public ProjectResponse createProject(
      @RequestBody CreateProjectRequest request, Principal principal) {
    Long userId = resolveUserId(principal);
    return projectService.create(request, userId);
  }

  @Operation(
      summary = "List user projects",
      description = "Retrieves all non-deleted projects created by the authenticated user.")
  @ApiResponse(
      responseCode = "200",
      description = "Paginated list of projects",
      content =
          @Content(
              mediaType = MediaType.APPLICATION_JSON_VALUE,
              schema = @Schema(implementation = PageResponse.class)))
  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public PageResponse<ProjectResponse> listUserProjects(
      Principal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Long userId = resolveUserId(principal);
    return projectService.listByUser(userId, page, size);
  }

  @Operation(
      summary = "Get project details",
      description = "Retrieves a project by its public identifier.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Project details",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ProjectResponse.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Project not found",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  @GetMapping(value = "/{publicId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public ProjectResponse getProject(@PathVariable UUID publicId) {
    return projectService.getByPublicId(publicId);
  }

  @Operation(
      summary = "Update project",
      description = "Updates an existing project's name or description.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Project updated successfully",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ProjectResponse.class))),
    @ApiResponse(
        responseCode = "400",
        description = "Validation failed",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Project not found",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  @PatchMapping(
      value = "/{publicId}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public ProjectResponse updateProject(
      @PathVariable UUID publicId, @RequestBody UpdateProjectRequest request) {
    return projectService.update(publicId, request);
  }

  @Operation(summary = "Delete project", description = "Soft deletes a project.")
  @ApiResponses({
    @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
    @ApiResponse(
        responseCode = "404",
        description = "Project not found",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  @DeleteMapping("/{publicId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProject(@PathVariable UUID publicId) {
    projectService.softDelete(publicId);
  }

  @Operation(
      summary = "Get project setup status",
      description = "Retrieves the configuration status overview for a project.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Project setup status",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = ProjectSetupStatus.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Project not found",
        content =
            @Content(
                mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  @GetMapping(value = "/{publicId}/setup-status", produces = MediaType.APPLICATION_JSON_VALUE)
  public ProjectSetupStatus getSetupStatus(@PathVariable UUID publicId) {
    return projectService.getSetupStatus(publicId);
  }

  private Long resolveUserId(Principal principal) {
    User user =
        userRepository
            .findByEmail(principal.getName().toLowerCase())
            .orElseThrow(() -> new ResourceException(ErrorCode.USER_NOT_FOUND));
    return user.getId();
  }
}
