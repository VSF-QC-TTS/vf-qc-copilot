# Agent Workflow & Delegation Guidelines

This document serves as the **Source of Truth** for coordinating autonomous Subagents in the project. The Orchestrator (Main Agent) must read and enforce this guide when delegating tasks. All content here is written in English to ensure compatibility with all AI agents.

## 1. Context and Knowledge Management
Before executing any tasks, all agents must understand the domain rules:
- `apps/api/AGENTS.md`: Backend coding rules and conventions (e.g., JavaDoc headers, `publicId` UUIDs, DTO `record` usage, explicit validation messages).
- `apps/api/CONTEXT.md`: Current backend implementation state, implemented endpoints, auth behavior, persistence notes, and focused test guidance.
- `docs/INDEX.md`: Documentation map and recommended reading sets.
- `docs/tasks/TASKS_Backend.md`: The single source of truth for the project roadmap, task breakdown, and acceptance criteria.
- **MCP Tools**: Agents (if `enable_mcp_tools` is true) should use tools from `agent-skills-standard`:
  - Use `load_skills_for_keywords` (e.g., `["java 21", "jpa"]`) during planning.
  - Use `load_skills_for_files` (e.g., `*Repository.java`) to fetch specific coding practices before modifying files.

## 2. Agent Roles and Separation of Concerns
To prevent agents from hallucinating or taking unauthorized actions (like committing unreviewed code), we separate concerns into three distinct roles. **Do not mix these responsibilities.**

### A. The Coder Agent (`java_backend_coder`)
- **Responsibility**: Write code and tests strictly for the assigned micro-task.
- **Restrictions**: 
  - **NEVER** run `git commit`. 
  - **NEVER** update `CONTEXT.md`, `AGENTS.md`, or system architecture files.
- **Prompt Directive**: *"Implement task [X]. Read apps/api/AGENTS.md for rules and apps/api/CONTEXT.md for current backend state. Leave all changes in the working directory (unstaged or staged). Do NOT commit. Report back when all tests pass."*

### B. The Reviewer Agent (`java_backend_reviewer`)
- **Responsibility**: Audit the Coder's changes against the strict checklist. Provide feedback or approval.
- **Checklist**:
  1. **JavaDoc**: Every new `.java` file MUST have the standard class-level header (`@author` and `@since`).
  2. **Security**: Internal DB `id` (BIGINT) must NOT be exposed. API must use `publicId` (UUID).
  3. **DTOs**: Must use Java `record` and include OpenAPI `@Schema` annotations.
  4. **Validation**: All validation annotations must have explicit `message` attributes.
- **Restrictions**:
  - **NEVER** run `git commit`.
- **Prompt Directive**: *"Review the unstaged/staged changes. Use the checklist in docs/agent/AGENT_WORKFLOW.md. If there are violations, reject and detail the errors. If it passes 100%, output 'APPROVED'."*

### C. The Documenter & Committer Agent (`java_backend_committer`)
- **Responsibility**: Update living documentation and persist changes to version control.
- **Workflow**: Only triggered AFTER the Reviewer outputs 'APPROVED'.
- **Actions**:
  1. Inspect the approved diff.
  2. Update `apps/api/CONTEXT.md` if new domains, entities, or API endpoints were introduced.
  3. Update `apps/api/AGENTS.md` only if backend rules or conventions changed.
  4. Run `git add .` and `git commit -m "feat(scope): description"`.
- **Prompt Directive**: *"The code is approved. Please update apps/api/CONTEXT.md with any new endpoints/domains discovered in the diff. Update apps/api/AGENTS.md only if backend rules changed. Then, commit the changes using Conventional Commits."*

## 3. The Strict "Ping-Pong" Workflow
The Orchestrator must orchestrate tasks sequentially:
1. **Assign** a micro-task (e.g., "E3.1 only") to the **Coder**.
2. **Wait** for the Coder to finish.
3. **Assign** the **Reviewer** to audit the working directory.
4. If rejected, send feedback back to the **Coder**.
5. If approved, **Assign** the **Committer** to finalize the task.
6. Move to the next micro-task (e.g., E3.2).
