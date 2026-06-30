# BRD-lite Brief: Chatbot Comparison

## Executive Summary
Thêm tính năng cho phép so sánh chất lượng, độ chính xác và format câu trả lời giữa chatbot nội bộ (đã cấu hình qua Target Config) và các LLM phổ biến khác trên thị trường (như OpenAI, Gemini, Anthropic).

## Business Objective
Giúp QA/Tester dễ dàng benchmarking năng lực chatbot nội bộ so với các LLM thương mại, từ đó có báo cáo đánh giá trực quan (biểu đồ, lịch sử) để team Data Science/AI Engineer điều chỉnh model nội bộ.

## SMART Success Metric
- 100% các Test Run so sánh hiển thị được kết quả song song giữa Chatbot nội bộ và các LLM đối thủ.
- Ít nhất 1 biểu đồ trực quan (Bar chart/Radar chart) so sánh điểm số trung bình và tỷ lệ Pass giữa các bot được hiển thị sau mỗi lần chạy.

## Target Users
QA/Tester, Product Owner, AI Engineer.

## Problem
Hiện tại nền tảng chỉ cho phép test và chấm điểm 1 target chatbot duy nhất (nội bộ). Khi cần chứng minh bot nội bộ tốt hơn hoặc tương đương GPT-4/Gemini trên cùng 1 dataset (benchmarking), QA phải chạy tay bên ngoài hoặc liên tục đổi Target Config, rất mất thời gian, khó tổng hợp báo cáo và không có UI so sánh trực tiếp.

## AS-IS To TO-BE
- **AS-IS**: Nền tảng chỉ đánh giá được 1 chatbot nội bộ duy nhất thông qua `TargetConfig`. Việc so sánh đòi hỏi manual.
- **TO-BE**: Chạy test song song chatbot nội bộ và nhiều LLM khác. Các LLM so sánh được lưu qua bảng cấu hình AI có sẵn (tái sử dụng `AiConfig`). Hiển thị kết quả so sánh dạng bảng và biểu đồ trực quan, lưu lại lịch sử chạy.

## Stakeholders And Validation Owner
- **Owner**: QA Lead / PM.
- **Stakeholders**: Dev Team, Data Science Team, Client Sponsor.

## Success Metrics
- Số lượng Test Run sử dụng tính năng compare.
- Tỷ lệ giảm thời gian tạo báo cáo benchmarking chatbot (ước tính giảm >80% thời gian manual).

## Cost-Benefit / Value Hypothesis
Cung cấp tính năng so sánh trực quan sẽ biến VF QC Copilot thành một công cụ benchmarking mạnh mẽ không chỉ cho QA mà còn cho AI Engineers, tăng mức độ gắn kết với sản phẩm.

## Offshore Delivery Context
Cần đảm bảo backend cập nhật schema `AiConfig` (thêm type/role) và phá bỏ unique constraint trên `project_id`. Node Runner cần xử lý được việc gọi nhiều AI Providers trong cùng 1 Test Run (Promptfoo vốn đã hỗ trợ cơ chế multiple providers rất tốt).

## Recommended Approach
Tận dụng sức mạnh multi-provider của Promptfoo:
1. **Backend**: 
   - Thêm cột `type` (Enum: `JUDGE`, `COMPARE`) vào entity `AiConfig`. 
   - Bỏ unique constraint hiện tại trên `project_id` của `AiConfig` và thay bằng unique trên `(project_id, type, name)` để một project có thể lưu nhiều AI model dùng làm đối thủ so sánh.
   - Mở rộng API tạo Test Run để nhận thêm mảng `compareAiConfigIds`.
2. **Node Runner**:
   - Gen `promptfoo.yaml` với section `providers` bao gồm: 1 webhook provider (chatbot nội bộ) + mảng các providers mapping từ `AiConfig` (ví dụ: `openai:chat:gpt-4o`, `google:gemini-1.5-pro`).
   - Xử lý raw output của promptfoo để mapping kết quả theo từng model.
3. **Frontend**:
   - Thêm menu "So sánh LLM" trong Sidebar. Sử dụng lại form/component của màn LLM Judge nhưng điều chỉnh để lưu danh sách các LLM Compare.
   - Ở màn Test Run mới (hoặc chế độ Compare), cho phép chọn dataset, chọn target chatbot và tick chọn các LLM muốn đem ra so sánh.
   - Kết quả (Result Page): Dùng Recharts vẽ biểu đồ so sánh (Bar chart cho Pass Rate, Radar chart cho các tiêu chí Rubric).

## Alternatives Considered
- **Dùng Target Config để lưu các LLM khác**: Bị rườm rà vì Target Config đòi hỏi cURL parsing, trong khi LLM ngoài đã có API chuẩn và Node Runner có thể dùng trực tiếp LLM SDK.
- **Tự viết logic gọi multi-LLM ở runner**: Rất tốn effort và dễ lỗi. Nên dùng thẳng tính năng providers array của Promptfoo.

## Stakeholders
- QA Team
- Dev Team

## Constraints
- Việc chạy nhiều LLM cùng lúc sẽ tốn nhiều tokens/chi phí API (gọi N model cho M test cases = N * M requests + Judge requests). Cần hiển thị cảnh báo chi phí dự kiến cho user trước khi run.

## Non-Goals
- Tự động fine-tune chatbot dựa trên kết quả so sánh.
- Phân tích chi tiết mức độ lệch về "giọng điệu" bằng AI trừ khi đã có trong rubric.

## Glossary
- **LLM Judge**: LLM dùng để chấm điểm câu trả lời (đã có sẵn).
- **LLM Compare**: Các LLM thương mại dùng làm đối thủ để so sánh với chatbot nội bộ.

## PM Handoff Checklist
- [x] Rõ ràng mục tiêu business.
- [x] Đã định nghĩa phương án kỹ thuật và thay đổi DB (`AiConfig`).
- [x] Đã map được với capabilities của hệ thống hiện tại (Promptfoo).

## Open Questions
> [!WARNING]
> Cần làm rõ các câu hỏi sau với PM/Team trước khi qua bước Implementation Plan:

1. **Giới hạn số lượng**: Số lượng "LLM khác" tối đa cho 1 lần chạy so sánh là bao nhiêu để đảm bảo UX/UI không bị vỡ và quản lý được chi phí API? (Gợi ý: Max 3-5).
2. **Lưu trữ Test Run**: Lịch sử chạy so sánh nên được gom chung vào bảng `TestRun` hiện tại (thêm type `COMPARISON`) hay tách ra bảng riêng `CompareRun`? (Gợi ý: Dùng chung `TestRun` và thêm `runType`).
3. **UI Biểu đồ**: Mức độ chi tiết của biểu đồ? Có cần so sánh từng case hay chỉ cần so sánh điểm tổng và Pass rate?

## Next Workflow
`/plan-feature`
