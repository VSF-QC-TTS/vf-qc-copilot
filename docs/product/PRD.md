# PRD v1.0 — Chatbot QA Automation Platform

## 1. Tổng quan sản phẩm

### 1.1 Tên sản phẩm tạm thời

**Chatbot QA Automation Platform**

### 1.2 Mục tiêu

Xây dựng một nền tảng nội bộ giúp QC tự động hóa việc kiểm thử chatbot thông qua API, giảm phụ thuộc vào Excel và thao tác copy/paste thủ công, đồng thời nâng cấp cách chấm từ **LLM all-in-one judge** sang **structured evaluation** theo field/component/tool/rubric.

Platform sử dụng **promptfoo** làm evaluation runner/adapter bên dưới, nhưng source of truth của hệ thống là domain model riêng, không phải promptfoo YAML.

---

## 2. Bối cảnh hiện tại

### 2.1 Luồng QC hiện tại

```text
Business Requirement
  -> QC đọc và phân tích
  -> QC tạo/lấy mock data
  -> QC query DB
  -> QC copy sang Web AI
  -> AI sinh testcase
  -> AI sinh ground truth
  -> QC chỉnh sửa ground truth
  -> QC copy vào Excel
  -> Tool gọi Chatbot API
  -> LLM chấm all-in-one
  -> Tool export Excel
  -> QC review và chốt pass/fail
```

### 2.2 File report hiện tại

File CSV hiện tại chỉ dùng để tham khảo. Trong file đó, **testcase gốc chỉ gồm 4 cột đầu**:

```text
id
section_name
custom_nlp_sample
custom_nlp_expected_dialog
```

Mapping sang platform mới:

| Cột hiện tại                 | Ý nghĩa                          | Mapping mới                 |
| ---------------------------- | -------------------------------- | --------------------------- |
| `id`                         | ID testcase cũ                   | `TestCase.externalId`       |
| `section_name`               | Nhóm/section testcase            | `TestCase.sectionName`      |
| `custom_nlp_sample`          | Câu hỏi/user input               | `TestCase.input`            |
| `custom_nlp_expected_dialog` | Expected behavior / ground truth | `TestCase.expectedBehavior` |

Các cột còn lại trong file hiện tại như:

```text
actual_chatbot_response
actual_agent_steps
custom_actual_chatbot_suggestion
inferred_actual_agents
inferred_actual_tools
actual_retrieval
actual_memory
trace_id
eval_final_status
eval_critical_error
latency_seconds
```

không phải testcase definition. Chúng là **result sau khi tool chạy**.

Vì vậy model đúng là:

```text
TestCase = dữ liệu QC định nghĩa trước khi chạy
RunResult = dữ liệu hệ thống sinh ra sau khi chạy
```

---

## 3. Vấn đề cần giải quyết

### 3.1 Pain points

1. QC phải copy/paste nhiều giữa requirement, Web AI, Excel, tool test.
2. Testcase và ground truth được tạo ngoài hệ thống chính.
3. Excel đang là source of truth, khó quản lý version và lịch sử chạy.
4. Tool hiện tại chấm all-in-one nên khó biết fail vì điều kiện nào.
5. Một response chatbot có thể có nhiều field/component cần chấm, nhưng tool hiện tại chưa đủ field-aware.
6. Tool call/agent/action phía sau chatbot chưa được model thành first-class object.
7. QC vẫn phải review nhiều dòng trong Excel.
8. Rubric/expected behavior bị lặp lại, khó tái sử dụng.
9. Auto evaluation và manual review chưa được tách rõ.

### 3.2 Product direction

Platform mới cần chuyển từ:

```text
Excel + LLM all-in-one judge + manual review từng dòng
```

sang:

```text
Dataset trong platform
+ AI generate testcase
+ response mapping linh hoạt
+ field/component assertions
+ tool expectations
+ rubric reuse
+ assertion breakdown
+ manual review layer
```

---

## 4. Product Goals

### 4.1 Goals

1. Cho phép mỗi chatbot là một project.
2. Cho phép QC paste cURL để tạo target API.
3. Cho phép biến cURL thành request template có thể inject testcase input.
4. Cho phép import legacy CSV/Excel với 4 cột testcase gốc.
5. Cho phép AI generate testcase ngay trong platform.
6. Cho phép AI suggest assertions và tool expectations từ requirement/expected behavior.
7. Cho phép QC tạo nhiều dataset trong cùng project.
8. Cho phép mỗi testcase có nhiều assertion.
9. Cho phép assertion target một field, một component, nhiều field/component hoặc toàn bộ response.
10. Cho phép test tool call/agent/action nếu chatbot expose data tương ứng.
11. Cho phép LLM judge bằng reusable rubric.
12. Cho phép run test async và xem report theo từng assertion/tool expectation.
13. Cho phép QC manual review và override final status.
14. Thiết kế đủ mở để support nhiều chatbot response schema khác nhau.

---

## 5. Non-goals trong MVP

MVP chưa cần làm:

```text
multi-turn conversation phức tạp
streaming/SSE/WebSocket
file upload/multipart request
third-party OAuth provider token refresh
CI/CD pull request gating
scheduled run
distributed runner nhiều node
advanced RBAC
full red-team automation
deep trace provider integration
```

Tuy nhiên kiến trúc phải mở để thêm các phần này ở phase sau.

