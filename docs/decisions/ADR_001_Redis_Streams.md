# ADR 001: Architecture Decision Record - Message Broker cho Backend và Runner

## 1. Bối cảnh (Context)
Hệ thống Chatbot QA Automation Platform sử dụng kiến trúc Polyglot:
- **Backend API**: Java Spring Boot (nhận request từ User, lưu database).
- **Evaluation Runner**: Node.js (thực thi test case, gọi chatbot, chấm điểm assertions).

Khi user trigger 1 test run (ví dụ 100 testcases), Backend không thể chờ Runner chạy xong qua HTTP Request đồng bộ (vì sẽ timeout). Chúng ta cần một Message Broker (Queue) để xử lý bất đồng bộ (Async). Ban đầu dự kiến dùng Redis Queue tiêu chuẩn (LPUSH/BRPOP).

## 2. Vấn đề đặt ra (Problem)
- **Giới hạn của LPUSH/BRPOP**: Cơ chế List của Redis rất nguyên thủy. Khi có nhiều Runner cùng lúc, khả năng phân tải và giới hạn xử lý đồng thời (Throttling) phụ thuộc hoàn toàn vào code tự viết bên Node.js. Nếu Node.js crash do quá tải RAM (OOM), job đang chạy sẽ bị mất hoàn toàn khỏi hàng đợi.
- **Tại sao không dùng BullMQ**: BullMQ là thư viện queue xuất sắc cho Node.js, nhưng cấu trúc dữ liệu Redis bên dưới của nó là độc quyền và rất phức tạp. Java Spring Boot không thể dễ dàng ném 1 message vào BullMQ queue một cách an toàn mà không qua cầu nối.

## 3. Quyết định (Decision)
Chúng ta quyết định sử dụng **Redis Streams** với tính năng **Consumer Groups** thay vì Redis List hoặc BullMQ.

- Backend (Java) dùng lệnh `XADD` để ném job vào luồng Stream.
- Runner (Node.js) tham gia vào một Consumer Group và dùng lệnh `XREADGROUP` để nhận job.
- Sau khi xử lý xong, Runner gọi lệnh `XACK` để xác nhận job hoàn thành.

## 4. Lý do chọn (Rationale)
- **Độc lập ngôn ngữ (Polyglot-friendly)**: Cả Java (Lettuce/Jedis) và Node.js (ioredis) đều support Redis Streams out-of-the-box chuẩn xác.
- **Horizontal Scaling Dễ Dàng**: Nhờ Consumer Groups, Redis tự động phân phát job chéo cho N con Node.js Runner mà không sợ đụng hàng (mỗi job chỉ 1 runner nhận). Giải quyết hoàn hảo bài toán mở rộng khi hệ thống phình to.
- **Độ tin cậy cao (Reliability)**: Nếu 1 Runner bị OOM crash giữa chừng và không gọi `XACK`, job đó vẫn tồn tại trong Pending Entries List (PEL). Một Runner khác có thể nhảy vào "Claim" lại job đó để chạy bù. Không bao giờ mất data.
- **Giới hạn tài nguyên (Throttling)**: Node.js có thể chủ động giới hạn số job lấy về mỗi lần (`XREADGROUP COUNT X`), giúp tránh nghẽn RAM/CPU.

## 5. Hậu quả (Consequences)
- **Tích cực**: Hệ thống có độ bền bỉ cao, dễ dàng scale Runner component lên nhiều container docker mà không sợ xung đột queue.
- **Tiêu cực**: Developer cần hiểu cơ chế của Redis Streams (XADD, XREADGROUP, XACK, XCLAIM) thay vì chỉ PUSH/POP cơ bản.

## Tham chiếu
- Thay thế thiết kế hàng đợi List trong `C4_Architecture.md`.
- Implement tại `apps/api/` sử dụng `spring-data-redis` (Java) và `apps/runner/` sử dụng `ioredis` (Node.js).
