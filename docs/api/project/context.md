# API Project Context

File này là context ngắn cho client/AI coding agent về module Project. Code backend vẫn là source of truth; nếu cần contract chi tiết hơn, đọc `docs/api/project/client-contract.md`.

## Backend Status

Project module đã có các flow cơ bản:

- Create project
- List user projects (có phân trang)
- Get project details
- Update project (partial)
- Soft delete project
- Get project setup status (hiện tại trả về false/0 vì config modules chưa được implement)

Backend dùng Spring Boot API tại base path `/api/v1/projects`. Tất cả endpoint đều yêu cầu authentication.

## Project Endpoints

| Flow | Method | Path | Success |
| --- | --- | --- | --- |
| Create project | `POST` | `/api/v1/projects` | `201 ProjectResponse` |
| List projects | `GET` | `/api/v1/projects?page=0&size=20` | `200 PageResponse<ProjectResponse>` |
| Get project | `GET` | `/api/v1/projects/{publicId}` | `200 ProjectResponse` |
| Update project | `PATCH` | `/api/v1/projects/{publicId}` | `200 ProjectResponse` |
| Delete project | `DELETE` | `/api/v1/projects/{publicId}` | `204`, empty body |
| Get setup status | `GET` | `/api/v1/projects/{publicId}/setup-status` | `200 ProjectSetupStatus` |

## Authentication

Tất cả request phải có HttpOnly cookie `refresh_token` hoặc `Authorization: Bearer <token>`.
Client rule: nếu nhận lỗi 401, refresh token (nếu dùng refresh token flow) và thử lại. Nếu thất bại, route user về login.

## Error Model

Backend errors dùng RFC 9457 Problem Details. Giống với auth module.

Client rules:

- Dùng top-level `code` cho global/page state.
- Dùng `fieldErrors[].field` để map lỗi vào form field.
- Dùng `fieldErrors[].messageCode` cho i18n key.

## Important Error Codes

| Code | Client behavior |
| --- | --- |
| `PROJECT_NOT_FOUND` | Hiện 404 trang không tìm thấy hoặc toast thông báo lỗi |
| `PROJECT_NAME_REQUIRED` | Thông báo tên project bị thiếu |
| `PROJECT_ALREADY_DELETED` | Chặn truy cập và thông báo project đã bị xóa |
| `VALIDATION_ERROR` | Map `fieldErrors` vào form tạo/sửa project |

## Data Types

```ts
type ProjectResponse = {
  publicId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectSetupStatus = {
  hasTargetConfig: boolean;
  hasJudgeConfig: boolean;
  hasDatasetSchema: boolean;
  hasVerification: boolean;
  hasDatasets: boolean;
  totalTestRuns: number;
};

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
```

## Backend Files Worth Reading

Read these only if implementation behavior is unclear:

- `apps/api/src/main/java/vn/vinfast/vfqc/api/controller/ProjectController.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/service/impl/ProjectServiceImpl.java`
- `apps/api/src/main/java/vn/vinfast/vfqc/api/shared/model/PageResponse.java`
