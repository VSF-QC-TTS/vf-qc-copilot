# VinFast QC Copilot

Dự án này là nền tảng tự động hóa kiểm thử nội bộ dành cho đội ngũ QC, được thiết kế để kiểm thử và đánh giá tự động các phản hồi của chatbot thông qua API. Hệ thống sinh ra để giảm bớt quy trình thủ công sử dụng Excel và các công cụ đánh giá tổng hợp bằng AI (all-in-one LLM judge), chuyển hướng sang phương pháp "đánh giá có cấu trúc" (structured evaluation) dựa trên từng trường, thành phần, công cụ và tiêu chí đánh giá (rubric) cụ thể.

## Kiến Trúc Hệ Thống

Hệ thống được phát triển theo mô hình microservices bên trong một kho lưu trữ mã nguồn duy nhất (monorepo). Các thành phần chính giao tiếp với nhau qua giao thức REST API và hàng đợi tin nhắn Redis Streams:

1. Frontend SPA (`apps/client`):
   - Công nghệ: React, Vite, TypeScript.
   - Vai trò: Giao diện người dùng cho đội ngũ QC để quản lý dự án, cấu hình mục tiêu kiểm thử, tạo dữ liệu kiểm thử (test cases) bằng AI, và đánh giá kết quả chạy kiểm thử (run reports).

2. Backend API (`apps/api`):
   - Công nghệ: Java Spring Boot.
   - Vai trò: Cung cấp API lõi, quản lý logic nghiệp vụ, quản lý vòng đời đánh giá, phối hợp với các LLM, và đẩy các tác vụ kiểm thử (jobs) vào hàng đợi Redis.

3. Evaluation Runner (`apps/runner`):
   - Công nghệ: Node.js.
   - Vai trò: Đóng vai trò consumer, nhận tác vụ từ hàng đợi Redis. Runner thực hiện gọi API chatbot, chuẩn hóa phản hồi, sau đó sử dụng công cụ promptfoo để chạy các assertions/evaluations, và gửi kết quả về Backend API.

4. Hạ tầng dữ liệu:
   - PostgreSQL: Cơ sở dữ liệu chính lưu trữ các thông tin nghiệp vụ.
   - Redis: Hàng đợi lưu trữ các job phục vụ cho Evaluation Runner.

## Cấu Trúc Thư Mục

- `apps/api/`: Mã nguồn Backend API (Spring Boot).
- `apps/client/`: Mã nguồn Frontend SPA (React + Vite).
- `apps/runner/`: Mã nguồn Evaluation Runner (Node.js).
- `docs/`: Chứa toàn bộ tài liệu của dự án phục vụ cho quá trình nghiên cứu và bàn giao.
  - `agent/`: Quy trình làm việc và chỉ dẫn dành cho AI Agents.
  - `architecture/`: Tài liệu kiến trúc C4 Model, thiết kế tầng thấp (LLD), API, và lược đồ cơ sở dữ liệu.
  - `decisions/`: Hồ sơ quyết định kiến trúc (ADRs).
  - `product/`: Tài liệu yêu cầu sản phẩm (PRD) và bản thiết kế giao diện (UI Prototype).
  - `tasks/`: Lộ trình phát triển và danh sách các tác vụ (Epics) đã và đang thực hiện.
- `docker-compose.yml`: Cấu hình khởi tạo môi trường phát triển cục bộ.
- `AGENTS.md`: Nguyên tắc và quy định cho các luồng hoạt động của AI.

## Hướng Dẫn Khởi Chạy (Môi Trường Cục Bộ)

Dự án có sẵn tệp `docker-compose.yml` giúp việc khởi tạo toàn bộ hạ tầng phần mềm (Database, Redis, API, Runner, và Client) trên môi trường cục bộ (local) trở nên nhanh chóng.

### Yêu Cầu Cần Thiết
- Hệ thống đã được cài đặt Docker và Docker Compose.

### Các Bước Thực Hiện

1. Tạo tệp biến môi trường từ mẫu có sẵn:
   Sao chép tệp `.env.example` thành `.env` ở thư mục gốc của dự án.
   
   ```bash
   cp .env.example .env
   ```

2. Cấu hình biến môi trường:
   Mở tệp `.env` vừa tạo và cập nhật các giá trị cấu hình thực tế cho môi trường của bạn (ví dụ: `GEMINI_API_KEY`, `POSTGRES_PASSWORD`, cấu hình SMTP gửi mail, v.v.).

3. Khởi chạy hệ thống:
   Sử dụng lệnh sau trong terminal để khởi chạy toàn bộ các dịch vụ qua Docker:

   ```bash
   docker compose up -d
   ```

### Thông Tin Truy Cập
Sau khi khởi chạy thành công, các dịch vụ sẽ khả dụng tại:
- Frontend SPA: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: Kết nối thông qua cổng 5432 tại localhost (thông tin đăng nhập nằm trong tệp `docker-compose.yml`).
- Redis: Kết nối thông qua cổng 6379 tại localhost.

## Tài Liệu Tham Khảo Dành Cho Handover

Để hiểu rõ chi tiết về quy trình và thiết kế kỹ thuật, người nhận bàn giao cần tham khảo các tài liệu cốt lõi sau:

1. Yêu cầu sản phẩm và nghiệp vụ: `docs/product/PRD.md`
2. Kiến trúc tổng thể và chi tiết: `docs/architecture/C4_Architecture.md`
3. Lộ trình công việc (Backend & Runner): `docs/tasks/TASKS_Backend.md` và `docs/tasks/TASKS_Runner.md`
4. Danh mục tài liệu tổng hợp: `docs/INDEX.md`
