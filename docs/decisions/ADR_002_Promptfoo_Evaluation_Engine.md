# ADR 002: Dùng Promptfoo làm Evaluation Engine (In-Memory Node API + Custom Provider)

## Status
Accepted

## Date
2026-06-19

## Context
Platform cần một engine để thực thi assertions (contains, regex, llm-rubric...) trên response của chatbot. Có 3 hướng tiếp cận:

1. **Tự viết evaluation loop**: Code vòng lặp chấm điểm từ đầu bằng Node.js (if/else cho contains, gọi LLM cho rubric...).
2. **Dùng promptfoo CLI**: Sinh file `promptfooconfig.yaml` rồi gọi `npx promptfoo eval`.
3. **Dùng promptfoo Node API**: Import thư viện `promptfoo` và gọi `evaluate(configObject)` trực tiếp trong code.

Đồng thời, promptfoo hỗ trợ nhiều cách gọi API chatbot (Provider):
- **HTTP Provider mặc định**: Khai báo URL/headers trong config.
- **Custom JS Provider (file)**: Viết file `provider.js` riêng.
- **Custom Function Provider (inline)**: Nhét hàm `async (prompt, context) => {...}` thẳng vào mảng `providers` của config object.

## Decision
Chúng ta dùng **promptfoo Node API** (`evaluate()`) với **Custom Function Provider (inline)** — tức Approach B trong tài liệu `promptfoo_yaml_nodejs_llm_spec.md`.

### Chi tiết kỹ thuật
- `ConfigGenerator` sinh ra một **JavaScript Object** trên RAM (không sinh file YAML).
- Mảng `providers` chứa một hàm async. Hàm này nhận prompt, gọi Chatbot API theo `Target.bodyTemplate`, dùng `jsonpath-plus` trích xuất field theo `ResponseMapping`, và trả về `{ output }` sạch cho promptfoo chấm.
- Gọi `await promptfoo.evaluate(configObject)` trực tiếp, toàn bộ chạy In-Memory.

## Alternatives Considered

### Tự viết evaluation loop
- **Pros**: Toàn quyền kiểm soát, không phụ thuộc thư viện bên ngoài.
- **Cons**: Phải tự implement hàng chục loại assertion (contains, regex, JSON schema, cosine similarity, llm-rubric...). Tốn hàng tuần dev và dễ sinh bug. Phải tự maintain khi có assertion type mới.
- **Rejected**: Tái phát minh bánh xe. Promptfoo đã có sẵn 30+ assertion types được test kỹ bởi cộng đồng open-source.

### Promptfoo CLI (`npx promptfoo eval`)
- **Pros**: Đơn giản, chỉ cần sinh file YAML rồi gọi lệnh.
- **Cons**: Phải ghi file YAML và file Provider JS ra ổ cứng mỗi lần chạy (Disk I/O). Khó kiểm soát lifecycle và error handling khi spawn child process. Không lấy được kết quả dạng Object trực tiếp — phải đọc file output.
- **Rejected**: Gây bottleneck I/O khi chạy hàng ngàn testcase và khó integrate với luồng Redis Streams.

### HTTP Provider mặc định
- **Pros**: Config đơn giản, chỉ cần khai báo URL.
- **Cons**: Không hỗ trợ JSONPath extraction trên response. Promptfoo sẽ chấm trên toàn bộ raw JSON string → gây False Positive. Không inject được `bodyTemplate` động từ domain model.
- **Rejected**: Không đáp ứng được yêu cầu `ResponseMapping` linh hoạt của PRD (mục 9.4).

### Custom JS Provider (file)
- **Pros**: Tách biệt logic provider ra file riêng.
- **Cons**: Vẫn phải ghi file JS ra ổ cứng mỗi lần chạy (vì mỗi Target có config khác nhau). Thừa thãi khi đã dùng Node API.
- **Rejected**: Custom Function Provider inline đạt cùng mục đích mà không cần Disk I/O.

## Consequences

### Tích cực
- Runner không đụng ổ cứng (Zero Disk I/O) khi chạy evaluation → tốc độ tối đa.
- Được thừa hưởng toàn bộ assertion types của promptfoo (contains, icontains, regex, is-json, llm-rubric, similar, cost...) mà không tốn effort tự code.
- Khi promptfoo update thêm assertion type mới, chỉ cần `npm update` là platform tự có.
- Custom Provider cho phép kiểm soát hoàn toàn việc gọi API chatbot và trích xuất response theo JSONPath.

### Tiêu cực
- Team phụ thuộc vào thư viện `promptfoo` (open-source, MIT license). Nếu thư viện bị abandon, phải fork hoặc thay thế.
- Developer cần đọc hiểu tài liệu `promptfoo_yaml_nodejs_llm_spec.md` để biết cách map assertion types.

### Giảm thiểu rủi ro
- Source of truth là domain model riêng (Assertion, ToolExpectation), không phải promptfoo config. Nếu cần thay thế promptfoo, chỉ cần viết lại module `ConfigGenerator` và `ResultNormalizer` (Adapter Pattern).

## Tham chiếu
- `docs/integrations/promptfoo_yaml_nodejs_llm_spec.md` — Mục 5.4 Approach B (Custom Function Provider)
- `docs/architecture/LLD_FullStack.md` — Mục 3.1 (Luồng Runner)
- `docs/product/PRD.md` — Mục 9.4 (ResponseMapping)
