# Component Contracts & UI Architecture

This document defines how frontend components in AI TestHub expose props, handle state, integrate with React 19, and stay compatible with future React upgrades.

Current frontend baseline:

- React: `19.x`
- React DOM: `19.x`
- TypeScript: strict mode required
- Build: Vite
- Styling: Tailwind CSS v4 CSS-first tokens
- UI ownership: shadcn/ui-style local components under `apps/client/src/components/ui`

Official React references used for these rules:

- React 19 Upgrade Guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- React 19 Release Notes: https://react.dev/blog/2024/12/05/react-19
- `forwardRef` reference: https://react.dev/reference/react/forwardRef

Mentor prototype reference:

- `docs/product/EvalDeskQAPlatform.html`

Use the prototype to understand expected product behavior and density. Do not copy its inline styles, generated structure, custom DSL, hardcoded data, or implied API shapes.

## 1. Contract Principles

### 1.1 Props Must Match Platform Semantics

Foundational components must preserve native HTML behavior. Do not hide browser semantics behind custom prop names.

Use `ComponentProps<"tag">` for native element wrappers:

```tsx
import type { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

function Button({ variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return <button type={type} data-variant={variant} data-size={size} {...props} />;
}
```

Rules:

- Event props start with `on`: `onOpenChange`, `onValueChange`, `onSubmitSuccess`.
- Boolean props start with `is`, `has`, `can`, or `should`.
- Visual choices use variants, not boolean soup.
- Native attributes must still pass through: `disabled`, `aria-*`, `data-*`, `type`, `name`, `autoComplete`.
- Primitives must not call APIs or read global stores.

### 1.2 Composition First

Prefer slots and children over large configuration objects.

```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>{t("project.delete.title")}</DialogTitle>
  </DialogHeader>
  <DialogFooter>
    <Button variant="ghost">{t("common.cancel")}</Button>
    <Button variant="destructive">{t("common.delete")}</Button>
  </DialogFooter>
</Dialog>
```

Use configuration objects only for data-driven surfaces such as table column definitions.

### 1.3 Smart Containers, Dumb Primitives

Separate responsibilities:

- `components/ui/*`: dumb primitives, no app state, no API calls.
- `components/layout/*`: shell/navigation composition.
- `features/<feature>/components/*`: feature-specific UI.
- `features/<feature>/api.ts`: API calls.
- `features/<feature>/queries.ts`: TanStack Query hooks.
- `features/<feature>/schemas.ts`: Zod schemas and form types.

### 1.4 Prototype-Derived Components

The mentor prototype implies these production components. Implement them as typed, reusable React components backed by real feature data, not as copied markup.

`ProjectSwitcher`:

- Lives in the app shell.
- Accepts the current project, project list, loading state, and `onProjectChange`.
- Treats the URL project id (`/projects/:projectId/...`) as the selected project source of truth.
- When changing project, preserves the current project-scoped module when possible, for example `/projects/a/targets` -> `/projects/b/targets`.
- Supports keyboard search/selection when project count grows.
- Does not own project selection state; layout containers may fetch projects and pass data down.
- Supports no-project state by rendering a create-project action instead of an empty menu.

`FirstRunProjectGate`:

- Runs after auth bootstrap and project list load.
- Routes users without projects to `/projects/new`.
- Routes users with projects but no route project to `/projects/:projectId/targets`, using persisted `lastProjectId` only as a redirect hint.
- Shows a recovery state when `/projects/:projectId/...` references a missing or inaccessible project.
- Must not rely on Zustand `activeProjectId`; the URL is authoritative for project context.

`DashboardMetricCard` and `TrendPanel`:

- Render summary numbers, deltas, and chart/table-friendly trend data.
- Accept `isLoading`, `error`, and empty state props.
- Do not calculate business metrics unless the backend response explicitly requires client-side derivation.

`ConfigWorkbench`:

- Owns tab state through URL search params.
- Composes target API config, LLM judge/rubric config, verification rules, and dataset column mapping only when those contracts exist.
- Keeps each tab form isolated so one invalid tab does not corrupt another unsaved tab.

`CurlImportPanel`:

- Accepts raw cURL input, parsed preview result, parse errors, and apply callback.
- Must preview method, URL, headers, query params, body, and masked secrets before applying.
- Uses backend parse endpoint when present; local parsing is only an enhancement after backend contract review.

`DatasetUploadPreview`:

- Shows file metadata, matched column count, valid/invalid row count, row-level issues, and preview rows.
- Accepts backend preview DTOs directly or through a narrow mapper.
- Keeps confirm disabled until backend preview state allows it.

`VerificationRuleBuilder`:

- Supports backend assertion enums and runner-supported methods only.
- Keeps transported enum values raw while translating labels at render time.
- Shows JSONPath examples and validates paths before submit when the runner requires a path format.

