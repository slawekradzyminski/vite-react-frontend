# Visual Improvement Implementation Plan

Status legend: `todo`, `in-progress`, `done`

## Visual Direction

- Visual thesis: editorial product UI with a darker graphite base, warm neutral surfaces, and a single restrained accent that makes the app feel branded instead of scaffolded.
- Content plan: shell first, home overview second, auth entry points third, selective shared component normalization last.
- Interaction thesis: short entrance reveals, sharper hover states, and one subtle depth layer in the shell/background.

## Phase 1: Shell Foundation

Status: `done`

Goal: establish a consistent app-level visual base and remove leftover starter noise before touching page-specific layouts.

Tasks:
- [x] Audit current shell ownership and identify starter-era leftovers.
- [x] Add app-level color/surface tokens in [`src/index.css`](/Users/admin/IdeaProjects/vite-react-frontend/src/index.css).
- [x] Move shell background and spacing responsibility into [`src/App.tsx`](/Users/admin/IdeaProjects/vite-react-frontend/src/App.tsx).
- [x] Remove the unused Vite starter stylesheet at [`src/App.css`](/Users/admin/IdeaProjects/vite-react-frontend/src/App.css).
- [x] Verify shell changes with targeted tests.

Exit criteria:
- The app renders on a branded neutral canvas rather than generic gray.
- Global text/background defaults are controlled centrally.
- No dead Vite starter CSS remains in the app shell.

## Phase 2: Navigation Identity

Status: `done`

Goal: make the header read like product chrome rather than a default link bar.

Tasks:
- [x] Redesign desktop navigation hierarchy in [`src/components/layout/Navigation.tsx`](/Users/admin/IdeaProjects/vite-react-frontend/src/components/layout/Navigation.tsx).
- [x] Improve active, hover, and cart/profile states.
- [x] Refine mobile menu presentation and spacing.
- [x] Update navigation tests only where behavior assertions remain valid.

Exit criteria:
- Brand/product identity is visible in the first screen.
- Header actions scan clearly on desktop and mobile.
- Navigation still passes interaction tests.

## Phase 3: Home Page Recomposition

Status: `done`

Goal: replace the current multi-card feature grid with a clearer, more deliberate operations overview.

Tasks:
- [x] Create one dominant intro composition in [`src/pages/home/homePage.tsx`](/Users/admin/IdeaProjects/vite-react-frontend/src/pages/home/homePage.tsx).
- [x] Group destinations by operator value instead of by equal-weight cards.
- [x] Reduce color noise and repeated box treatments.
- [x] Keep existing route actions and `data-testid` hooks where practical.
- [x] Update brittle home-page copy assertions in tests.

Exit criteria:
- The home page has one clear visual anchor.
- The page reads well by scanning headings only.
- Navigation targets remain obvious and unchanged.

## Phase 4: Public Auth Polish

Status: `done`

Goal: make login and registration feel like intentional entry points instead of stock forms.

Tasks:
- [x] Redesign [`src/pages/auth/loginPage.tsx`](/Users/admin/IdeaProjects/vite-react-frontend/src/pages/auth/loginPage.tsx) with stronger identity and spacing.
- [x] Apply the same language to [`src/pages/auth/registerPage.tsx`](/Users/admin/IdeaProjects/vite-react-frontend/src/pages/auth/registerPage.tsx).
- [x] Normalize supporting link/button emphasis.
- [x] Update tests for changed headings or supporting copy.

Exit criteria:
- Auth pages share the same visual language as the shell.
- The primary action is obvious on first glance.
- Form validation and navigation behavior remain intact.

## Phase 5: Shared Controls and Motion Pass

Status: `done`

Goal: tighten consistency after the main layout work is in place.

Tasks:
- [x] Refine shared button styling in [`src/components/ui/button-variants.ts`](/Users/admin/IdeaProjects/vite-react-frontend/src/components/ui/button-variants.ts).
- [x] Add restrained motion for entrance and hover states where it improves hierarchy.
- [x] Run targeted regression tests for touched areas.

Exit criteria:
- Shared controls match the updated visual system.
- Motion is noticeable but restrained.
- Touched areas have passing targeted tests.

## Current Playwright Status

Status: `green`

Latest run:
- `npm run test:e2e`
- Result: `74 passed`, `0 failed`

Resolved in Phase 6:
- Home page Playwright coverage now targets current section headings and action buttons through stable page-object hooks in [`e2e/pages/home.page.object.ts`](/Users/admin/IdeaProjects/vite-react-frontend/e2e/pages/home.page.object.ts).
- Order details Playwright coverage now uses existing order-specific `data-testid` selectors in [`e2e/pages/order-details.page.object.ts`](/Users/admin/IdeaProjects/vite-react-frontend/e2e/pages/order-details.page.object.ts) instead of generic styling classes.

Interpretation:
- Phase 6 is complete and the redesigned UI is back in sync with end-to-end coverage.
- Remaining work is visual follow-through and QA, not selector repair.

## Phase 6: E2E Selector Hardening

Status: `done`

Goal: bring Playwright coverage back in sync with the redesigned UI by replacing brittle text/class selectors with stable page-object hooks.

Tasks:
- [x] Update `e2e/pages/home.page.object.ts` to target current home-page controls and section headings.
- [x] Update `e2e/tests/home.spec.ts` expectations to reflect the recomposed home page.
- [x] Replace `.rounded-full`-style locators in `e2e/pages/order-details.page.object.ts` with stable semantic or `data-testid` selectors.
- [x] Re-run the full Playwright suite after selector updates.

Exit criteria:
- `npm run test:e2e` no longer fails due to stale visual selectors.
- Home and order-details flows use stable page-object locators.

## Phase 7: Interior Page Visual Alignment

Status: `todo`

Goal: extend the updated look and feel beyond entry points and home into the most visible authenticated work surfaces.

Tasks:
- [ ] Review products, product details, profile, order details, cart, and traffic pages for visual mismatch against the new shell.
- [ ] Normalize section spacing, headings, and surface treatments on the highest-traffic interior pages first.
- [ ] Remove remaining generic card stacks where a simpler layout would read better.
- [ ] Keep route behavior and existing functional coverage intact.

Exit criteria:
- Primary logged-in workflows feel like one product rather than a mix of old and new surfaces.
- Interior pages reuse the same spacing, surface, and button language as the shell.

## Phase 8: Responsive and Accessibility QA Pass

Status: `todo`

Goal: catch polish issues that unit tests miss across common breakpoints and interaction states.

Tasks:
- [ ] Do a manual browser pass on desktop and mobile-sized viewports for the redesigned shell, home, and auth pages.
- [ ] Check focus states, keyboard traversal, and contrast on the updated navigation and buttons.
- [ ] Capture any spacing or wrapping regressions introduced by the new branding and larger button geometry.
- [ ] Document follow-up fixes separately from broader redesign work.

Exit criteria:
- Updated pages remain clean at desktop and mobile widths.
- Focus visibility and tap targets stay acceptable after the visual pass.
- Remaining issues are narrowed to explicit follow-up items.