---

## 6. Tech Stack

### 6.1 Frontend

```text
React
Vite
TypeScript
Tailwind CSS v4
Zustand (State Management)
```

### 6.2 Backend chính

```text
Java Spring Boot 4.1.0
PostgreSQL
Redis Streams (xem ADR_001)
Lombok
MapStruct
Local artifact storage
```

### 6.3 Runner

```text
Node.js service (TypeScript)
promptfoo Node API (evaluate() - In-Memory, không dùng CLI)
ioredis (Redis Streams consumer)
jsonpath-plus (Response extraction)
Jest (Testing)
```

### 6.4 Storage

MVP dùng local storage cho artifact.

Có thể scale sau sang:

```text
S3
MinIO
Object Storage nội bộ
```

---

## 7. Kiến trúc tổng quan

```text
[React + Vite Frontend]
          |
          v
[Java Spring Boot Backend]
          |
          +----> [PostgreSQL]
          |
          +----> [Local Artifact Storage]
          |
          +----> [Redis Queue]
                    |
                    v
          [Node.js Promptfoo Runner]
                    |
                    v
          [Internal Chatbot API]
```

### 7.1 Vai trò từng thành phần

#### Frontend

Dùng cho QC thao tác:

```text
tạo project
paste cURL
map request input
map response fields/components
tạo dataset/testcase
AI generate testcase
tạo assertion
tạo tool expectation
tạo/reuse rubric
run test
xem report
manual review
```

#### Spring Boot Backend

Quản lý domain chính:

```text
Project
Target
ResponseMapping
Dataset
TestCase
Assertion
ToolExpectation
Rubric
Run
Result
ManualReview
```

#### Node.js Runner

Chuyên chạy eval:

```text
nhận job từ Redis
load run snapshot
generate promptfoo config
gọi chatbot API
normalize response
chạy assertions/tool expectations
parse result
gửi kết quả về backend
lưu artifact
```

#### Promptfoo

Được dùng như **adapter/evaluation engine**, không phải source of truth.

---

## 8. Nguyên tắc thiết kế OOP/domain-first

### 8.1 Core object graph

```text
Project
 ├── Target[]
 │    └── ResponseMapping
 ├── Dataset[]
 │    └── TestCase[]
 │         ├── Assertion[]
 │         └── ToolExpectation[]
 ├── Rubric[]
 └── Run[]
      └── TestResult[]
           ├── AssertionResult[]
           ├── ToolExpectationResult[]
           └── ManualReview
```

### 8.2 Nguyên tắc quan trọng

```text
TestCase mô tả scenario.
Assertion mô tả điều kiện chấm response.
ToolExpectation mô tả kỳ vọng tool/agent/action.
Rubric mô tả tiêu chí LLM judge.
Run là một lần thực thi dataset.
TestResult là output sau khi chạy.
PromptfooAdapter chuyển domain object sang promptfoo config.
```

---

# 9. Domain Model

## 9.1 Project

### Purpose

Đại diện cho một chatbot cần test.

### Fields

```text
id
name
description
owner
createdBy
createdAt
updatedAt
archived
```

### Responsibilities

```text
quản lý target/environment
quản lý dataset
quản lý rubric
quản lý run history
```

---

## 9.2 Target

### Purpose

Đại diện cho một API endpoint/environment của chatbot.

Một project có thể có nhiều target:

```text
dev
staging
production
local
experiment
```

### Fields

```text
id
projectId
name
environment
method
url
queryParamsTemplate
headersTemplate
bodyTemplate
authConfig
inputBinding
variableBindings
responseMappingId
timeoutMs
isDefault
createdAt
updatedAt
```

### Example

```json
{
  "method": "POST",
  "url": "https://chatbot.internal/api/chat",
  "bodyTemplate": {
    "message": "{{input}}",
    "user_id": "{{variables.user_id}}",
    "session_id": "{{variables.session_id}}"
  },
  "inputBinding": {
    "source": "testcase.input",
    "targetPath": "body.message"
  }
}
```

---

## 9.3 RequestTemplate

### Purpose

Request được parse từ cURL và parameterized.

### Fields

```text
method
urlTemplate
headersTemplate
queryTemplate
bodyTemplate
inputBinding
variableBindings
secretRefs
```

### Responsibilities

```text
inject testcase.input vào request
inject testcase.variables vào request
redact secret khi log/report
preview request trước khi run
```

### MVP support

```text
GET
POST
PUT
headers
query params
JSON body
Authorization header
X-API-Key
Content-Type: application/json
```

### MVP chưa support

```text
multipart
binary
streaming
complex cookie jar
third-party OAuth provider token refresh
WebSocket
```

---

## 9.4 ResponseMapping

### Purpose

Cho phép platform hiểu response chatbot một cách linh hoạt, không khóa cứng theo một schema.

### Standard components optional

```text
answer
suggestions
intent
confidence
sources
retrieval
memory
rewrite
agent
tool
toolCalls
traceId
latency
error
raw
```

### Fields

```text
id
targetId
answerPath
suggestionsPath
intentPath
confidencePath
sourcesPath
retrievalPath
memoryPath
rewritePath
agentPath
toolPath
toolCallsPath
traceIdPath
latencyPath
customComponentsJson
missingFieldBehavior
createdAt
updatedAt
```

