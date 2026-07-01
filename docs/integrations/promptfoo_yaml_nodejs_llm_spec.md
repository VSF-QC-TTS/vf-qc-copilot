# Promptfoo YAML & Node.js Integration Guide for AI TestHub

> Purpose: This document explains how `promptfooconfig.yaml` works, what fields it contains, how promptfoo runs an evaluation, and how to integrate promptfoo through Node.js for the AI TestHub platform.
>
> Audience: Another LLM, backend engineer, runner engineer, or technical product owner who needs to understand promptfoo enough to design or implement a wrapper platform.
>
> Context: AI TestHub is an internal chatbot QA automation platform. It stores its own domain objects such as Project, Target, Dataset, TestCase, Assertion, ToolExpectation, Rubric, Run, and TestResult. Promptfoo is used as an evaluation runner/adapter, not as the source of truth.

---

## 1. What promptfoo is

Promptfoo is an evaluation framework for LLM/chatbot/agent systems.

It can:

- define prompts
- define providers/targets
- define test cases
- substitute variables into prompts
- call one or more providers
- collect outputs
- run assertions
- compute pass/fail/score
- export results
- show results in CLI or web UI
- be used through CLI or Node.js

The most common configuration file is:

```yaml
promptfooconfig.yaml
```

At a high level:

```text
promptfooconfig.yaml
  -> prompts
  -> providers / targets
  -> tests
  -> assertions
  -> evaluation options
  -> promptfoo eval runner
  -> provider outputs
  -> assertion results
  -> evaluation summary
```

---

## 2. Core mental model

Promptfoo runs a matrix of:

```text
prompts x providers x tests
```

For example:

```yaml
prompts:
  - "Answer this: {{question}}"

providers:
  - openai:gpt-5-mini
  - anthropic:messages:claude-sonnet-4-5

tests:
  - vars:
      question: "What is 2 + 2?"
  - vars:
      question: "What is the capital of France?"
```

This creates:

```text
1 prompt x 2 providers x 2 tests = 4 evaluations
```

Each evaluation:

1. Takes a prompt template.
2. Takes test variables from `tests[].vars`.
3. Renders variables into the prompt.
4. Calls the provider.
5. Receives output.
6. Runs assertions.
7. Produces score/pass/fail/reason.

---

## 3. Why this matters for AI TestHub

AI TestHub should not expose raw promptfoo YAML to QC users.

Instead, AI TestHub should keep its own domain model:

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
TestResult
```

Then the Node.js runner converts these domain objects into promptfoo config at run time.

Recommended architecture:

```text
AI TestHub Domain Objects
        |
        v
PromptfooAdapter
        |
        v
promptfoo testSuite object or promptfooconfig.yaml
        |
        v
promptfoo.evaluate(...)
        |
        v
EvaluateSummary
        |
        v
AI TestHub TestResult / AssertionResult / ToolExpectationResult
```

Promptfoo config should be treated as a generated artifact, not the source of truth.

---

## 4. Main YAML structure

The main shape of `promptfooconfig.yaml` is:

```yaml
description: "Optional description of this eval suite"

tags:
  env: staging
  application: chatbot

prompts:
  - "Answer the user: {{input}}"

providers:
  - openai:gpt-5-mini

tests:
  - description: "Basic greeting"
    vars:
      input: "Hello"
    assert:
      - type: contains
        value: "Hello"

defaultTest:
  assert:
    - type: not-contains
      value: "system prompt"

outputPath: ./results.json

evaluateOptions:
  maxConcurrency: 4
  repeat: 1
  timeoutMs: 30000
  cache: true
```

The most important fields are:

```text
description
tags
prompts
providers / targets
tests
defaultTest
assert
outputPath
evaluateOptions
env
extensions
metadata
writeLatestResults
commandLineOptions
```

---

## 5. Top-level fields

### 5.1 `description`

Optional human-readable description of the evaluation.

```yaml
description: "Evaluate password reset chatbot behavior"
```

Use it to explain what this eval suite is testing.

---

### 5.2 `tags`

Optional key-value metadata for the test suite.

```yaml
tags:
  project: ai-testhub
  env: staging
  dataset: smoke
  chatbot: vinfast-assistant
```

Useful for filtering and organizing runs.

In AI TestHub, these can be generated from:

```text
Project.name
Target.environment
Dataset.name
Run.id
```

---

### 5.3 `prompts`

Defines one or more prompt templates.

```yaml
prompts:
  - "User says: {{input}}"
```

Prompt variables use double curly braces:

```text
{{input}}
{{question}}
{{language}}
{{user_id}}
```

Values come from `tests[].vars`.

For AI TestHub chatbot API testing, prompts may be very simple because the real prompt is not the chatbot system prompt. The "prompt" is just the testcase input passed to the provider.

Recommended prompt for API chatbot testing:

```yaml
prompts:
  - "{{input}}"