`RunProgressPanel`:

- Shows run status, progress counts, phase, elapsed time, per-case status rows, and report navigation.
- Polling is owned by a container/query hook, not by the presentational panel.
- Must represent `UNCERTAIN` distinctly from `FAILED` and `ERROR`.

`ResultFieldDiff`:

- Displays field name, expected value, actual value, assertion status, score/threshold when available, and reviewer context.
- Large values collapse with accessible expand/copy controls.
- Redacted payloads stay redacted when copied.

`RunComparisonSummary`:

- Represents two completed runs or one backend experiment result.
- Accepts backend-provided summary numbers for regressions, fixes, unchanged cases, pass-rate delta, latency delta, and cost delta when available.
- Must not compute statistical confidence unless backend returns enough explicit fields and the calculation is documented.
- Uses "Compare runs" labels for independent runs and "A/B experiment" labels only for backend experiment contracts.

## 2. React 19 Rules

### 2.1 Required Modern JSX Transform

React 19 requires the modern JSX transform. Do not add `import React from "react"` just to use JSX.

Allowed:

```tsx
import { useId, type ComponentProps } from "react";
```

Avoid:

```tsx
import * as React from "react";
```

Exception: third-party generated shadcn/ui code may initially contain namespace imports, but it must be normalized when touched.

### 2.2 Refs Are Props

In React 19, `ref` can be passed as a normal prop to function components. New local components should not use `forwardRef`.

```tsx
import type { ComponentProps } from "react";

function Input({ ref, className, ...props }: ComponentProps<"input">) {
  return <input ref={ref} className={cn("h-9 rounded-md border px-3", className)} {...props} />;
}
```

Rules:

- Prefer `ref` as prop for new local components.
- Use `forwardRef` only when a third-party library type or adapter explicitly requires it.
- Do not inspect `element.ref`; React 19 deprecates that path. Use `element.props.ref` only when element introspection is unavoidable.
- Ref callbacks must not implicitly return the assigned instance.

```tsx
// Bad in React 19 TypeScript
<div ref={(node) => (element = node)} />

// Good
<div ref={(node) => { element = node; }} />
```

### 2.3 Context Provider Syntax

React 19 allows rendering the context object directly:

```tsx
<ThemeContext value={value}>
  <App />
</ThemeContext>
```

Use this for new code. Existing `.Provider` usage can be migrated when touched.

### 2.4 Forms and Actions

React 19 Actions can manage pending state, errors, optimistic updates, and form submissions. Use them where they simplify the flow.

Guidance:

- Simple mutation forms may use React 19 form Actions with `useActionState`.
- Submit button components inside a form may use `useFormStatus` from `react-dom`.
- Complex dashboard forms should still use React Hook Form plus Zod when field-level control, dynamic arrays, or debounced validation is needed.
- Do not pass `isLoading` down several layers when `useFormStatus` can read the nearest form status.
- `ReactDOM.useFormState` is deprecated; use `useActionState` imported from `react`.

### 2.5 Metadata and Resources

React 19 supports rendering document metadata from components.

Use:

```tsx
<>
  <title>{t("projects.title")}</title>
  <meta name="description" content={t("projects.description")} />
</>
```

Do not add `react-helmet` or similar libraries.

### 2.6 React Compiler

Do not assume React Compiler is active unless the frontend build explicitly enables it.

Rules:

- Do not add `React.memo`, `useMemo`, or `useCallback` by habit.
- Use memoization only for measured performance problems, referential equality required by a third-party library, or expensive calculations.
- If React Compiler is enabled later, remove unnecessary manual memoization during cleanup.

## 3. React 19 Removed or Deprecated APIs

These patterns are banned in AI TestHub frontend code.

| Old API or Pattern | React 19 Status | Use Instead |
| --- | --- | --- |
| `ReactDOM.render` | Removed | `createRoot(container).render(<App />)` from `react-dom/client` |
| `ReactDOM.hydrate` | Removed | `hydrateRoot(container, <App />)` |
| `ReactDOM.unmountComponentAtNode` | Removed | `root.unmount()` |
| `ReactDOM.findDOMNode` | Removed | DOM refs |
| `react-dom/test-utils` except legacy `act` path | Removed/deprecated | `act` from `react`; prefer Testing Library user tests |
| `react-test-renderer/shallow` | Removed | Avoid shallow rendering; use React Testing Library |
| `react-test-renderer` | Deprecated | React Testing Library |
| Function component `defaultProps` | Removed | Default parameters |
| Function component `propTypes` | Ignored/obsolete | TypeScript and Zod at boundaries |
| Legacy context `contextTypes` / `getChildContext` | Removed | `createContext` |
| String refs | Removed | `useRef` or ref callbacks |
| Module pattern factories | Removed | Plain function components |
| `React.createFactory` | Removed | JSX |
| `forwardRef` for new local components | Deprecated path | `ref` as prop |
| `element.ref` | Deprecated | `element.props.ref` |
| UMD React builds | Removed | ESM imports/build tooling |