### Custom component example

```json
{
  "componentName": "business_category",
  "path": "metadata.business_category",
  "type": "string"
}
```

### Missing field behavior

Nếu field/component không tồn tại:

```text
FAIL
SKIP
WARNING
```

MVP nên cho cấu hình ở target level, default là `FAIL` với required assertion và `WARNING` với optional mapping.

---

## 9.5 ResponseSnapshot

### Purpose

Ảnh chụp response sau khi chatbot trả về và được normalize theo ResponseMapping.

### Fields

```text
rawResponse
normalizedComponents
extractedFields
extractedToolCalls
latency
error
trace
```

### Example

```json
{
  "components": {
    "answer": "Bạn có thể đặt lại mật khẩu trong phần Cài đặt.",
    "intent": "reset_password",
    "suggestions": [
      {
        "title": "Mở phần Cài đặt",
        "action": "open_settings"
      }
    ],
    "toolCalls": [
      {
        "name": "get_password_policy",
        "arguments": {
          "locale": "vi"
        },
        "output": {
          "policy": "reset allowed"
        }
      }
    ],
    "latency": {
      "timeToFirstToken": 1.2,
      "timeToLastToken": 3.8
    }
  }
}
```

---

## 9.6 Dataset

### Purpose

Một bộ testcase thuộc project.

### Fields

```text
id
projectId
name
description
category
tags
defaultAssertions
defaultRubrics
createdBy
createdAt
updatedAt
enabled
archived
```

### Dataset examples

```text
Smoke Test
Full Regression
Refund Policy
Password Reset
Prompt Injection
RAG Grounding
Tool Call Validation
Vietnamese Tone
Navigation/CTA Test
Business Requirement Test
```

---

## 9.7 TestCase

### Purpose

Một tình huống kiểm thử.

TestCase nên nhẹ, phản ánh dữ liệu QC định nghĩa trước khi chạy.

### Fields

```text
id
externalId
datasetId
sectionName
name
description
input
expectedBehavior
referenceAnswer
variables
preconditions
tags
priority
enabled
source
generatedBy
generationPrompt
createdAt
updatedAt
```

### Mapping legacy CSV

```text
id -> externalId
section_name -> sectionName
custom_nlp_sample -> input
custom_nlp_expected_dialog -> expectedBehavior
```

### Notes

`expectedBehavior` là mô tả hành vi mong muốn, không nhất thiết là exact answer.

`referenceAnswer` chỉ dùng khi QC có câu trả lời mẫu cụ thể.

### Example

```json
{
  "externalId": "TC001",
  "sectionName": "AI Search Mode > KB PNL > Vinfast",
  "input": "VinFast VF 8 có mấy phiên bản?",
  "expectedBehavior": "Bot cần trả lời đúng thông tin về các phiên bản VF 8, không bịa thông tin ngoài nguồn.",
  "referenceAnswer": null,
  "tags": ["vinfast", "kb", "regression"],
  "priority": "P1"
}
```

---

# 10. Assertion Model

## 10.1 Core principle

Một testcase có thể có nhiều assertions.

Assertion mới là thứ target field/component.

```text
TestCase
  └── Assertion[]
```

### Assertion scopes

```text
FIELD
COMPONENT
MULTI_FIELD
WHOLE_RESPONSE
```

Tool call/agent/action dùng object riêng là `ToolExpectation`.

### Base fields

```text
id
testCaseId
scope
type
targetComponent
fieldPath
fieldPaths
expectedValue
rubricId
rubricOverride
threshold
weight
severity
enabled
createdAt
updatedAt
```

### Severity

```text
CRITICAL
MAJOR
MINOR
INFO
```

---

## 10.2 FieldAssertion

Chấm một field cụ thể.

Example:

```json
{
  "scope": "FIELD",
  "fieldPath": "components.answer",
  "type": "contains",
  "expectedValue": "mật khẩu"
}
```

---

## 10.3 ComponentAssertion

Chấm một component chuẩn đã được map.

Example:

```json
{
  "scope": "COMPONENT",
  "targetComponent": "intent",
  "type": "equals",
  "expectedValue": "reset_password"
}
```

Ưu tiên UI cho QC dùng component thay vì raw JSON path.

---

## 10.4 MultiFieldAssertion

Chấm nhiều field/component cùng lúc.

Use cases:

```text
answer phải nhất quán với sources
answer phải đúng intent
suggestions không mâu thuẫn với answer
tool output phải được phản ánh trong answer
```

Example:

```json
{
  "scope": "MULTI_FIELD",
  "targetComponents": ["answer", "sources"],
  "type": "llm_rubric",
  "rubric": "Answer phải dựa trên sources và không bịa thêm thông tin ngoài sources.",
  "threshold": 0.8
}
```

---

## 10.5 WholeResponseAssertion

Chấm toàn bộ response.

Dùng cho LLM judge tổng thể, nhưng không phải default.

Example:

```json
{
  "scope": "WHOLE_RESPONSE",
  "type": "llm_rubric",
  "rubric": "Đánh giá toàn bộ response theo business requirement. PASS nếu response đúng ý, an toàn, không bịa, và có đầy đủ thông tin cần thiết.",
  "threshold": 0.8
}
```

---

## 10.6 Supported assertion types MVP

### Text