```

Then the provider uses the rendered prompt as the user message.

Promptfoo supports multiple prompts:

```yaml
prompts:
  - "{{input}}"
  - "Please answer the following user query: {{input}}"
```

But in AI TestHub MVP, usually use one prompt per run.

---

### 5.4 `providers`

Providers are the systems being called.

Examples:

```yaml
providers:
  - openai:gpt-5-mini
  - anthropic:messages:claude-sonnet-4-5
```

For AI TestHub, the provider should usually be the internal chatbot API.

There are three common approaches:

#### Approach A: HTTP provider

Use promptfoo HTTP provider to call chatbot API directly.

Concept:

```yaml
providers:
  - id: http
    config:
      url: "https://chatbot.example.com/api/chat"
      method: POST
      headers:
        Content-Type: application/json
        Authorization: "Bearer {{CHATBOT_API_KEY}}"
      body:
        message: "{{prompt}}"
```

Good for simple APIs.

#### Approach B: Custom JavaScript provider

Use a JS provider function to call chatbot API.

Better for AI TestHub because:

- request templates are dynamic
- secrets need redaction
- response normalization is custom
- tool call extraction may be custom
- runner needs full control over returned metadata

Concept:

```ts
providers: [
  async (prompt, context) => {
    const response = await callChatbotApi({
      input: prompt,
      vars: context.vars,
      target: context.config.target,
    });

    return {
      output: JSON.stringify(response.body),
      metadata: {
        statusCode: response.statusCode,
        latencyMs: response.latencyMs,
      },
    };
  }
]
```

#### Approach C: Provider file

Define a provider in a separate JS/TS file and reference it.

Useful if using promptfoo CLI.

```yaml
providers:
  - file://./providers/chatbot-provider.js
```

For AI TestHub, Approach B or C is preferred over simple HTTP provider.

---

### 5.5 `targets`

`targets` is an alias for `providers`.

Use either:

```yaml
providers:
  - openai:gpt-5-mini
```

or:

```yaml
targets:
  - openai:gpt-5-mini
```

Do not set both at the same time.

For AI TestHub, prefer `providers` in generated eval configs unless red-team config convention requires `targets`.

---

### 5.6 `tests`

Defines test cases.

A test case usually has:

```yaml
tests:
  - description: "Password reset - normal query"
    vars:
      input: "Tôi quên mật khẩu thì làm sao?"
      expectedBehavior: "Bot should explain how to reset password safely."
    assert:
      - type: contains
        value: "mật khẩu"
```

Core fields inside a test:

```text
description
vars
assert
metadata
threshold
provider
providers
prompts
providerOutput
options
```

#### `description`

Human-readable name of the test.

AI TestHub mapping:

```text
TestCase.name or TestCase.externalId + sectionName
```

#### `vars`

Variables substituted into prompt and available to assertions/providers.

AI TestHub mapping:

```text
TestCase.input -> vars.input
TestCase.expectedBehavior -> vars.expectedBehavior
TestCase.referenceAnswer -> vars.referenceAnswer
TestCase.variables -> vars.*
TestCase.externalId -> vars.externalId
TestCase.sectionName -> vars.sectionName
```

Example:

```yaml
vars:
  input: "VinFast VF 8 có mấy phiên bản?"
  expectedBehavior: "Bot must answer correctly and not hallucinate."
  externalId: "TC001"
  sectionName: "AI Search Mode > KB PNL > Vinfast"
```

#### `assert`

Array of assertions for this test.

One testcase can have many assertions:

```yaml
assert:
  - type: contains
    value: "mật khẩu"

  - type: not-contains
    value: "system prompt"

  - type: javascript
    value: |
      const r = JSON.parse(output);
      return r.intent === "reset_password";
```

This is important for AI TestHub because one testcase may check:

```text
answer
intent
suggestions
sources
agent
tool
latency
whole response quality
```

#### `metadata`

Filterable metadata.

AI TestHub mapping:

```yaml
metadata:
  externalId: "TC001"
  sectionName: "AI Search Mode > KB PNL > Vinfast"
  priority: "P1"
  tags:
    - vinfast
    - regression
```

#### `threshold`

Minimum combined score needed for test pass.

```yaml
threshold: 0.8
```

AI TestHub may generate threshold from assertion weights/severity.

#### `providerOutput`

Precomputed provider output. If set, promptfoo can run assertions without calling the provider.

Useful for:

- replaying old chatbot responses
- debugging assertions
- evaluating imported historical results
- running unit tests for evaluator logic

Example:

```yaml
tests:
  - description: "Replay existing output"
    vars:
      input: "Hello"
    providerOutput:
      answer: "Hello! How can I help?"
    assert:
      - type: javascript
        value: |
          const r = typeof output === 'string' ? JSON.parse(output) : output;
          return r.answer.includes('Hello');
```

#### `options.transform`

Transforms provider output before assertions.

Useful if provider returns a full JSON response but assertions should run only on `answer`.

Example:

```yaml
options:
  transform: |
    const r = JSON.parse(output);
    return r.answer;
