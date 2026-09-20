# REST and GraphQL storefront modes

The signed-in navigation has a **Shop API** selector. REST remains the default.
Select GraphQL to use the same pages and shopping workflow through
`POST /api/v1/graphql`. The backend includes GraphQL automatically; the selector
changes which transport this browser tab uses, not which backend APIs exist.

The selection is stored in session storage per tab. Switching reloads the page,
keeping the current route and authentication while discarding the complete query
cache. Unsaved form edits are lost on that reload. Switching is disabled while a
mutation is pending, and the handler rechecks pending mutations at click time.
Logging out clears all cached data, including private orders and admin inventory.

## Covered operations

- Product listing, details, creation, updates, and deletion.
- Cart reads, additions, quantity changes, removal, and clearing.
- Checkout, personal order history, order details, and cancellation.
- Admin order listing and status changes.
- Admin inventory listing, filters, details, movements, and adjustments.

Login, refresh, user profile, MFA, SSO, and non-commerce features retain their
existing REST interfaces. The GraphQL adapter uses the existing authenticated
Axios instance and its coordinated token refresh. HTTP 401 can trigger the
existing refresh/retry flow before the operation executes. GraphQL execution
errors do not refresh credentials, log the user out, or silently fall back to
REST. Checkout is not automatically retried after an uncertain network failure.

Customers remain scoped to their own carts and orders by the backend. Personal
order history explicitly supplies the authenticated username, including for
admins; the admin order-management page intentionally requests all orders.
Inventory adjustment request IDs are passed through unchanged for safe retries.

## Data and presentation

The adapter preserves the response shape expected by current components. GraphQL
IDs are checked before conversion into the UI's numeric identifiers. Decimal
strings become the existing numeric display values; checkout sends an address,
not a client-calculated monetary total. Backend totals remain authoritative.

GraphQL cart responses include product names, images, and snapshot prices. The
cart enrichment hook uses these directly, avoiding per-item product requests.
Catalog listing loads bounded pages of 25 until the catalog is complete. Product
timestamps are optional in the frontend type because GraphQL does not expose
those fields; the adapter does not invent dates.

## Verification

```bash
npm test
npm run build
npm run lint
npm run test:mutation
APP_BASE_URL=http://127.0.0.1:14081 npm run test:e2e:commerce
```

The commerce browser suite requires the new GraphQL backend and this frontend
build, with the standard local demo admin seed. Run it only against a disposable
local stack: it creates users/products and exercises real checkout, cancellation,
and stock adjustments. The suite has its own config and uses no retries.

For local gateway verification, the workspace compatibility Compose stack can
run `awesome-backend:graphql-default-local`; its frontend service can mount this
repository's `dist` directory over `/usr/share/nginx/html` read-only. The original
user stack and deployed image pins are unaffected.

`src/lib/commerce.schema.graphql` is a checked-in copy of the backend SDL. When
changing that schema, update the copy from
`test-secure-backend/src/main/resources/graphql-preview/commerce.graphqls` and
rerun the schema-backed operation tests and real browser suite.

Stryker uses `vitest.mutation.config.ts` for test selection instead of `testFiles`.
This avoids [Stryker 9.6.1's late activation of static mutants](https://github.com/stryker-mutator/stryker-js/issues/6144).
Framework mutations and the workspace semantic mutation lab remain separate gates.

GraphiQL is available separately at `/api/v1/graphiql`; enter the access token in
its Headers tab. Native gRPC inventory is now available through a separate optional backend
listener; it is not a browser transport. GraphQL traffic-monitor presentation and deployment are
separate planned increments. Swagger continues to document REST.

## Protocol traffic monitoring

Traffic Monitor now distinguishes REST, GraphQL, and native gRPC events.
GraphQL errors are shown in red even with HTTP 200; gRPC uses native status codes.
The page exposes the current traffic session ID for GraphiQL headers or grpcurl
metadata. New protocol records contain safe operation metadata only. See the
[protocol testing lab](../../awesome-localstack/docs/PROTOCOL_TESTING_LAB.md).
