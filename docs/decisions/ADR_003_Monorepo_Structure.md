# ADR 003: Monorepo với cấu trúc `apps/`

## Status
Accepted

## Date
2026-06-19

## Context
Dự án Chatbot QA Automation Platform gồm 3 ứng dụng deployable độc lập:

- **API** (Java Spring Boot): REST API, quản lý domain, kết nối DB.
- **Client** (React + Vite): Giao diện web cho QC.
- **Runner** (Node.js + Promptfoo): Worker xử lý evaluation jobs từ Redis Streams.

Cần quyết định cách tổ chức source code: Monorepo (1 repo chứa tất cả) hay Multi-repo (mỗi app 1 repo riêng).

## Decision
Sử dụng **Monorepo** với cấu trúc thư mục:

```
vf-ai-testhub/
├── apps/
│   ├── api/          # Java Spring Boot
│   ├── client/       # React + Vite + TypeScript + Tailwind v4
│   └── runner/       # Node.js + TypeScript + Promptfoo
├── docs/
│   ├── decisions/    # ADRs
│   ├── PRD.md
│   ├── LLD_FullStack.md
│   └── ...
├── docker-compose.yml
└── README.md
```

### Quy tắc đặt tên
| Tên thư mục | Vai trò | Lý do chọn tên |
|---|---|---|
| `apps/` | Chứa các ứng dụng deployable | Convention chuẩn của Turborepo/Nx. Số nhiều vì chứa nhiều app. |
| `api/` | Backend REST API | Mô tả chính xác vai trò: cung cấp API. Ngắn gọn hơn "backend". |
| `client/` | Frontend web app | Convention phổ biến trong monorepo. Phân biệt rõ với "api" (server vs client). |
| `runner/` | Evaluation worker | Khớp 100% với thuật ngữ trong PRD, LLD, C4. Tránh nhầm với `core` (thường là shared library). |

## Alternatives Considered

### Multi-repo (3 repo riêng biệt)
- **Pros**: Mỗi team hoàn toàn độc lập. CI/CD đơn giản hơn cho từng repo.
- **Cons**: Khó đồng bộ version giữa các repo. Thay đổi API contract (ví dụ: thêm field vào RunSnapshot) phải tạo PR ở 2 repo cùng lúc và merge đúng thứ tự. Review cross-repo cực kỳ khó.
- **Rejected**: Team size nhỏ (< 5 người), overhead quản lý 3 repo không đáng. Tốc độ iteration quan trọng hơn isolation.

### Thư mục gốc không có `apps/` (flat structure)
```
vf-ai-testhub/
├── api/
├── client/
├── runner/
└── docs/
```
- **Pros**: Đơn giản, ít nesting.
- **Cons**: Không phân biệt được đâu là deployable app, đâu là thư mục hỗ trợ (docs, scripts, configs). Khi thêm `packages/` (shared types) sau này sẽ lộn xộn.
- **Rejected**: Mất khả năng mở rộng. Convention `apps/` + `packages/` là pattern đã được chứng minh.

### Đặt tên `core` thay vì `runner`
- **Pros**: Nghe "quan trọng" hơn.
- **Cons**: Trong convention monorepo, `core` thường là shared library (package dùng chung), không phải standalone service. Dev mới vào sẽ hiểu nhầm.
- **Rejected**: `runner` mô tả đúng chức năng và khớp với toàn bộ tài liệu thiết kế.

## Consequences

### Tích cực
- **Atomic changes**: Khi thay đổi API contract (ví dụ: thêm field vào `RunSnapshot`), dev có thể sửa cả `apps/api` và `apps/runner` trong cùng 1 PR, review 1 lần, merge 1 lần.
- **Shared docs**: Toàn bộ PRD, LLD, ADR nằm cùng repo, luôn đồng bộ với code.
- **Dễ onboard**: Dev mới clone 1 repo, chạy `docker-compose up` là có đủ môi trường.
- **Mở rộng sau này**: Khi cần shared TypeScript types giữa `client` và `runner`, chỉ cần thêm `packages/shared-types/`.

### Tiêu cực
- CI/CD phức tạp hơn: Cần detect thư mục thay đổi để chỉ build/deploy app bị ảnh hưởng (path-based triggers).
- Repo size lớn dần theo thời gian.

## Tham chiếu
- `docs/product/PRD.md` — Mục 6 (Tech Stack)
- `docs/architecture/C4_Architecture.md` — Kiến trúc tổng quan