```text
contains
not_contains
equals
not_equals
regex
```

### Number

```text
greater_than
less_than
between
```

### Boolean

```text
is_true
is_false
```

### Object/field

```text
field_exists
field_not_exists
```

### Array

```text
array_length_greater_than
array_contains
```

### LLM Judge

```text
llm_rubric
```

---

# 11. LLM Rubric Model

## 11.1 Important concept

Với `llm_rubric`, `expected` không phải là expected value ngắn.

`llm_rubric` dùng:

```text
rubric
threshold
optional expectedBehavior
optional referenceAnswer
optional groundTruth/context
```

### Example

```json
{
  "scope": "COMPONENT",
  "targetComponent": "answer",
  "type": "llm_rubric",
  "rubricId": "rubric_answer_quality_vi",
  "rubricOverride": "Ở case này, bot cũng phải nhắc người dùng không chia sẻ mật khẩu.",
  "threshold": 0.8
}
```

### Rubric example

```text
PASS nếu:
- Trả lời đúng trọng tâm.
- Không bịa thông tin.
- Có hướng dẫn hành động rõ ràng.
- Giọng văn phù hợp.

FAIL nếu:
- Trả lời sai chính sách.
- Thiếu thông tin quan trọng.
- Tự tạo link/chính sách không tồn tại.
- Lộ system prompt hoặc dữ liệu nội bộ.
```

---

## 11.2 Rubric Library

### Purpose

Cho phép QC tái sử dụng rubric dài.

### Fields

```text
id
scope
projectId
datasetId
name
description
category
language
content
defaultThreshold
createdBy
createdAt
updatedAt
archived
```

### Scopes

```text
GLOBAL
PROJECT
DATASET
TESTCASE_OVERRIDE
```

### Categories MVP

```text
ANSWER_QUALITY
POLICY_COMPLIANCE
NO_HALLUCINATION
SAFETY_REFUSAL
RAG_FAITHFULNESS
TOOL_OUTPUT_USAGE
SUGGESTION_RELEVANCE
VIETNAMESE_TONE
CLARIFYING_QUESTION
BUSINESS_ACCEPTANCE
```

### Merge rule

```text
base rubric
+ testcase-specific override
+ expectedBehavior/referenceAnswer nếu có
= final rubric gửi cho judge
```

---

# 12. Tool Expectation Model

## 12.1 Vì sao ToolExpectation cần vào MVP

Final answer không đủ để đánh giá chatbot nội bộ.

Bot có thể:

```text
trả lời nghe đúng nhưng không gọi tool
gọi sai tool
truyền sai arguments
gọi tool khi không nên gọi
gọi đúng tool nhưng không dùng output
route sai agent/action
```

Vì vậy tool/agent/action phải là object riêng.

---

## 12.2 ToolExpectation

### Fields

```text
id
testCaseId
expectationType
targetSource
toolName
agentName
argumentAssertions
sequence
minCalls
maxCalls
rubricId
rubricOverride
threshold
required
severity
enabled
createdAt
updatedAt
```

### targetSource

Tool data có thể đến từ nhiều nguồn:

```text
normalized_tool_calls
inferred_tool
inferred_agent
agent_steps
trace
custom_component
```

Không assume chatbot nào cũng trả `tool_calls`.

---

## 12.3 Expectation types MVP

```text
TOOL_MUST_BE_CALLED
TOOL_MUST_NOT_BE_CALLED
TOOL_ARGS_MATCH
TOOL_SEQUENCE_MATCH
TOOL_CALL_COUNT
TOOL_OUTPUT_USED_IN_ANSWER
AGENT_EQUALS
AGENT_NOT_EQUALS
AGENT_STEP_CONTAINS
```

---

## 12.4 Tool trace levels

### Level 0: Không có tool data

Chỉ có final answer.

Supported:

```text
answer assertions
whole-response rubric
```

Tool expectations sẽ `SKIPPED_WITH_REASON`.

### Level 1: Inferred agent/tool

Có inferred agent/tool hoặc agent steps.

Supported:

```text
AGENT_EQUALS
AGENT_NOT_EQUALS
AGENT_STEP_CONTAINS
TOOL_MUST_BE_CALLED ở mức inferred
TOOL_MUST_NOT_BE_CALLED ở mức inferred
```

### Level 2: Structured tool calls

Có `tool_calls[]`.

Supported:

```text
TOOL_MUST_BE_CALLED
TOOL_ARGS_MATCH
TOOL_CALL_COUNT
TOOL_SEQUENCE_MATCH
```

### Level 3: Tool call with output

Có tool output.

Supported:

```text
TOOL_OUTPUT_USED_IN_ANSWER
answer consistent with tool output
```

MVP support Level 1 và Level 2 nếu data có sẵn.

Level 3 support bằng LLM rubric optional.

---

## 12.5 ToolCall object

### Fields

```text
name
arguments
output
status
error
startedAt
finishedAt
latencyMs
raw
```

### Example

```json
{
  "name": "get_order_status",
  "arguments": {
    "order_id": "ORD-123"
  },
  "output": {
    "status": "shipping",
    "eta": "2026-06-20"
  },
  "status": "success",
  "latencyMs": 240
}
```

---

# 13. AI Testcase Generator

## 13.1 Purpose

Giảm thời gian QC tạo testcase và ground truth.

