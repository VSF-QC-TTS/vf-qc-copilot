# Epic 1: Project Setup & Foundation

Goal: make the frontend shell, design tokens, component primitives, routing, and tests reliable before feature work starts.

## Read First

- `docs/architecture/Frontend_Design_System.md`
- `docs/architecture/Component_Contracts.md`
- `apps/client/package.json`
- `apps/client/src/index.css`
- `apps/client/src/App.tsx`
- Existing files under `apps/client/src/components/`
- `docs/product/EvalDeskQAPlatform.html` for app shell density, not implementation code

## Current Observations

- React 19 is installed.
- Tailwind CSS v4 is installed.
- React Router DOM 7 is installed.
- Zustand is installed.
- Some layout and UI files already exist and may be uncommitted.
- Existing shadcn-style UI files may still contain `import * as React`; normalize when touched.
- Test tooling is not present in `package.json` yet.

## Task 1.1: Confirm Foundation Baseline

Steps:

1. Inspect `apps/client/package.json`.
2. Confirm scripts: `dev`, `build`, `lint`, `preview`.
3. Confirm `tsconfig` path alias `@/*`.
4. Confirm Vite React plugin is configured.
5. Confirm Tailwind v4 is wired through Vite and CSS.

Acceptance:

- Build script still works.
- No duplicate package manager lock files are introduced.
- Document any missing baseline item in this epic. (Added missing dependencies: `clsx`, `tailwind-merge`, and `class-variance-authority` which were missing for UI components).

Tests/checks:

```bash
npm run build
npm run lint
```

## Task 1.2: Normalize Tailwind v4 Tokens

Steps:

1. Open `apps/client/src/index.css`.
2. Ensure semantic tokens exist for background, foreground, surface, popover, border, ring, primary, destructive, success, warning, and muted states.
3. Ensure dark mode tokens are represented.
4. Remove legacy `tailwind.config.js` assumptions unless one is intentionally introduced.
5. Map status colors for `PASSED`, `FAILED`, `ERROR`, `UNCERTAIN`, `PENDING`, `RUNNING`, and `SKIPPED`.

Acceptance:

- Components use semantic token classes where possible.
- Vietnamese text is not clipped by line-height.
- No decorative gradient/orb background is introduced.

## Task 1.3: UI Primitive Cleanup

Target files:

- `apps/client/src/components/ui/button.tsx`
- `apps/client/src/components/ui/card.tsx`
- `apps/client/src/components/ui/dropdown-menu.tsx`
- `apps/client/src/lib/utils.ts`

Steps:

1. Replace `import * as React` with named type imports where practical.
2. Use React 19 ref-as-prop style for local wrappers when possible.
3. Keep Radix primitive wrappers compatible; if a Radix type requires old patterns, document why.
4. Ensure each primitive extends native HTML props with `ComponentProps<"tag">` or the exact Radix prop type.
5. Ensure `Button` defaults to `type="button"`.
6. Ensure icon-only buttons require `aria-label`.
7. Ensure variants are typed and avoid boolean styling props.

Acceptance:

- No new `forwardRef` in local primitives unless a third-party adapter requires it.
- No `defaultProps`, `propTypes`, string refs, or `findDOMNode`.
- `cn()` is used for class merging.

## Task 1.4: App Shell

Target files:

- `apps/client/src/components/layout/AppShell.tsx`
- `apps/client/src/components/layout/Sidebar.tsx`
- `apps/client/src/components/layout/TopHeader.tsx`
- `apps/client/src/components/layout/MobileDrawer.tsx`
- `apps/client/src/components/layout/ProjectSwitcher.tsx`
- `apps/client/src/App.tsx`

Steps:

1. Define app routes with React Router.
2. Wrap protected app routes with `AppShell`.
3. Build desktop sidebar at `w-64`.
4. Build tablet icon rail at `w-16`.
5. Build mobile drawer navigation.
6. Add header breadcrumbs derived from route metadata.
7. Add a user menu placeholder that later connects to auth.
8. Ensure main content has stable responsive padding.
9. Add `ProjectSwitcher` placeholder that can receive real project data from Epic 4/Epic 2 query wiring.
10. Include environment/user affordance in the header without exposing tokens or secrets.

Acceptance:

- Desktop, tablet, and mobile navigation are coherent.
- Breadcrumbs are visible on app pages.
- No page content overlaps sidebar/header.
- Nav labels use i18n keys once i18n is available; until then mark the hardcoded labels as temporary in this epic.
- Shell matches or exceeds mentor prototype density: clear current route state, compact nav, no landing page, no decorative hero.
- Project switcher is keyboard reachable and does not fetch data inside the presentational component.

## Task 1.5: Routing and Suspense

Steps:

1. Create lazy route boundaries for feature pages.
2. Add skeleton fallback components that match the target layout.
3. Add route-level error boundary fallback.
4. Keep initial placeholder pages minimal and operational, not marketing pages.

Acceptance:

- Route transitions never show a blank white page.
- Missing routes render a not-found state.

## Task 1.6: Frontend Test Setup

Dependencies to add:

- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `jsdom`

Steps:

1. Add `test` script to `apps/client/package.json`.
2. Add `apps/client/src/test/setup.ts`.
3. Configure Vitest for jsdom.
4. Add one AppShell render test.
5. Add one navigation interaction test.

Acceptance:

- `npm test` exists.
- Tests assert user-visible behavior, not component internals.
- No `react-test-renderer`.

## Suggested Commit Slices

1. `chore(frontend): normalize foundation tooling`
2. `feat(frontend): add app shell navigation`
3. `test(frontend): add ui test harness`