```

AI TestHub may prefer doing normalization in its own runner instead of relying heavily on promptfoo transforms.

---

### 5.7 `defaultTest`

Defines properties inherited by all tests.

Example:

```yaml
defaultTest:
  assert:
    - type: not-contains
      value: "system prompt"
    - type: not-contains
      value: "API key"
```

Use cases:

- global safety assertions
- no system prompt leakage
- response must be JSON
- common rubric
- default metadata
- default provider options

AI TestHub mapping:

```text
Dataset.defaultAssertions
Project.defaultAssertions
Global safety rules
```

Important: A testcase can disable default asserts via options if needed.

Concept:

```yaml
tests:
  - description: "Special case"
    options:
      disableDefaultAsserts: true
```

---

### 5.8 `outputPath`

Where promptfoo writes result files.

Examples:

```yaml
outputPath: ./results.json
```

Multiple outputs:

```yaml
outputPath:
  - ./results.json
  - ./results.html
  - ./results.csv
```

AI TestHub should store output artifacts in local storage or object storage.

Recommended generated path:

```text
artifacts/runs/{runId}/promptfoo-results.json
artifacts/runs/{runId}/promptfoo-config.yaml
```

---

### 5.9 `sharing`

Controls result sharing.

For internal AI TestHub, generally keep off unless self-hosted promptfoo sharing is configured.

```yaml
sharing: false
```

---

### 5.10 `env`

Sets environment variables for the run.

Example:

```yaml
env:
  OPENAI_API_KEY: "${OPENAI_API_KEY}"
```

For AI TestHub, avoid writing secrets directly into generated configs.

Prefer:

```text
SecretRef
runtime env injection
runner secret resolver
redacted artifact writer
```

---

### 5.11 `evaluateOptions`

Controls evaluation execution.

Common fields:

```yaml
evaluateOptions:
  maxConcurrency: 4
  repeat: 1
  delay: 0
  cache: true
  timeoutMs: 30000
  maxEvalTimeMs: 600000
  showProgressBar: false
```

AI TestHub mapping:

```text
Run.maxConcurrency -> evaluateOptions.maxConcurrency
Run.repeat -> evaluateOptions.repeat
Run.timeoutMs -> evaluateOptions.timeoutMs
Run.cache -> evaluateOptions.cache
```

Recommended MVP defaults:

```yaml
evaluateOptions:
  maxConcurrency: 3
  repeat: 1
  timeoutMs: 30000
  cache: false
  showProgressBar: false
```

For CI or local debug, cache can be enabled.

---

### 5.12 `commandLineOptions`

Default CLI flags if using `npx promptfoo eval`.

Example:

```yaml
commandLineOptions:
  maxConcurrency: 10
  repeat: 3
  verbose: true
  cache: false
```

If using Node.js `evaluate()`, prefer passing options directly instead of relying on CLI options.

---

### 5.13 `extensions`

Hooks to run custom code before/after eval or each test.

Example:

```yaml
extensions:
  - file://./extensions/session.js:extensionHook
```

Supported lifecycle concepts include:

```text
beforeAll
afterAll
beforeEach
afterEach
```

Use cases:

- create a session before each test
- clean up a session after each test
- add metadata
- log trace IDs
- mutate test vars

For AI TestHub MVP, avoid overusing promptfoo extensions. Prefer explicit code in the Node runner where possible.

---

### 5.14 `metadata`

Arbitrary metadata stored with eval config.

Example:

```yaml
metadata:
  runId: "run_123"
  projectId: "project_abc"
  datasetId: "dataset_smoke"
```

AI TestHub should include run identifiers in metadata.

---

### 5.15 `derivedMetrics`

Metrics calculated after the eval from named assertion scores.

Example use cases:

- aggregate safety score
- aggregate answer quality score
- aggregate tool correctness score

This is useful later, but not mandatory for MVP.

---

### 5.16 `redteam`

Used for promptfoo red-team test generation and execution.

For AI TestHub MVP, this is out of scope.

Can be added in a later phase for:

- prompt injection
- jailbreak
- data exfiltration
- tool misuse
- system prompt leakage

---

## 6. Assertions

Assertions validate provider output.

Basic structure:

```yaml
assert:
  - type: contains
    value: "expected text"
```

General assertion fields:

```text
type
value
threshold
weight
provider
rubricPrompt
metric
transform
contextTransform
config
```

### 6.1 `type`

The assertion type.

Examples:

```text
contains
not-contains
equals
regex
is-json
javascript
python
llm-rubric
similar
cost
latency
```

AI TestHub MVP should support a safe subset in its UI:

```text
contains
not_contains
equals
not_equals
regex
greater_than
less_than
between
is_true
is_false
field_exists
field_not_exists
array_length_greater_than
array_contains
llm_rubric
```

These AI TestHub assertion types may be converted to promptfoo `javascript`, `contains`, `equals`, or `llm-rubric` assertions.

---

### 6.2 `value`

Expected value or rubric text, depending on assertion type.

Examples:

```yaml
- type: contains
  value: "Paris"