AI generator là một phần của MVP.

### Input

```text
projectId
datasetId
featureName
businessRequirement
policyContext
mockData
dbContext
language
count
categories
availableComponents
availableTools
defaultRubrics
existingTestcases
```

### Categories MVP

```text
happy_path
negative
edge_case
typo
no_accent
ambiguous
out_of_scope
prompt_injection
policy_boundary
safety
tool_call
suggestion
retrieval
```

### Output draft

```text
name
description
input
variables
expectedBehavior
referenceAnswer
category
priority
tags
suggestedAssertions
suggestedToolExpectations
reasoningForQC
```

### Rules

```text
AI-generated testcase chỉ là draft
QC phải review trước khi lưu
Draft có thể edit toàn bộ
AI không auto-run testcase chưa confirm
Hệ thống cảnh báo duplicate
Hệ thống cảnh báo nếu expectedBehavior có thể đang bịa policy
```

---

## 13.2 AI suggest assertions from expected

Ngoài generate testcase mới, platform cần hỗ trợ:

```text
AI Suggest Assertions from Expected
```

Flow:

```text
Import legacy testcase có input + expectedBehavior
        |
        v
AI đọc expectedBehavior
        |
        v
AI suggest assertions/tool expectations/rubric
        |
        v
QC review
        |
        v
Save vào testcase
```

Example:

```json
{
  "input": "VinFast VF 8 có mấy phiên bản?",
  "expectedBehavior": "Bot cần trả lời đúng thông tin về các phiên bản VF 8, không bịa thông tin ngoài nguồn.",
  "suggestedAssertions": [
    {
      "scope": "COMPONENT",
      "targetComponent": "answer",
      "type": "llm_rubric",
      "rubric": "Bot phải trả lời đúng expectedBehavior, không bịa thêm thông tin ngoài dữ liệu có sẵn. Nếu thiếu thông tin, bot cần nói rõ không đủ dữ liệu.",
      "threshold": 0.8
    },
    {
      "scope": "COMPONENT",
      "targetComponent": "answer",
      "type": "not_contains",
      "expectedValue": "system prompt"
    }
  ]
}
```

---

# 14. Legacy Import

## 14.1 Purpose

Cho QC migrate nhanh từ file Excel/CSV hiện tại sang platform mới.

### MVP import

MVP support import 4 cột testcase gốc:

```text
id
section_name
custom_nlp_sample
custom_nlp_expected_dialog
```

### Mapping

```text
id -> TestCase.externalId
section_name -> TestCase.sectionName
custom_nlp_sample -> TestCase.input
custom_nlp_expected_dialog -> TestCase.expectedBehavior
```

### Import flow

```text
QC upload CSV/Excel
        |
        v
Platform preview columns
        |
        v
QC confirm mapping
        |
        v
Platform tạo Dataset + TestCases
        |
        v
Optional: AI suggest assertions from expected
```

### Section behavior

`section_name` trong MVP nên map thành `TestCase.sectionName`.

UI cần hỗ trợ:

```text
filter by sectionName
group by sectionName
run selected section
view pass rate by section
```

Phase sau có thể cho convert section thành dataset riêng nếu cần.

---

# 15. Run & Evaluation Model

## 15.1 Run

### Fields

```text
id
projectId
datasetId
targetId
status
runMode
includeLlmJudge
includeToolExpectations
maxConcurrency
timeoutMs
retryCount
triggeredBy
startedAt
finishedAt
summary
configSnapshot
artifactPath
createdAt
```

### Status

```text
PENDING
RUNNING
COMPLETED
FAILED
CANCELLED
```

### Run modes

```text
SAMPLE
FULL_DATASET
SELECTED_CASES
FAILED_CASES
SELECTED_SECTION
```

---

## 15.2 ResponseContext

### Purpose

Chuẩn hóa dữ liệu cần chấm.

### Fields

```text
testCase
target
requestSnapshot
rawResponse
responseSnapshot
components
toolCalls
latency
trace
error
```

### Responsibilities

```text
cung cấp data cho evaluators
giúp evaluator không parse raw JSON lặp lại
cho report render actual values
```

---

## 15.3 Evaluator abstraction

### Interface concept

```text
evaluate(assertionOrExpectation, responseContext) -> EvaluationResult
```

### Concrete evaluators

```text
TextAssertionEvaluator
NumberAssertionEvaluator
BooleanAssertionEvaluator
ArrayAssertionEvaluator
FieldExistenceEvaluator
ComponentAssertionEvaluator
LlmRubricEvaluator
ToolExpectationEvaluator
WholeResponseEvaluator
```

### Why OOP matters

Thêm assertion mới không cần sửa toàn bộ runner.

Chỉ cần thêm:

```text
new assertion type
new evaluator
mapping trong EvaluatorFactory
mapping trong PromptfooAdapter nếu cần
```

---

## 15.4 PromptfooAdapter

### Purpose

Convert domain objects sang promptfoo config.

### Responsibilities

```text
convert Target thành provider/custom provider
convert TestCase thành promptfoo test
convert Assertion thành promptfoo assert
convert ToolExpectation thành JS assertion/internal evaluator
convert Rubric thành llm-rubric
parse promptfoo output thành TestResult/AssertionResult
lưu generated config snapshot
```

### Important rule

