# Inventory frontend implementation plan

## Goal

Add an administrator inventory workspace for browsing available stock,
filtering products, inspecting movement history, and applying idempotent stock
adjustments. Integrate the backend's stock-conflict behavior into checkout and
refresh inventory-sensitive queries after stock-changing actions.

## Design direction

### Visual thesis

A calm operational ledger: warm neutral canvas, strong ink typography, one
sky-blue action accent, dense readable rows, and minimal card chrome. The
inventory table is the primary workspace; surfaces are reserved for controls
and the selected-product interaction.

### Content plan

1. Operator header with result count and current low-stock threshold.
2. Search, category, stock-status, and threshold controls.
3. Paginated inventory table with clear quantity and status scanning.
4. Selected-item inspector with the current quantity, adjustment form, and
   newest-first movement history.

### Interaction thesis

- Selecting a row keeps the inventory context visible and opens a persistent
  inspector on desktop, with the same route remaining usable on mobile.
- Applying filters or changing pages updates the working set without unrelated
  page navigation.
- A successful adjustment refreshes list, detail, product, and movement data;
  an ambiguous or rejected request keeps its generated idempotency key so the
  operator can safely retry the same intent.

## Routes and API contract

- `/admin/inventory` lists inventory and shows an unselected inspector state.
- `/admin/inventory/:productId` shows the same workspace with that product
  selected.
- Both routes require the existing `ADMIN` protected route contract.
- Inventory is not a global application navigation item. Administrators enter
  it from the route-driven section tabs inside the protected admin area.
- The typed client uses `/api/v1/admin/inventory` for list/detail, adjustment,
  and movement history operations.
- List filters map directly to `page`, `size`, `search`, `category`, `status`,
  and `lowStockThreshold`.
- Adjustment payloads contain a signed non-zero integer `delta`, a nonblank
  reason of at most 500 characters, and a UUID `requestId`.

## Behavioral contract

- Statuses are `IN_STOCK`, `LOW_STOCK`, and `OUT_OF_STOCK`, with consistent
  success, warning, and error badges.
- Adjustment input validates before calling the API.
- `409` adjustment conflicts remain in the inspector with the original form
  values and request ID.
- Checkout `409` displays an inline availability message, preserves the cart,
  and refreshes cart/product queries instead of showing the generic alert.
- Successful checkout and cancellation invalidate product and inventory data.
- Existing product creation, update, and deletion invalidate inventory data.
- The admin dashboard's inventory links route to the new workspace.

## Planned files

- `src/types/inventory.ts`
- `src/lib/api.ts` and `src/lib/api.test.ts`
- `src/pages/admin/inventoryPage.tsx`
- `src/components/admin/AdminInventory.tsx` and focused tests
- `src/AppRoutes.tsx`
- `src/components/layout/Navigation.tsx` and focused tests
- inventory-sensitive checkout, order, dashboard, and product mutation files
  with focused regression tests

## Acceptance

1. Focused inventory, navigation, checkout, order, product, dashboard, and API
   tests pass.
2. `npm test`, `npm run lint`, and `npm run build` pass.
3. The admin workspace is visually checked at desktop and mobile widths against
   the running backend.
4. If changed code intersects Stryker's configured scope, run Layer 1 mutation
   testing. Run one bounded semantic mutant for request-id retry behavior if it
   remains a high-risk stateful path.
5. Preserve unrelated working-tree changes. Publishing and deployment remain a
   separate release phase with their own CI, immutable-image, compatibility,
   and production verification gates.