```

```yaml
- type: llm-rubric
  value: "Answer must be helpful, correct, and avoid hallucination."
```

For `llm-rubric`, `value` is not a short expected string. It is the grading rubric.

---

### 6.3 `threshold`

Minimum score required for pass.

Useful for numeric scoring assertions and model-graded assertions.

Example:

```yaml
- type: llm-rubric
  value: "Answer must be correct and concise."
  threshold: 0.8
```

---

### 6.4 `weight`

Relative importance of an assertion.

Example:

```yaml
- type: contains
  value: "mật khẩu"
  weight: 2
```

AI TestHub can map assertion severity to weight.

Example:

```text
critical -> high weight or hard fail
major -> medium weight
minor -> low weight
```

---

### 6.5 `metric`

Label for assertion result aggregation.

Example:

```yaml
- type: llm-rubric
  metric: answer_quality
  value: "Answer must be clear and correct."
```

Useful for dashboard metrics.

---

### 6.6 `transform`

Transforms output before the assertion runs.

Example:

```yaml
- type: contains
  transform: |
    const r = JSON.parse(output);
    return r.answer;
  value: "mật khẩu"
```

In AI TestHub, this can be generated from `ResponseMapping`.

If `targetComponent = answer`, generated transform can extract `components.answer`.

---

## 7. JavaScript assertions for JSON response

JavaScript assertions are very important for chatbot API testing.

Promptfoo injects `output` into the JS assertion.

Example:

```yaml
assert:
  - type: javascript
    value: |
      const r = JSON.parse(output);
      return r.intent === "reset_password";
```

If the JS returns:

```text
true -> pass
false -> fail
number -> score
object -> rich grading result if supported
throw Error -> fail with error reason
```

AI TestHub should not expose raw JavaScript to QC users in MVP.

Instead:

1. QC uses assertion builder.
2. Backend stores structured assertion.
3. Runner converts it into JS assertion or internal evaluator.

Example AI TestHub assertion:

```json
{
  "scope": "COMPONENT",
  "targetComponent": "intent",
  "type": "equals",
  "expectedValue": "reset_password"
}
```

Generated promptfoo assertion concept:

```yaml
- type: javascript
  value: |
    const r = JSON.parse(output);
    return r.components.intent === "reset_password";
```

---

## 8. LLM rubric assertions

`llm-rubric` uses an LLM judge to grade output against a natural-language rubric.

Use it when exact match is too brittle.

Good use cases:

```text
answer quality
helpfulness
policy compliance
no hallucination
safety refusal
RAG faithfulness
tone
business acceptance
tool output usage
```

Example:

```yaml
assert:
  - type: llm-rubric
    value: |
      PASS if the answer explains how to reset a password safely.
      FAIL if it asks the user to share their current password.
    threshold: 0.8
```

For AI TestHub:

```text
Rubric object -> promptfoo llm-rubric value
Rubric.defaultThreshold -> threshold
RubricOverride -> appended to rubric
TestCase.expectedBehavior -> included as grading context
```

Recommended final rubric generated by AI TestHub:

```text
You are grading a chatbot response.

User input:
{{input}}

Expected behavior:
{{expectedBehavior}}

Response component under evaluation:
{{answer}}

Rubric:
PASS if:
- The answer follows the expected behavior.
- The answer is correct and safe.
- The answer does not invent unsupported information.

FAIL if:
- The answer contradicts expected behavior.
- The answer leaks internal/system information.
- The answer fabricates facts, tools, policies, or links.
```

---

## 9. Assertion set

An assertion set groups assertions.

Concept:

```yaml
assert:
  - type: assert-set
    metric: safety
    threshold: 1
    assert:
      - type: not-contains
        value: "system prompt"
      - type: not-contains
        value: "API key"
```

Use cases:

```text
group safety assertions
group answer quality checks
group tool correctness checks
```

AI TestHub may not need to expose assertion sets in MVP, but can use them internally later.

---

## 10. Tool call testing

Promptfoo can test outputs and can run custom JS assertions over provider output.

For AI TestHub, tool call testing depends on what the chatbot API exposes.

Tool data levels:

```text
Level 0: no tool data, only final answer
Level 1: inferred agent/tool or agent steps
Level 2: structured tool_calls[]
Level 3: tool_calls[] with output
```

AI TestHub should normalize tool data into:

```json
{
  "toolCalls": [
    {
      "name": "get_order_status",
      "arguments": {
        "order_id": "ORD-123"
      },
      "output": {
        "status": "shipping"
      },
      "status": "success",
      "latencyMs": 240
    }
  ],
  "agent": "order_agent",
  "tool": "get_order_status",
  "agentSteps": "..."
}
```

Then generate JS assertions.

Example: tool must be called

```yaml
- type: javascript
  value: |
    const r = JSON.parse(output);
    const calls = r.components.toolCalls || [];
    return calls.some(c => c.name === "get_order_status");
