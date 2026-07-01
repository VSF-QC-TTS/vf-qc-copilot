# Frontend Design System & UI/UX Guidelines

This document is the visual and interaction standard for the AI TestHub frontend. It defines how the product should look, respond, and degrade across dashboards, forms, data tables, reports, and authentication screens.

Read this together with `docs/architecture/Component_Contracts.md` before implementing UI.

## 1. Product UI Direction

AI TestHub is an internal QA automation tool. It should feel precise, operational, and dense enough for repeated work.

### 1.1 Mentor Prototype Benchmark

`docs/product/EvalDeskQAPlatform.html` is the visual/product benchmark from mentor review. Treat it as a UX reference, not as implementation source code and not as an API contract.

Preserve or exceed these prototype-level capabilities:

- App shell with dark operational sidebar, project switcher, user/environment affordance, and clear current section state.
- Dashboard with top metric cards, pass-rate trend, recent runs, and A/B prompt/config comparison when the backend exposes version comparison data.
- Configuration workbench split into API target setup, LLM judge/rubric settings, verification rules, and dataset column mapping.
- cURL import flow that parses method, URL, headers, body, and variables before the user persists target configuration.
- Dataset library with grid/table access, upload preview, matched columns, row-level validation issues, and invalid-row correction flow.
- Test run screen with dataset/target/config selectors, progress, live per-case feedback, latency, and terminal navigation to results.
- Results screen with summary metrics, status filters, expandable rows, field-level expected-vs-actual diffs, raw payload inspection, and review workflow.

Improve beyond the prototype in these areas:

- Real backend DTOs and runner semantics are authoritative; never invent fields from the HTML.
- All flows need loading, empty, error, success, and permission/auth states.
- Keyboard navigation, visible focus, screen reader semantics, and WCAG AA contrast are required.
- Responsive desktop/tablet/mobile behavior must be designed, not left as a desktop-only prototype.
- URL state, i18n, tests, typed API clients, and accessibility checks are part of completion.
- Secrets must be masked and excluded from copy/log output.
- Runner statuses must include `UNCERTAIN` and manual review must distinguish auto status from final reviewed status.
- Prompt/config A/B and version history are enabled only when backend contracts support them; otherwise show a disabled roadmap affordance or omit the control.

### 1.2 First-Run and No-Project UX

After login, the app must not drop users into an empty dashboard that depends on a selected project.

Route behavior:

- If the user has no active projects, route to `/projects/new`, not a modal auto-open or fake dashboard.
- If the user has projects but no deep-linked project, route to `/projects/:projectId/targets`, using the last project only as a redirect hint.
- If the user opens a stale project URL and receives `404` or forbidden, show a recovery state with links to project list and create project.
- App shell may render in no-project mode, but project-scoped nav items must be disabled or hidden until a project exists.
- Project context is URL-owned: project-scoped screens use `/projects/:projectId/...`; Zustand may store `lastProjectId` only.

First-run screen requirements:

- Explain the minimum setup path in one compact flow: create project, configure target, import dataset, run evaluation.
- Primary action is create project.
- Secondary action can be view docs/sample import only if implemented.
- No fake dashboard metrics, no sample project data, and no decorative landing hero.

A project-scoped page must handle these setup states:

- Project exists but has no targets: show configure target CTA.
- Project has target but no datasets: show import/create dataset CTA.
- Project has dataset but no runs: show run dataset CTA.
- Project has runs: show dashboard/report content.

### 1.3 A/B and Comparison UX

Use precise naming:

- `Run Compare`: compare two completed runs on the same dataset or comparable testcase set.
- `A/B Experiment`: trigger and track two or more variants as one planned experiment.
- `Prompt/Config Version`: saved target/rubric/prompt configuration snapshot used by a run.

Do not label a feature as A/B if the backend only supports independent runs. In that case, show "Compare runs" after both runs exist.

Better-than-prototype behavior:

- Require the same dataset/testcase scope before comparing variants.
- Show regressions, fixes, unchanged cases, and latency/cost deltas instead of only "A wins".
- Keep statistical confidence optional and backend-computed; do not invent significance client-side.
- Show what changed between variants: target, response mapping, rubric, prompt/config version, model, or runtime options when available.
- Allow users to promote a winner only if backend implements version/promotion state.

Design goals:

- Fast scanning over decorative presentation.
- Clear hierarchy over oversized marketing sections.
- High information density without cramped text.
- Predictable navigation for repeated daily workflows.
- Strong table, form, and report ergonomics.
- Full Vietnamese text support from day one.

Avoid:

- Landing-page hero layouts inside the app.
- Decorative gradient/orb/bokeh backgrounds.
- Card-inside-card page composition.
- One-hue palettes dominated by purple, slate, beige, or brown.
- Fixed-width text containers that break Vietnamese or long translated labels.

## 2. Accessibility Baseline

Accessibility is not optional.

Rules:

