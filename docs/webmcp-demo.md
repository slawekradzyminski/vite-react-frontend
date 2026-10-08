# WebMCP in the existing shop

A runnable companion to **Understanding WebMCP: Playwright, AI Agents and Testing**.
The existing `/products` page and the separate `/webmcp` fault lab use this application's existing `products` and `cart` clients,
authentication interceptor and backend. It registers three native browser tools:
`search_products`, `add_to_cart`, and `get_cart`.

## Requirements and startup

Use Node 24.15 or later in the Node 24 family. Start the existing training stack:

```sh
git clone https://github.com/slawekradzyminski/awesome-localstack.git
cd awesome-localstack
docker compose -f lightweight-docker-compose.yml up -d
```

Wait until `http://localhost:8081/login` and
`http://localhost:8081/actuator/health` respond. In this frontend directory:

```sh
npm ci
npx playwright install chromium
npm run demo:webmcp
```

Open `http://localhost:5180/login`. The local training account `client` / `client`
can browse the demo. After signing in, open `http://localhost:5180/products?inspect=1`.
The existing catalogue registers the tools and shares its product/cart caches with
them. Expand the inspector to see schemas, the request flow and tool call history.
Use `/webmcp` only for controlled fault experiments.
Normal browsers can use the UI even without WebMCP. To try native tools, use the
bundled Chromium with the CLI configuration below.

The demo server uses the normal Vite configuration and a same-origin API proxy to
the already running gateway. It does not restart or replace the existing stack.
Optional `WEBMCP_BACKEND_URL` changes the upstream gateway (default
`http://localhost:8081`). The proxy supplies that gateway's origin; this is a
local development arrangement, not production CORS policy.

## Native Playwright CLI walkthrough

The npm package pins the Playwright release family to 1.64. `webmcp.cli.json`
selects bundled Chromium and enables the experimental feature. Do not rely on
whatever older Chrome happens to be installed on the machine.

```sh
npx playwright cli -s=shop open http://localhost:5180/login --config webmcp.cli.json
npx playwright cli -s=shop snapshot
```

Sign in using the observed snapshot refs, or use the known accessible controls:

```sh
npx playwright cli -s=shop fill "getByRole('textbox', { name: 'Username' })" client
npx playwright cli -s=shop fill "getByRole('textbox', { name: 'Password' })" client
npx playwright cli -s=shop click "getByRole('button', { name: 'Sign in', exact: true })"
npx playwright cli -s=shop goto http://localhost:5180/products?inspect=1
npx playwright cli -s=shop run-code "async page => await page.getByText('3 native WebMCP tools registered').waitFor()"
npx playwright cli -s=shop webmcp-list
npx playwright cli -s=shop webmcp-call search_products --params '{"query":"Books","inStockOnly":true}'
```

Read the returned IDs, prices and stock. Use the chosen ID rather than copying
an ID from another run:

```sh
npx playwright cli -s=shop webmcp-call add_to_cart --params '{"productId":YOUR_PRODUCT_ID,"quantity":2}'
npx playwright cli -s=shop webmcp-call get_cart --params '{}'
npx playwright cli -s=shop snapshot
npx playwright cli -s=shop close
```

The `YOUR_PRODUCT_ID` placeholder must be replaced with a number. Cart writes
are real writes to the training backend. Clear the cart using the UI before
repeating the experiment. An add is **additional units**; it is not idempotent.

An agent prompt to try:

> Find the cheapest available book, add two units to my cart, and report the
> total. Stop before checkout. Confirm the cart is empty before beginning.

For the UI baseline, open `/products?tools=off&inspect=1` or `/webmcp?tools=off`. Native tool discovery then returns
an empty list. The tools are also removed when leaving either shop route for a non-shop route such as `/profile`.

## Controlled faults

The scenario selector intentionally changes behavior only on `/webmcp`.
The original `/products` page always uses healthy tool behavior:

| URL parameter | Fault |
| --- | --- |
| `fault=broken-button` | Clicking Add to cart does nothing; the native tool still writes |
| `fault=wrong-product` | The tool submits another available product in the same category |
| `fault=stale-cart` | Tools return saved data but omit updating the visible cart |
| `fault=wrong-total` | The displayed total is one cent higher than the saved total |

For the wrong-product case, seed at least two available products in the same
category. The automated fixture does this without touching existing products.
These are demonstrations, not discovered production defects. There are no
checkout, order, credential-reading or arbitrary-code-execution tools.

## Verification

```sh
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e:webmcp
```

The browser suite registers a fresh client and creates three namespaced products
per test, using the bootstrap local admin only for setup and cleanup. All tested
cart operations run as the fresh client. Fixture cleanup clears its cart, deletes
its products and removes its user. Optional `ADMIN_USERNAME` and `ADMIN_PASSWORD`
are the existing test-suite overrides for local setup credentials. Do not point
the suite at a production backend.

The suite checks native discovery, real writes, an independent HTTP read, visible
state, stock failures, additive semantics, authentication, registration cleanup,
four controlled faults, changing scenarios, and a 390px viewport. The normal
browser contract is also checked with native tools disabled.

```sh
npm run test:e2e:webmcp -- --repeat-each=3
```

On 8 October 2026, all 19 browser cases passed three times: **57/57 executions**,
about **76.9 seconds** in total, including isolated API setup and cleanup. These
are deterministic Playwright tests; they do not measure an LLM's reasoning,
success rate, tokens or API cost. The fault tests pass because they assert the
deliberately incorrect behavior and its disagreement with the other interface.

The raw Playwright JSON report is written to `reports/webmcp/tests.json`.
The published compact report in `docs/webmcp/verification.json` omits credentials
and request headers. Semantic challenges are recorded separately there; their
outcomes must not be merged with a Stryker mutation score.

## Experimental API compatibility

This demo was tested with Playwright 1.64.0 and bundled Chromium 156.0.8078.4.
That browser exposes `document.modelContext`, as does the current WebMCP
proposal. Playwright's API documentation still refers to
`navigator.modelContext`. Registration uses an `AbortSignal` and cleanup aborts
it, including during React Strict Mode and client-side route changes.

The UI inspector is not a WebMCP polyfill. Its schema and call log are for
observation; native discovery and invocation happen through the browser API.
Tool descriptions and results remain page-provided, untrusted content.

Sources: [Playwright 1.64](https://github.com/microsoft/playwright/releases/tag/v1.64.0),
[Playwright WebMCP API](https://playwright.dev/docs/api/class-webmcp),
[WebMCP proposal](https://github.com/webmachinelearning/webmcp).

## Live demo

After release, open [the existing products page](https://awesome.byst.re/products?inspect=1)
or [the fault lab](https://awesome.byst.re/webmcp) and sign in with your demo account.
These use the deployed training application and its actual session. The WebMCP
feature requires a compatible browser with the experimental feature enabled;
the normal shopping UI and inspector work in ordinary browsers.