```

Example: tool must not be called

```yaml
- type: javascript
  value: |
    const r = JSON.parse(output);
    const calls = r.components.toolCalls || [];
    return !calls.some(c => c.name === "refund_order");
```

Example: tool args match

```yaml
- type: javascript
  value: |
    const r = JSON.parse(output);
    const calls = r.components.toolCalls || [];
    const call = calls.find(c => c.name === "get_order_status");
    return call && call.arguments && call.arguments.order_id === "ORD-123";
```

Example: inferred agent equals

```yaml
- type: javascript
  value: |
    const r = JSON.parse(output);
    return r.components.agent === "local_source_search";
```

If tool data is missing, AI TestHub should mark the tool expectation as:

```text
SKIPPED_WITH_REASON
```

rather than failing the entire runner.

---

## 11. Example YAML for chatbot API testing

This is a conceptual generated YAML for one AI TestHub run.

```yaml
description: "AI TestHub generated run for chatbot QA"

tags:
  projectId: "project_123"
  datasetId: "dataset_456"
  runId: "run_789"
  env: "staging"

prompts:
  - "{{input}}"

providers:
  - file://./providers/chatbot-provider.js

defaultTest:
  assert:
    - type: javascript
      metric: no_system_prompt_leak
      value: |
        const r = JSON.parse(output);
        const text = JSON.stringify(r).toLowerCase();
        return !text.includes("system prompt") && !text.includes("api key");

tests:
  - description: "TC001 - Password reset"
    vars:
      externalId: "TC001"
      sectionName: "Auth > Password Reset"
      input: "Tôi quên mật khẩu thì làm sao?"
      expectedBehavior: "Bot should explain safe password reset and must not ask for the current password."
    metadata:
      priority: "P1"
      tags:
        - auth
        - password_reset
    assert:
      - type: javascript
        metric: answer_contains_keyword
        value: |
          const r = JSON.parse(output);
          return r.components.answer.includes("mật khẩu");

      - type: javascript
        metric: intent_correct
        value: |
          const r = JSON.parse(output);
          return r.components.intent === "reset_password";

      - type: javascript
        metric: no_password_leak
        value: |
          const r = JSON.parse(output);
          return !r.components.answer.toLowerCase().includes("mật khẩu hiện tại");

      - type: llm-rubric
        metric: answer_quality
        value: |
          User input: {{input}}
          Expected behavior: {{expectedBehavior}}

          Grade the chatbot answer.
          PASS if the answer explains safe password reset clearly.
          FAIL if it asks the user to reveal their current password.
        threshold: 0.8

evaluateOptions:
  maxConcurrency: 3
  repeat: 1
  timeoutMs: 30000
  cache: false

outputPath:
  - "./artifacts/run_789/results.json"
  - "./artifacts/run_789/results.html"

writeLatestResults: false
sharing: false

metadata:
  generatedBy: "ai-testhub"
```

---

## 12. Node.js integration

Promptfoo can be used as a Node.js library.

Basic usage:

```ts
import promptfoo from 'promptfoo';

const evalRecord = await promptfoo.evaluate(testSuite, options);
const summary = await evalRecord.toEvaluateSummary();
```

`testSuite` is the JavaScript object equivalent of `promptfooconfig.yaml`.

`options` controls execution settings such as concurrency, caching, and output.

---

## 13. Minimal Node.js example

```ts
import promptfoo from 'promptfoo';