- Every interactive control must be keyboard reachable.
- Use native semantic elements first: `button`, `a`, `form`, `label`, `input`, `table`.
- Icon-only buttons require `aria-label`.
- Form fields must connect labels and errors through `htmlFor`, `aria-invalid`, and `aria-describedby`.
- Dialogs, dropdowns, popovers, and menus should use Radix primitives or components with equivalent focus management.
- Visible focus must use `focus-visible` and meet contrast requirements.
- Text contrast must meet WCAG AA: 4.5:1 for normal text, 3:1 for large text and non-text UI indicators.
- Minimum pointer target should be 40px; use 44px where space allows.
- Toast/error regions need `aria-live` when they are not directly triggered by focused controls.
- Respect `prefers-reduced-motion`.

## 3. Layout System

### 3.1 App Shell

Desktop:

- Sidebar: fixed, `w-64`, full height.
- Project switcher sits at the top of the sidebar and is labelled as current project/workspace, not as a primary nav module.
- Header: sticky top, height `56px` or `64px`.
- Main: `flex-1`, width constrained by content type.
- Breadcrumbs: always visible in header for nested pages.

Tablet:

- Sidebar collapses to icon rail, `w-16`.
- Tooltips reveal nav item names.

Mobile:

- Sidebar hidden.
- Header includes menu button and compact current project selector.
- Navigation opens in a focus-managed drawer/dialog.
- Drawer closes from route-change effects, not by setting state during render.
- Dialog-heavy flows convert to bottom sheets where appropriate.

### 3.2 Page Layouts

Use three page templates:

- List page: title row, filters, table/list, pagination.
- Detail page: header, tabs, primary content, right-side metadata panel when useful.
- Workbench page: resizable or stacked panels for editors/builders.

Do not wrap whole page sections in decorative cards. Use full-width sections with constrained inner content. Cards are allowed for repeated records, modal bodies, and framed tools.

### 3.3 Responsive Data Rules

- Tables live inside `overflow-x-auto`.
- Important first columns may be sticky on mobile.
- Tabs become horizontally scrollable.
- Filter bars wrap into two lines before collapsing into a filter drawer.
- Text must not overlap adjacent controls; truncate only when a tooltip or full-detail view exists.

## 4. Design Tokens

Use Tailwind CSS v4 CSS-first tokens in `apps/client/src/index.css` or the shared global CSS file.

Token categories:

```css
@theme {
  --color-background: ...;
  --color-foreground: ...;
  --color-surface: ...;
  --color-surface-muted: ...;
  --color-border: ...;
  --color-ring: ...;
  --color-primary: ...;
  --color-primary-foreground: ...;
  --color-destructive: ...;
  --color-warning: ...;
  --color-success: ...;
}
```

Semantic usage:

- `background`: app background.
- `surface`: panels, tables, dialogs.
- `surface-muted`: subtle row hover, skeletons, inactive nav.
- `border`: dividers, input borders, table borders.
- `ring`: focus states.
- `primary`: main action.
- `destructive`: destructive actions and failed statuses.
- `warning`: uncertain statuses.
- `success`: passed statuses.

Status colors:

- `PASSED`: success/emerald.
- `FAILED`: destructive/red.
- `ERROR`: destructive/red plus stronger iconography.
- `UNCERTAIN`: warning/amber.
- `PENDING` or `RUNNING`: primary/blue.
- `SKIPPED`: muted/neutral.

## 5. Typography

Fonts:

- UI: Inter or an equivalent Latin Extended font.
- Code/logs/JSON: JetBrains Mono or equivalent monospace.
- IBM Plex Sans and IBM Plex Mono are acceptable alternatives when matching the mentor prototype more closely, but only if Vietnamese diacritics render cleanly.

Rules:

- Do not use `leading-none` for Vietnamese text.
- Default line height should be `leading-normal`.
- Dense table cells may use `text-sm`, but not clipped line-height.
- Labels use medium weight, not tiny low-contrast text.
- Button text must remain readable at mobile widths.
- Letter spacing should remain normal; avoid negative tracking.

Localization stress tests:

- English short label: `Save`.
- Vietnamese label: `Lưu thay đổi`.
- German-style long label: `Änderungen speichern`.

Any button, tab, nav item, and table action must survive these lengths.

## 6. Spacing, Radius, and Elevation

Spacing:

- 4px: icon/text gap, tight inline controls.
- 8px: field label gap, compact toolbar gap.
- 12px: dense card/table internal spacing.
- 16px: standard form field gap, card padding.
- 24px: panel gap, section gap.
- 32px: major page division.

Radius:

- Inputs/buttons/badges: 6px to 8px.
- Cards: 8px maximum.
- Dialogs/sheets: 10px to 12px.
- Pills/avatar circles: full radius.

Elevation:

- Default surfaces use borders, not heavy shadows.
- Dropdowns/popovers may use `shadow-md`.
- Dialogs may use `shadow-xl`.
- Avoid nested elevated surfaces.