TypeScript-specific React 19 rules:

- `useRef` requires an argument: use `useRef(null)` or `useRef(undefined)`.
- `ReactElement["props"]` defaults to `unknown`; avoid unsafe element introspection.
- JSX namespace augmentation must target the correct module (`react`, `react/jsx-runtime`, or `react/jsx-dev-runtime`) instead of relying on a global `JSX` namespace.
- Prefer `React.JSX` types where explicit JSX types are needed.

## 4. Variant and Styling Contracts

### 4.1 Variants

Use `class-variance-authority` or an equivalent typed variant helper if installed. If not installed yet, implement a small typed variant map before adding complex branching.

Bad:

```tsx
<Button isPrimary isSmall isDanger>Delete</Button>
```

Good:

```tsx
<Button variant="destructive" size="sm">Delete</Button>
```

Required variant dimensions for shared components:

- `Button`: `variant`, `size`, optional `isLoading`.
- `Badge`: `variant`, optional `tone`.
- `Input`: `state` only when visual state cannot come from `aria-invalid`.
- `Card`: no marketing variants; cards are for repeated items, dialogs, or framed tools.

### 4.2 Class Merging

Use `cn()` from `apps/client/src/lib/utils.ts` for conditional classes.

Do not manually concatenate long Tailwind strings:

```tsx
className={cn("h-9 rounded-md border", isInvalid && "border-destructive", className)}
```

## 5. Data and State Contracts

### 5.1 URL State

State that should survive reloads or be shareable belongs in the URL:

- pagination
- active tab
- filters
- search query
- selected project when deep-linking is needed

Use React Router search params for these values.

### 5.2 Server State

All API data belongs in TanStack Query.

Do not use `useEffect + fetch + useState` for server data.

Required query conventions:

- Query keys are arrays: `["projects", { page, size, search }]`.
- Mutations invalidate or update exact related query keys.
- API functions return typed DTOs that match backend response classes.
- API error normalization happens in one client layer, not inside every component.

### 5.3 Client State

Use Zustand only for cross-route client state:

- authenticated user/session metadata
- selected project if not URL-driven
- theme/language if not persisted elsewhere

Keep modal state, dropdown state, field state, and hover state local.

## 6. API Boundary Contracts

Before adding any frontend API call, read backend Java source:

1. Controller for path and HTTP method.
2. Request DTO for body fields.
3. Response DTO for returned fields.
4. Service behavior for pagination, validation, and error codes when needed.

Rules:

- Do not invent JSON fields from docs alone.
- Public IDs are UUID strings from `publicId`/response IDs; never expose backend internal numeric IDs.
- Backend English enum values stay as-is in transport and are translated only at render time.
- Validate environment variables with Zod at startup.
- Validate unknown API responses with Zod when the backend contract is not yet covered by generated types.

## 7. Forms and Validation Contracts

Use this stack:

- React Hook Form for complex forms.
- Zod v4 for schemas.
- React 19 Actions for simple mutation flows where they reduce boilerplate.
- `useFormStatus` for submit components inside action-backed forms.

Validation UX:

- Initial validation on submit or blur.
- After a field has errored, validate on change for recovery.
- Error text must be localized.
- Inputs must set `aria-invalid` and connect error text through `aria-describedby`.
- Do not use floating inputs outside auth screens.

## 8. Internationalization Contracts

Every user-visible string uses translation keys.

Rules:

- No hardcoded user-facing text in components.
- No string concatenation for translated messages; use interpolation.
- Translate enum labels at render time: `t("status.PASSED")`.
- Keep backend values in English for API calls.
- Design buttons and table cells to survive Vietnamese and longer European labels.

## 9. Testing Contracts

Preferred frontend tests:

- Vitest
- React Testing Library
- `@testing-library/user-event`
- MSW for API mocking when integration-level behavior matters

Rules:

- Test behavior, not implementation details.
- Do not use shallow rendering.
- Do not use `react-test-renderer`.
- Import `act` from `react` only when Testing Library utilities are insufficient.
- Each feature epic must include at least one meaningful component or integration test before being marked complete.

## 10. File Structure Contract

Recommended structure:

```text
apps/client/src/
  app/
    providers/
    router/
  components/
    layout/
    ui/
  features/
    auth/
    projects/
    targets/
    datasets/
    test-cases/
    runs/
    reports/
    rubrics/
  lib/
    api/
    i18n/
    env.ts
    utils.ts
  test/
    mocks/
    setup.ts
```

Do not place feature API clients inside UI primitive folders.