async function main() {
  const testSuite = {
    prompts: ['{{input}}'],
    providers: [
      async (prompt: string, context: any) => {
        return {
          output: JSON.stringify({
            components: {
              answer: `Echo: ${prompt}`,
              intent: 'echo',
            },
          }),
        };
      },
    ],
    tests: [
      {
        description: 'Echo test',
        vars: {
          input: 'Hello',
        },
        assert: [
          {
            type: 'javascript',
            value: `
              const r = JSON.parse(output);
              return r.components.answer.includes('Hello');
            `,
          },
        ],
      },
    ],
    writeLatestResults: false,
  };

  const evalRecord = await promptfoo.evaluate(testSuite, {
    maxConcurrency: 2,
  });

  const summary = await evalRecord.toEvaluateSummary();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## 14. Recommended AI TestHub Node runner flow

The runner should not build YAML by hand for every call unless needed.

Recommended flow:

```text
1. Receive run job from Redis.
2. Fetch RunSnapshot from Spring Boot API.
3. Build in-memory promptfoo testSuite object.
4. Run promptfoo.evaluate(testSuite, evaluateOptions).
5. Convert EvaluateSummary to AI TestHub result DTO.
6. Save raw artifacts.
7. Send results back to Spring Boot.
```

Pseudo-code:

```ts
import promptfoo from 'promptfoo';
import { fetchRunSnapshot, submitRunResults } from './apiClient';
import { buildPromptfooTestSuite } from './promptfoo/PromptfooConfigBuilder';
import { parsePromptfooSummary } from './promptfoo/PromptfooResultParser';
import { writeArtifacts } from './artifacts/ArtifactWriter';

export async function handleRunJob(job: { runId: string }) {
  const snapshot = await fetchRunSnapshot(job.runId);

  const testSuite = buildPromptfooTestSuite(snapshot);

  const evalRecord = await promptfoo.evaluate(testSuite, {
    maxConcurrency: snapshot.run.maxConcurrency ?? 3,
  });

  const summary = await evalRecord.toEvaluateSummary();

  await writeArtifacts(snapshot.run.id, {
    testSuite,
    summary,
  });

  const resultPayload = parsePromptfooSummary(snapshot, summary);

  await submitRunResults(snapshot.run.id, resultPayload);
}
```

---

## 15. RunSnapshot input from backend

Spring Boot should send runner a complete immutable run snapshot.

Example:

```json
{
  "run": {
    "id": "run_789",
    "maxConcurrency": 3,
    "timeoutMs": 30000,
    "includeLlmJudge": true,
    "includeToolExpectations": true
  },
  "target": {
    "id": "target_123",
    "method": "POST",
    "url": "https://chatbot.internal/api/chat",
    "headersTemplate": {
      "Authorization": "Bearer {{secret.CHATBOT_API_KEY}}",
      "Content-Type": "application/json"
    },
    "bodyTemplate": {
      "message": "{{input}}",
      "user_id": "{{variables.user_id}}"
    },
    "inputBinding": {
      "targetPath": "body.message"
    }
  },
  "responseMapping": {
    "answerPath": "answer",
    "intentPath": "intent",
    "toolCallsPath": "metadata.tool_calls",
    "latencyPath": "metadata.latency_ms"
  },
  "dataset": {
    "id": "dataset_456",
    "name": "Smoke Test"
  },
  "testCases": [
    {
      "id": "tc_1",
      "externalId": "TC001",
      "sectionName": "Auth > Password Reset",
      "input": "Tôi quên mật khẩu thì làm sao?",
      "expectedBehavior": "Bot should explain safe password reset.",
      "variables": {
        "user_id": "test_user_001"
      },
      "assertions": [
        {
          "id": "as_1",
          "scope": "COMPONENT",
          "targetComponent": "answer",
          "type": "contains",
          "expectedValue": "mật khẩu"
        }
      ],
      "toolExpectations": []
    }
  ],
  "rubrics": []
}
```

---

## 16. Provider design for AI TestHub

The provider should:

1. Render request template using prompt and vars.
2. Resolve secrets.
3. Apply SSRF/domain allowlist checks before calling URL.
4. Call chatbot API.
5. Measure latency.
6. Redact secrets from logs.
7. Return output as JSON string.
8. Include metadata if useful.

Pseudo-code:

```ts
export function createChatbotProvider(snapshot: RunSnapshot) {
  return async function chatbotProvider(prompt: string, context: any) {
    const testVars = context.vars;

    const request = renderRequestTemplate({
      target: snapshot.target,
      input: prompt,
      variables: testVars,
    });

    validateAllowedUrl(request.url);

    const started = Date.now();
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
    const latencyMs = Date.now() - started;

    const rawBody = await response.json();

    const responseSnapshot = normalizeResponse({
      rawResponse: rawBody,
      responseMapping: snapshot.responseMapping,
      latencyMs,
    });

    return {
      output: JSON.stringify(responseSnapshot),
      metadata: {
        statusCode: response.status,
        latencyMs,
        traceId: responseSnapshot.traceId,
      },
    };
  };
}
```

---

## 17. Building promptfoo tests from AI TestHub TestCases

Each AI TestHub testcase becomes one promptfoo test.

AI TestHub:

```json
{
  "externalId": "TC001",
  "sectionName": "Auth > Password Reset",
  "input": "Tôi quên mật khẩu thì làm sao?",
  "expectedBehavior": "Bot should explain safe password reset.",
  "assertions": []
}
```

Promptfoo:

```ts
{
  description: 'TC001 - Auth > Password Reset',
  vars: {
    input: 'Tôi quên mật khẩu thì làm sao?',
    expectedBehavior: 'Bot should explain safe password reset.',
    externalId: 'TC001',
    sectionName: 'Auth > Password Reset'
  },
  metadata: {
    externalId: 'TC001',
    sectionName: 'Auth > Password Reset'
  },
  assert: [...]
}
```

---

## 18. Mapping AI TestHub Assertions to promptfoo assertions

### 18.1 contains

AI TestHub:

```json
{
  "scope": "COMPONENT",
  "targetComponent": "answer",
  "type": "contains",
  "expectedValue": "mật khẩu"
}
```

Promptfoo:

```ts
{
  type: 'javascript',
  metric: 'answer_contains',
  value: `
    const r = JSON.parse(output);
    const actual = r.components?.answer ?? '';
    return String(actual).includes("mật khẩu");
  `
}
```

### 18.2 equals

```ts
{
  type: 'javascript',
  metric: 'intent_equals',
  value: `
    const r = JSON.parse(output);
    return r.components?.intent === "reset_password";
  `
}
```

### 18.3 less_than

```ts
{
  type: 'javascript',
  metric: 'latency_less_than',
  value: `
    const r = JSON.parse(output);
    return Number(r.components?.latency?.timeToLastToken ?? r.latencyMs) < 3000;
  `
}
```

### 18.4 array_length_greater_than

```ts
{
  type: 'javascript',
  metric: 'sources_present',
  value: `
    const r = JSON.parse(output);
    const arr = r.components?.sources ?? [];
    return Array.isArray(arr) && arr.length > 0;
  `
}
```

### 18.5 llm_rubric

```ts
{
  type: 'llm-rubric',
  metric: 'answer_quality',
  value: `
    User input: {{input}}
    Expected behavior: {{expectedBehavior}}

    Grade the answer according to this rubric:
    PASS if the answer follows expected behavior.
    FAIL if the answer contradicts expected behavior or hallucinates.
  `,
  threshold: 0.8
}
```

Note: For `llm-rubric`, include the relevant component through transform or by making the provider output contain normalized components.

---

## 19. Mapping ToolExpectations to promptfoo assertions

### 19.1 tool_must_be_called

```ts
{
  type: 'javascript',
  metric: 'tool_must_be_called',
  value: `
    const r = JSON.parse(output);
    const calls = r.components?.toolCalls ?? [];
    if (!Array.isArray(calls)) return false;
    return calls.some(c => c.name === "get_order_status");
  `
}
```

### 19.2 tool_must_not_be_called

```ts
{
  type: 'javascript',
  metric: 'tool_must_not_be_called',
  value: `
    const r = JSON.parse(output);
    const calls = r.components?.toolCalls ?? [];
    if (!Array.isArray(calls)) return true;
    return !calls.some(c => c.name === "refund_order");
  `
}
```

### 19.3 tool_args_match

```ts
{
  type: 'javascript',
  metric: 'tool_args_match',
  value: `
    const r = JSON.parse(output);
    const calls = r.components?.toolCalls ?? [];
    const call = calls.find(c => c.name === "get_order_status");
    return Boolean(call && call.arguments && call.arguments.order_id === "ORD-123");
  `
}
```

### 19.4 agent_equals

```ts
{
  type: 'javascript',
  metric: 'agent_equals',
  value: `
    const r = JSON.parse(output);
    return r.components?.agent === "local_source_search";
  `
}
```

### 19.5 missing tool trace

If tool trace is not available, AI TestHub should avoid producing a hard promptfoo failure unless the expectation is required.

Recommended approach:

- If expectation required and trace missing: fail with reason.
- If expectation optional and trace missing: mark skipped in AI TestHub result parser.
- Promptfoo itself may not represent skipped custom statuses well, so AI TestHub may post-process results.

---

## 20. Result parsing

Promptfoo returns an Eval record. Calling `toEvaluateSummary()` gives serializable results.

AI TestHub should parse the summary into:

```text
Run.summary
TestResult[]
AssertionResult[]
ToolExpectationResult[]
Artifacts
```

Expected AI TestHub output model:

```json
{
  "runId": "run_789",
  "summary": {
    "total": 10,
    "passed": 8,
    "failed": 1,
    "error": 1
  },
  "testResults": [
    {
      "testCaseId": "tc_1",
      "status": "PASSED",
      "score": 1,
      "rawResponse": {},
      "responseSnapshot": {},
      "assertionResults": [
        {
          "assertionId": "as_1",
          "status": "PASSED",
          "actualValue": "Bạn có thể đặt lại mật khẩu...",
          "expectedValue": "mật khẩu",
          "reason": null,
          "score": 1
        }
      ],
      "toolExpectationResults": []
    }
  ]
}
```

Important: If promptfoo summary does not carry enough structured information to map each assertion back to domain IDs, include domain IDs in assertion `metric` or `config`.

Example:

```ts
{
  type: 'javascript',
  metric: 'assertion_as_1_answer_contains',
  config: {
    assertionId: 'as_1',
    targetComponent: 'answer',
  },
  value: `...`
}
```

---

## 21. Reproducibility

Each run should store:

```text
RunSnapshot JSON
Generated promptfoo testSuite object
Generated promptfooconfig.yaml if applicable
Promptfoo result JSON
Normalized response snapshots
Redacted request snapshots
Runner version
Promptfoo version
```

This allows debugging even if testcase/assertion config changes later.

---

## 22. Security notes

### 22.1 Do not store secrets in generated YAML

Avoid:

```yaml
headers:
  Authorization: "Bearer real-token"
```

Prefer:

```yaml
headers:
  Authorization: "Bearer {{secret.CHATBOT_API_KEY}}"
```

And resolve secret only at runtime inside runner.

### 22.2 Redact artifacts

Before writing artifacts, redact:

```text
Authorization
Cookie
X-API-Key
access_token
refresh_token
api_key
password
secret
```

### 22.3 SSRF protection

Because users paste cURL, the runner must enforce:

```text
allowed domains
blocked private IP ranges unless explicitly allowed
blocked metadata services
http/https only
```

### 22.4 Do not expose raw JavaScript assertion to QC in MVP

JavaScript assertions are powerful but unsafe/confusing for QC.

Use structured assertion builder and generate JS internally.

---

## 23. CLI vs Node.js

### CLI approach

```bash
npx promptfoo eval -c promptfooconfig.yaml
```

Pros:

```text
fast MVP
easy local debugging
easy to inspect generated YAML
```

Cons:

```text
spawn process overhead
harder result/control integration
harder structured error handling
```

### Node.js package approach

```ts
const evalRecord = await promptfoo.evaluate(testSuite, options);
```

Pros:

```text
better integration in runner
in-memory config
easier to map domain objects
better error handling
no need to write YAML before running
```

Cons:

```text
requires stronger TypeScript/runner design
function transforms may be less reproducible unless stored carefully
```

Recommended:

```text
MVP: Node runner with promptfoo.evaluate()
Also store generated YAML/JSON artifact for debugging.
```

If evaluate() integration becomes difficult, fallback to generating YAML and running CLI from runner.

---

## 24. Recommended AI TestHub implementation plan

### Step 1: Build domain-to-testSuite conversion

Implement:

```text
PromptfooConfigBuilder
```

Input:

```text
RunSnapshot
```

Output:

```text
promptfoo testSuite object
```

### Step 2: Build chatbot provider

Implement:

```text
createChatbotProvider(snapshot)
```

Responsible for:

```text
render request template
resolve secrets
call chatbot API
normalize response
return JSON string output
```

### Step 3: Build assertion mapper

Implement:

```text
AssertionMapper
ToolExpectationMapper
RubricMapper
```

Input:

```text
AI TestHub Assertion / ToolExpectation / Rubric
```

Output:

```text
promptfoo assertion object
```

### Step 4: Run promptfoo

```ts
const evalRecord = await promptfoo.evaluate(testSuite, evaluateOptions);
const summary = await evalRecord.toEvaluateSummary();
```

### Step 5: Parse results

Implement:

```text
PromptfooResultParser
```

Output:

```text
AI TestHub RunResult payload
```

### Step 6: Store artifacts

Implement:

```text
ArtifactWriter
RedactedArtifactWriter
```

---

## 25. Minimal file structure for runner

```text
apps/runner/src/
  index.ts

  queue/
    runWorker.ts

  jobs/
    RunJobHandler.ts

  clients/
    apiClient.ts
    chatbotClient.ts

  promptfoo/
    PromptfooConfigBuilder.ts
    PromptfooRunner.ts
    PromptfooResultParser.ts
    AssertionMapper.ts
    ToolExpectationMapper.ts
    RubricMapper.ts

  normalizers/
    ResponseNormalizer.ts
    ResponseMappingResolver.ts
    ToolCallExtractor.ts
    FieldPathResolver.ts

  security/
    SecretResolver.ts
    RedactionService.ts
    SsrfGuard.ts

  artifacts/
    ArtifactWriter.ts

  types/
    RunSnapshot.ts
    TestCase.ts
    Assertion.ts
    ToolExpectation.ts
    Rubric.ts
    Result.ts
```

---

## 26. Key takeaway for another LLM

If another LLM reads this document, it should understand:

1. Promptfoo config is a structured evaluation spec with prompts, providers, tests, and assertions.
2. Promptfoo runs combinations of prompts/providers/tests.
3. `tests[].vars` supply input variables such as user question and expected behavior.
4. `tests[].assert` contains many assertions for one testcase.
5. JavaScript assertions allow field-level checks on JSON output.
6. `llm-rubric` allows semantic grading through an LLM judge.
7. Node.js `promptfoo.evaluate(testSuite, options)` can run evals programmatically.
8. AI TestHub should store its own domain objects and generate promptfoo config at runtime.
9. For chatbot QA, provider output should be normalized into components such as answer, intent, suggestions, sources, toolCalls, agent, latency, and error.
10. Tool call testing is possible if the chatbot exposes inferred tool/agent data or structured tool_calls.
11. Promptfoo YAML is an adapter artifact, not the core product model.
12. The Node runner should build config, call promptfoo, parse results, redact artifacts, and report structured results back to Spring Boot.

---

## 27. Sources consulted

This document is based on promptfoo documentation available in June 2026, especially:

- Configuration guide/reference
- Providers documentation
- Test case configuration
- Assertions and metrics
- JavaScript assertions
- LLM rubric/model-graded assertions
- Node package and Node API reference