Promptfoo config là generated artifact, không phải source of truth.

---

# 16. Result & Manual Review

## 16.1 TestResult

### Fields

```text
id
runId
testCaseId
status
score
requestSnapshot
rawResponse
responseSnapshot
extractedComponents
extractedToolCalls
latencyMs
errorMessage
createdAt
```

---

## 16.2 AssertionResult

### Fields

```text
id
testResultId
assertionId
status
actualValue
expectedValue
reason
score
severity
metadata
createdAt
```

---

## 16.3 ToolExpectationResult

### Fields

```text
id
testResultId
toolExpectationId
status
expectedToolName
actualToolCalls
actualAgent
actualSteps
reason
score
metadata
createdAt
```

---

## 16.4 ManualReview

### Purpose

Tách auto evaluation và QC final review.

### Fields

```text
id
testResultId
autoStatus
autoReason
reviewedStatus
reviewerNote
reviewedBy
reviewedAt
finalStatus
createdAt
updatedAt
```

### Status values

```text
PASSED
FAILED
ERROR
SKIPPED
UNCERTAIN
```

### Final status rule

```text
if reviewedStatus exists:
    finalStatus = reviewedStatus
else:
    finalStatus = autoStatus
```

Report phải hiển thị rõ:

```text
Auto result
Manual review result
Final result
```

---

# 17. UI Requirements

## 17.1 Project List

Displays:

```text
Project name
Owner
Dataset count
Last run status
Last pass rate
Updated at
```

Actions:

```text
Create project
Open project
Archive project
```

---

## 17.2 Project Detail

Tabs:

```text
Overview
Targets
Datasets
Rubrics
Runs
Settings
```

---

## 17.3 Target Setup

Sections:

```text
Paste cURL
Parsed Request
Secret Review
Input Binding
Variable Binding
Sample Run
Response Mapping
Tool Trace Mapping
```

### Response Mapping UI

After sample run, show response tree.

QC can map:

```text
answer -> path
suggestions -> path
intent -> path
confidence -> path
sources -> path
retrieval -> path
memory -> path
agent -> path
tool -> path
toolCalls -> path
traceId -> path
latency -> path
custom component -> path
```

Advanced:

```text
manual field path input
component type selection
missing field behavior
```

---

## 17.4 Dataset Detail

Sections:

```text
Testcase table
AI Generate Testcases
Import CSV/Excel
Run Dataset
```

Columns:

```text
External ID
Section
Name/Input preview
Expected behavior preview
Priority
Tags
Assertions count
Tool expectations count
Last status
Enabled
```

Actions:

```text
Filter by section
Group by section
Run selected section
Run selected testcases
Run failed cases
AI suggest assertions
```

---

## 17.5 TestCase Editor

Sections:

```text
Basic Info
Input
Expected Behavior
Reference Answer optional
Variables
Preconditions
Assertions
Tool Expectations
Tags / Priority
Review History
```

---

## 17.6 Assertion Builder

QC chooses target scope:

```text
One field
Response component
Multiple fields/components
Whole response
```

For field/component assertion:

```text
Target field/component
Assertion type
Expected value
Severity
Weight
Enabled
```

For LLM rubric:

```text
Target field/component/multiple components
Rubric mode
Rubric selector
Rubric textarea
Override textarea
Threshold
Use expectedBehavior toggle
Use referenceAnswer toggle
Judge model
Enabled
```

---

## 17.7 Tool Expectation Builder

Expectation types:

```text
Tool must be called
Tool must not be called
Tool args match
Tool sequence match
Tool call count
Tool output used in answer
Agent equals
Agent not equals
Agent step contains
```

Fields:

```text
Target source
Tool name
Agent name
Argument checks
Sequence
Min calls
Max calls
Rubric optional
Severity
Enabled
```

---

## 17.8 AI Testcase Generator

Input:

```text
Feature / Intent
Business Requirement
Policy Context
Mock Data
DB Context
Language
Number of Cases
Categories
Available Components
Available Tools
Default Rubrics
```

Output table:

```text
Name
Input
Expected Behavior
Category
Priority
Suggested assertions
Suggested tool expectations
Reasoning for QC
Selected
```

Actions:

```text
Edit draft
Delete draft
Regenerate
Add selected to dataset
```

---

## 17.9 Run Report

Sections:

```text
Run Summary
Failed / Uncertain Cases
Testcase Table
Assertion Breakdown
Tool Expectation Breakdown
Raw Request / Response
Normalized Components
Extracted Tool Calls
Manual Review
Diff with Previous Run
Artifacts
```

Report should answer:

```text
Fail vì field nào?
Fail vì assertion nào?
Actual value là gì?
Expected value/rubric là gì?
Bot có gọi đúng tool không?
Bot có dùng đúng source/tool output không?
Auto judge nói gì?
QC đã override chưa?
```

---

# 18. API Draft

## 18.1 Project APIs

```http
POST /api/projects
GET /api/projects
GET /api/projects/{projectId}
PUT /api/v1/projects/{projectId}
PATCH /api/v1/projects/{projectId}/archive
```

## 18.2 Target APIs

