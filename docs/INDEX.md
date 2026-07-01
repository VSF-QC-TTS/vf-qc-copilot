# Documentation Index

This index helps agents and developers choose the smallest useful documentation set. Current code and local service
context win when older product docs disagree, unless the user explicitly asks to migrate implementation toward a target
document.

## Source Of Truth Order

1. Current code in `apps/`.
2. Local area instructions, such as `apps/api/AGENTS.md`.
3. Local current-state context, such as `apps/api/CONTEXT.md`.
4. Task roadmap in `docs/tasks/`.
5. Product, architecture, API, and database target documents in `docs/`.

## Read First

- `apps/api/AGENTS.md`: backend coding rules and API conventions.
- `apps/api/CONTEXT.md`: current backend implementation state.
- `docs/tasks/TASKS_Backend.md`: backend roadmap and current baseline.
- `docs/tasks/TASKS_Runner.md`: runner roadmap for Redis consumer, promptfoo adapter, result reporting, and operations.
- `docs/agent/AGENT_WORKFLOW.md`: multi-agent workflow, review, and commit responsibilities.

## Product And UX Target

- `docs/product/PRD.md`: product goals, domain model, MVP scope, roadmap, and acceptance criteria.
- `docs/product/EvalDeskQAPlatform.html`: AI-generated product prototype/reference. Treat it as inspiration and QC expectation,
  not a strict implementation contract.

## Architecture And Design

- `docs/architecture/C4_Architecture.md`: system context, containers, backend/runner/frontend components, async run flow, deployment.
- `docs/architecture/LLD_FullStack.md`: lower-level implementation notes and testing strategy.
- `docs/architecture/Database_Design.md`: conceptual database design, current schema conventions, migration guidance.
- `docs/architecture/API_Design.md`: API contract target. It is Microsoft/Azure-inspired internal REST, not strict Azure public API
  compliance.

## Execution And Integration

- `docs/integrations/promptfoo_yaml_nodejs_llm_spec.md`: promptfoo YAML and Node.js runner integration guide.
- `docs/decisions/ADR_001_Redis_Streams.md`: Redis Streams backend-runner messaging decision.
- `docs/decisions/ADR_002_Promptfoo_Evaluation_Engine.md`: promptfoo engine decision.
- `docs/decisions/ADR_003_Monorepo_Structure.md`: monorepo layout decision.

## Task Breakdown

- `docs/tasks/TASKS_Backend.md`: high-level backend task plan and dependencies.
- `docs/tasks/backend_epics/`: per-epic backend implementation tasks.
- `docs/tasks/TASKS_Runner.md`: high-level runner task plan and dependencies.
- `docs/tasks/runner_epics/`: per-epic runner implementation tasks.

## Recommended Reading Sets

- Backend code change: `apps/api/AGENTS.md`, `apps/api/CONTEXT.md`, matching task file under `docs/tasks/`, and only the
  relevant design doc.
- API contract change: `apps/api/CONTEXT.md`, `docs/architecture/API_Design.md`, `docs/tasks/TASKS_Backend.md`.
- Database change: `apps/api/CONTEXT.md`, `docs/architecture/Database_Design.md`, matching Flyway migrations.
- Runner/evaluation change: `docs/tasks/TASKS_Runner.md`, `docs/architecture/C4_Architecture.md`,
  `docs/integrations/promptfoo_yaml_nodejs_llm_spec.md`, `docs/decisions/ADR_001_Redis_Streams.md`, and
  `docs/decisions/ADR_002_Promptfoo_Evaluation_Engine.md`.
- Product scope discussion: `docs/product/PRD.md`, `docs/product/EvalDeskQAPlatform.html`, `docs/tasks/TASKS_Backend.md`.