## 7. Motion

Motion should communicate state changes, not decorate.

Preferred defaults:

- Micro interactions: 120-180ms ease-out.
- Overlays: 160-220ms with opacity and small scale/translate.
- Route transitions: use sparingly; no animation that slows repeated workflows.

Use CSS transitions and Radix state attributes first. Add Framer Motion only when the feature needs layout animation or complex choreography and the dependency is already accepted.

Rules:

- Respect `prefers-reduced-motion`.
- Do not animate table rows in a way that makes scanning harder.
- Keep skeleton animation subtle.

## 8. Components

### 8.1 Buttons

Required variants:

- `primary`
- `secondary`
- `ghost`
- `outline`
- `destructive`

Required sizes:

- `sm`
- `md`
- `lg`
- `icon`

Rules:

- Icon buttons use Lucide icons and `aria-label`.
- Buttons default to `type="button"` unless used as form submit.
- Loading state keeps stable width and shows spinner or pending icon.
- Destructive actions require confirmation unless easily reversible.

### 8.2 Forms

Auth screens:

- May use floating inputs.
- May have more spacious layout.

Dashboard forms:

- Use static labels above fields.
- Use compact field groups.
- Use progressive disclosure for advanced settings.
- JSON inputs use monospace editor styling and validation feedback.

Validation:

- Validate on blur or submit initially.
- After error, validate on change.
- Show one primary error per field.
- Keep backend validation errors mapped to fields when possible.

### 8.3 Tables

Tables are central to AI TestHub.

Rules:

- Compact density: `text-sm`, `py-2`, `px-3`.
- Sticky header.
- Row hover state.
- Sort indicators where sorting exists.
- Explicit empty state.
- Pagination footer with current range.
- Long IDs and URLs truncate with tooltip/copy.
- Row actions hidden on desktop hover only when discoverability remains acceptable; always visible or in menu on touch devices.

### 8.4 JSON, Code, and Logs

Rules:

- Monospace font.
- Syntax highlighting for JSON/code.
- Copy button top-right.
- Expand/collapse for large payloads.
- Preserve whitespace.
- Never put secrets in copied/logged content.

### 8.5 Empty, Loading, and Error States

Loading:

- Use skeletons matching the target layout.
- Use 5-7 table skeleton rows for viewport fill.
- Do not show blank pages.

Empty:

- Short headline.
- One sentence max.
- One primary action.
- Use a Lucide icon or small illustration.

Error:

- Recoverable errors show retry.
- Route-level failures use Error Boundary fallback.
- API errors use localized messages.
- Critical errors can use toast or dialog.

## 9. Feature-Specific UX Rules

Projects and targets:

- Targets need a clear response mapping status because runner quality depends on it.
- JSON templates must have validation and formatting.
- URL/method/auth fields should be grouped.
- cURL parsing must preview parsed request pieces before applying them.

Datasets and test cases:

- Test case tables need fast filtering by section, tag, enabled, and search.
- Editors should not force full-page navigation for every row edit.
- Import preview must show invalid rows and allow correction flow.
- Dataset column roles should be visible during import: input, expected field, metadata, ignored.
- Upload previews must show matched column count, valid/invalid row count, and row numbers for blocking issues.

Assertions and tool expectations:

- Use builder-style forms with dynamic fields.
- Show examples for field paths and expected values.
- Keep enum values translated but transport raw backend values.
- Verification builders should support per-field rules, rubric-backed LLM judge rules, and hybrid modes only where backend and runner support them.

Runs and reports:

- Run status should be visible from dataset and run detail pages.
- Reports need both summary cards and drill-down rows.
- Raw response and normalized components should be inspectable side by side.
- Live run views must show progress, current phase, per-case status, latency, and a path to the report when complete.
- Results rows should expand into expected-vs-actual field diffs before forcing users into raw JSON.

Manual review:

- Distinguish auto status from reviewed/final status.
- Reviewer notes need clear save state and audit metadata.

## 10. Prototype Quality Bar

A feature that appears in `EvalDeskQAPlatform.html` is not considered done merely because a similar screen exists. It must also meet the production bar:

- Uses the real backend controller/request/response classes.
- Handles auth/session and forbidden states.
- Has responsive behavior across desktop, tablet, and mobile.
- Is keyboard operable and screen-reader understandable.
- Persists shareable view state in the URL where appropriate.
- Has behavior tests for the primary workflow.
- Keeps all user-visible strings in i18n resources.
- Avoids inline-style monoliths and decomposes reusable surfaces into typed components.

## 11. Implementation Checklist

Before marking a UI slice complete:

- Component follows `Component_Contracts.md`.
- All text uses i18n.
- Keyboard navigation tested manually.
- Loading, empty, error states exist.
- Mobile behavior checked.
- No text clipping with Vietnamese labels.
- No hardcoded API payload guesses.
- Tests cover the main user behavior.