```http
POST /api/v1/projects/{projectId}/targets/parse-curl
POST /api/v1/projects/{projectId}/targets
GET /api/v1/projects/{projectId}/targets
GET /api/v1/targets/{targetId}
PUT /api/v1/targets/{targetId}
DELETE /api/v1/targets/{targetId}
GET /api/v1/targets/{targetId}/response-mapping
PUT /api/v1/targets/{targetId}/response-mapping

# Roadmap, not current implementation:
# POST /api/v1/targets/{targetId}/sample-run
# PUT /api/v1/targets/{targetId}/bindings
```

## 18.3 Dataset APIs

```http
POST /api/projects/{projectId}/datasets
GET /api/projects/{projectId}/datasets
GET /api/datasets/{datasetId}
PUT /api/datasets/{datasetId}
DELETE /api/datasets/{datasetId}
```

## 18.4 TestCase APIs

```http
POST /api/datasets/{datasetId}/testcases
GET /api/datasets/{datasetId}/testcases
GET /api/testcases/{testCaseId}
PUT /api/testcases/{testCaseId}
DELETE /api/testcases/{testCaseId}

POST /api/datasets/{datasetId}/testcases/import/preview
POST /api/datasets/{datasetId}/testcases/import/confirm
POST /api/datasets/{datasetId}/testcases/ai-suggest-assertions
```

## 18.5 Assertion APIs

```http
POST /api/testcases/{testCaseId}/assertions
POST /api/assertions/batch
PUT /api/assertions/{assertionId}
DELETE /api/assertions/{assertionId}
```

## 18.6 Tool Expectation APIs

```http
POST /api/testcases/{testCaseId}/tool-expectations
PUT /api/tool-expectations/{expectationId}
DELETE /api/tool-expectations/{expectationId}
```

## 18.7 Rubric APIs

```http
POST /api/projects/{projectId}/rubrics
GET /api/projects/{projectId}/rubrics
GET /api/rubrics/global
PUT /api/rubrics/{rubricId}
DELETE /api/rubrics/{rubricId}
POST /api/rubrics/ai-generate
```

## 18.8 AI Generator APIs

```http
POST /api/datasets/{datasetId}/ai-generate-testcases
POST /api/generated-testcases/{draftBatchId}/confirm
```

## 18.9 Run APIs

```http
POST /api/runs
GET /api/runs/{runId}
GET /api/runs/{runId}/results
POST /api/runs/{runId}/cancel
POST /api/runs/{runId}/rerun-failed
POST /api/runs/{runId}/review
```

---

# 19. Database Tables MVP

```text
projects
targets
response_mappings
datasets
test_cases
assertions
tool_expectations
rubrics
runs
test_results
assertion_results
tool_expectation_results
manual_reviews
artifacts
secrets
users
```

## 19.1 test_cases

```text
id
external_id
dataset_id
section_name
name
description
input
expected_behavior
reference_answer
variables
preconditions
tags
priority
enabled
source
generated_by
generation_prompt
created_at
updated_at
```

## 19.2 response_mappings

```text
id
target_id
answer_path
suggestions_path
intent_path
confidence_path
sources_path
retrieval_path
memory_path
rewrite_path
agent_path
tool_path
tool_calls_path
trace_id_path
latency_path
custom_components
missing_field_behavior
created_at
updated_at
```

## 19.3 assertions

```text
id
test_case_id
scope
type
target_component
field_path
field_paths
expected_value
rubric_id
rubric_override
threshold
weight
severity
enabled
created_at
updated_at
```

## 19.4 tool_expectations

```text
id
test_case_id
expectation_type
target_source
tool_name
agent_name
argument_assertions
sequence
min_calls
max_calls
rubric_id
rubric_override
threshold
required
severity
enabled
created_at
updated_at
```

## 19.5 test_results

```text
id
run_id
test_case_id
status
score
request_snapshot
raw_response
response_snapshot
extracted_components
extracted_tool_calls
latency_ms
error_message
created_at
```

## 19.6 manual_reviews

```text
id
test_result_id
auto_status
auto_reason
reviewed_status
reviewer_note
reviewed_by
reviewed_at
final_status
created_at
updated_at
```

---

# 20. Security Requirements

## 20.1 Secret handling

```text
Không lưu plain secret.
Secret phải encrypted hoặc dùng secret reference.
UI luôn mask secret.
Logs phải redact secret.
Artifacts phải redact secret.
Hash chỉ dùng để fingerprint, không dùng thay thế encryption.
```

## 20.2 SSRF protection

Vì QC paste cURL, runner có thể bị lợi dụng gọi URL không mong muốn.

MVP cần:

```text
domain allowlist
block localhost/internal metadata URL nếu không explicitly allow
block private network ranges nếu không được cấu hình
validate protocol http/https
```

## 20.3 No raw code for QC

MVP không expose raw JavaScript assertion cho QC.

QC dùng assertion builder.

Custom code assertion chỉ dành cho admin/dev ở phase sau.

---

# 21. Execution & Performance Requirements

## 21.1 Async run

Run chạy async qua Redis queue.

Frontend không chờ HTTP request hoàn tất.

## 21.2 Defaults

```text
maxConcurrency: 3-5
timeoutMs: 30000
retryCount: 0 hoặc 1
includeLlmJudge: configurable
includeToolExpectations: configurable
```

## 21.3 LLM judge cost control

MVP cần:

```text
toggle LLM judge on/off
show count of LLM rubric assertions before run
allow run without LLM judge for smoke test
allow run only rule-based assertions
```

