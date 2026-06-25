# Client Auth Implementation Checklist

Checklist này dùng cho AI coding agent và reviewer. Agent phải copy checklist này vào `docs/client/auth/plan.md`, tick từng mục khi lập plan, và cập nhật status sau mỗi phase.

Status legend:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked, needs user decision

## 0. Discovery Gate

- [ ] Đã đọc `docs/client/auth/ai-brief.md`.
- [ ] Đã đọc `docs/api/auth/context.md`.
- [ ] Đã đọc `docs/api/auth/client-contract.md`.
- [ ] Đã đọc `docs/planning/client-backend-assignment-with-queue.md` chỉ để lấy context tổng.
- [ ] Đã inspect repo để xác định client app có tồn tại hay chưa.
- [ ] Đã ghi framework/package manager/router/state/form/test setup hiện có.
- [ ] Nếu chưa có client app, đã dừng lại và xin user approve scaffold trước khi tạo file.

Exit criteria:

- [ ] Có `docs/client/auth/plan.md`.
- [ ] Plan ghi rõ client exists: yes/no.
- [ ] Plan ghi rõ commands thực tế sẽ dùng để verify.

## 1. API Contract Gate

- [ ] Đã định nghĩa `ApiErrorResponse`.
- [ ] Đã định nghĩa `ApiFieldError`.
- [ ] Đã định nghĩa request/response types cho register/login/refresh/logout/current-user/verify/forgot/reset.
- [ ] Types khớp `docs/api/auth/client-contract.md`.
- [ ] Không tự thêm role/status ngoài contract.
- [ ] Không tự thêm endpoint ngoài contract.
- [ ] Có helper detect problem-detail error.
- [ ] Có helper map `fieldErrors` vào form fields.
- [ ] Có mapping từ backend `code` sang client UI copy key.
- [ ] Có lưu/forward `traceId` vào debug/support context.

Exit criteria:

- [ ] Typecheck pass cho phase này.
- [ ] Có test hoặc unit-level coverage cho error parsing/mapping nếu project có test setup.

## 2. HTTP Client Gate

- [ ] Tất cả auth/API requests dùng `credentials: "include"`.
- [ ] Access token được gắn bằng `Authorization: Bearer <token>` khi có token.
- [ ] Refresh token không bị đọc từ JS.
- [ ] `POST /api/v1/auth/refresh-token` dùng cookie, không truyền refresh token trong body.
- [ ] Khi gặp `ACCESS_TOKEN_EXPIRED`, client refresh đúng một lần.
- [ ] Sau refresh success, retry original request đúng một lần.
- [ ] Refresh failure với `INVALID_REFRESH_TOKEN` hoặc `REFRESH_TOKEN_EXPIRED` clear session.
- [ ] Không có infinite refresh loop.

Exit criteria:

- [ ] Endpoint wrappers tồn tại cho toàn bộ auth endpoints.
- [ ] Tests cover refresh retry once, nếu test setup có sẵn.

## 3. Auth State Gate

- [ ] Auth state có `accessToken`.
- [ ] Auth state có `user`.
- [ ] Auth state có `status`: `anonymous | loading | authenticated`.
- [ ] Có action `login`.
- [ ] Có action `logout`.
- [ ] Có action `hydrateCurrentUser`.
- [ ] Có action `setSessionFromLoginResponse`.
- [ ] Có action `clearSession`.
- [ ] Storage decision được ghi trong plan.
- [ ] Nếu cần persistence qua reload, dùng `sessionStorage`, không dùng `localStorage` mặc định.
- [ ] `USER_NOT_FOUND` clear session.
- [ ] Logout clear local state kể cả khi backend logout fail.

Exit criteria:

- [ ] Auth state tests pass nếu project có test setup.

## 4. Form And Page Gate

Login:

- [ ] Login form có email/password.
- [ ] Có password visibility toggle.
- [ ] Có loading/disabled submit.
- [ ] `BAD_CREDENTIALS` hiện form-level error.
- [ ] `EMAIL_NOT_VERIFIED` hiện verify guidance.
- [ ] `ACCOUNT_LOCKED` hiện account disabled/support guidance.
- [ ] Success route sang app home/dashboard.

Register:

- [ ] Register form có email/password/displayName optional.
- [ ] `EMAIL_ALREADY_EXISTS` attach vào email field.
- [ ] `VALIDATION_ERROR` map field errors.
- [ ] Success hiện check-email state.

Forgot password:

- [ ] Form submit email.
- [ ] Success `204` luôn hiện accepted state.
- [ ] Không reveal account có tồn tại hay không.

Verify email:

- [ ] Đọc token từ query string.
- [ ] Missing token không gọi API.
- [ ] Invalid/used/expired token có state riêng.
- [ ] Success hiện verified state với login CTA.

Reset password:

- [ ] Đọc token từ query string.
- [ ] Missing token không gọi API.
- [ ] Submit `token` và `newPassword`.
- [ ] Invalid/used/expired token có state riêng.
- [ ] Success hiện reset-success state với login CTA.

Exit criteria:

- [ ] UI không dùng backend `detail` làm copy chính.
- [ ] Field errors render đúng field.
- [ ] Forms accessible: label/input/error association cơ bản.

## 5. Route Guard Gate

- [ ] Guest-only routes gồm login/register/forgot-password/reset-password/verify-email.
- [ ] Protected routes yêu cầu authenticated state.
- [ ] Anonymous vào protected route bị redirect login.
- [ ] Authenticated vào login/register bị redirect app home/dashboard.
- [ ] Hydration behavior khi reload được mô tả trong plan và implement đúng.

Exit criteria:

- [ ] Route guard verified bằng test hoặc manual checklist.

## 6. Verification Gate

- [ ] Đã chạy install/build command nếu cần.
- [ ] Đã chạy typecheck command.
- [ ] Đã chạy lint command nếu có.
- [ ] Đã chạy test command nếu có.
- [ ] Đã ghi rõ command nào không tồn tại hoặc không chạy được.
- [ ] Manual smoke checklist được cập nhật.

Manual smoke:

- [ ] Register success -> check-email state.
- [ ] Duplicate register -> email field error.
- [ ] Login success -> authenticated state.
- [ ] Wrong login -> invalid credential message.
- [ ] Get current user works with access token.
- [ ] Refresh flow retries expired access request once.
- [ ] Logout clears session.
- [ ] Forgot password success -> accepted state.
- [ ] Verify email success and token error states.
- [ ] Reset password success and token error states.

## 7. Final Handoff Gate

- [ ] `docs/client/auth/plan.md` updated with final status.
- [ ] Files changed list recorded.
- [ ] Verification commands and results recorded.
- [ ] Open questions recorded.
- [ ] Known limitations recorded.