## 21.4 Failure handling

Nếu chatbot API fail:

```text
test_result.status = ERROR
assertions = SKIPPED
reason = API error/timeout
```

Nếu mapped field missing:

```text
behavior = FAIL / SKIP / WARNING tùy config
```

---

# 22. MVP Acceptance Criteria

MVP hoàn thành khi:

1. QC tạo được Project.
2. QC paste cURL tạo Target.
3. Backend parse được method, URL, headers, JSON body.
4. Secret được mask/encrypt.
5. QC chọn được input binding.
6. QC run sample request.
7. UI hiển thị response tree.
8. QC cấu hình response mapping linh hoạt.
9. QC cấu hình tool trace mapping nếu chatbot có expose.
10. QC tạo được Dataset.
11. QC import được legacy CSV/Excel với 4 cột testcase gốc.
12. `section_name` được lưu thành `TestCase.sectionName`.
13. QC filter/group/run testcase theo section.
14. QC tạo được TestCase thủ công.
15. QC dùng AI generate testcase draft.
16. AI draft có suggested assertions.
17. AI draft có suggested tool expectations nếu có available tools/components.
18. QC review và add draft vào dataset.
19. QC dùng AI suggest assertions từ expectedBehavior.
20. QC tạo được field/component assertions.
21. QC tạo được multi-field LLM rubric assertion.
22. QC tạo được whole-response LLM rubric assertion.
23. QC tạo được tool expectations.
24. QC tạo và reuse Rubric.
25. QC run full dataset async.
26. QC run selected section async.
27. Runner chạy promptfoo.
28. Backend lưu Run/TestResult/AssertionResult/ToolExpectationResult.
29. Report hiển thị assertion breakdown.
30. Report hiển thị tool expectation breakdown.
31. Report hiển thị raw response đã redact.
32. Report hiển thị normalized response components.
33. Report hiển thị manual review layer.
34. QC có thể review/override final status.
35. Có thể rerun failed cases.
36. Mỗi run lưu config snapshot.
37. Promptfoo config là generated artifact, không phải source of truth.

---

# 23. Roadmap

## Phase 1 — MVP

```text
single-turn JSON chatbot API
cURL import
legacy CSV/Excel import
request template
input binding
response mapping
tool trace mapping
AI testcase generator
AI suggest assertions from expected
assertion builder
tool expectation builder
rubric library
promptfoo runner
run report
manual review layer
```

## Phase 1.5

```text
better CSV/Excel export
AI rubric generator
semantic testcase deduplication
dataset-level default assertions
dataset-level default tool expectations
better run diff
judge cost tracking
promptfoo config download
human review dashboard
```

## Phase 2

```text
multi-turn conversation
conversation step assertions
session state management
advanced tool sequence validation
RAG-specific assertion templates
scheduled runs
notifications
```

## Phase 3

```text
CI/CD integration
pull request gating
distributed runner
S3/MinIO artifact storage
advanced RBAC
approval workflow
red team test suite templates
trace provider integration
```

---

# 24. Key Design Decisions

1. File CSV hiện tại chỉ là tham khảo.
2. Testcase gốc hiện tại chỉ gồm 4 cột: id, section_name, input, expected.
3. Các cột actual/eval/latency trong file là result, không phải testcase.
4. Platform phải support flexible response mapping.
5. TestCase mô tả scenario, không target field trực tiếp.
6. Assertion target field/component/multi-field/whole-response.
7. ToolExpectation là object riêng, không nhét vào text assertion.
8. Rubric là reusable object.
9. LLM rubric không dùng expected value ngắn; nó dùng rubric + threshold + expectedBehavior/referenceAnswer nếu có.
10. AI-generated testcase là draft, QC phải confirm.
11. AI suggest assertions từ expectedBehavior là MVP.
12. Manual review phải tách khỏi auto evaluation.
13. Promptfoo là adapter/runner, không phải source of truth.
14. MVP support tool testing theo mức data chatbot expose.
15. Nếu chatbot không expose tool trace, tool expectations phải skip/warning rõ ràng.
16. No raw JavaScript assertion cho QC ở MVP.
17. Security và secret handling phải chốt từ đầu.

---

# 25. Product Summary

Platform này không chỉ là UI bọc promptfoo.

Nó là một hệ thống QC automation cho chatbot với các capability chính:

```text
AI-assisted testcase generation
Legacy testcase import
Flexible chatbot API target setup
Response component mapping
Structured field/component assertions
Tool expectation testing
Reusable rubric library
LLM-as-judge with controlled scope
Async evaluation runner
Assertion-level report
Manual review workflow
Regression-ready run history
```

Điểm khác biệt lớn nhất so với tool hiện tại:

```text
Tool hiện tại:
Excel + chatbot API call + LLM all-in-one judge + QC review từng dòng

Platform mới:
Dataset trong hệ thống
+ AI generate testcase
+ import legacy testcase
+ response mapping linh hoạt
+ field/component-aware assertions
+ tool expectations
+ rubric reuse
+ assertion breakdown
+ manual review layer
```

MVP cần đủ mạnh để QC thay thế phần lớn luồng Excel hiện tại, nhưng kiến trúc vẫn mở để sau này thêm multi-turn, CI/CD, scheduled run, distributed runner, trace integration và advanced red-team testing.
