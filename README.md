# Vite React Authentication App

A modern React application built with Vite that implements user authentication and management.

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components based on shadcn/ui
- **State Management**: React Query for server state
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Authentication**: JWT-based authentication

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components
│   └── ProtectedRoute.tsx  # Auth wrapper component
├── lib/               # Utilities and API client
│   ├── api.ts         # Axios instance and API endpoints
│   └── utils.ts       # Utility functions
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── App.tsx            # Main application component
```

## Features

- User authentication (login/register)
- Protected routes with automatic token verification
- Role-based access control (Admin/Client roles)
- User management:
  - View all users
  - Edit user details (admin only)
  - Delete users (admin only)
- Modern UI components
- Type-safe API calls
- QR code generator
- Responsive design
- Ecommerce features
- Admin dashboard
- LLM assistant workspace with dedicated **Chat**, **Generate**, and **Tools** modes

### LLM Assistant overview

- `/llm` is a landing page that explains when to use each mode and links to `/llm/chat`, `/llm/generate`, and `/llm/tools`.
- **Chat** streams conversations through `qwen3.5:2b` and can expose the model’s thinking traces on demand.
- **Generate** also targets `qwen3.5:2b` but uses a single-prompt workflow with the same temperature + thinking controls.
- **Tools** is the catalog/Grokipedia playground pinned to `qwen3.5:2b`, showing live tool call notices, tool outputs, and the same opt-in thinking control for tool-focused runs.
- The Tools mode fetches runtime tool schemas from the backend at `/api/v1/ollama/chat/tools/definitions` and renders an expandable JSON viewer so you see exactly what’s passed to the LLM.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:8081.

For the containerized training stack, run the same topology used by CI:

```bash
docker compose up -d
```

That builds this frontend into its production nginx image, keeps the backend on the internal Docker network, and publishes a gateway on `http://localhost:8081`.

## Runtime Profiles

The frontend supports one codepath across these runtime shapes:

- local Vite development
- Dockerized Vite development
- lightweight Docker runtime
- full Docker / localstack-style runtime
- server deployment behind a single public origin such as `https://awesome.byst.re`

Built frontend assets are expected to run same-origin with the backend gateway. Only Vite development mode talks directly to the backend by default.

The frontend expects the backend business API only under `/api/v1/...`. There is no old-path fallback for `/users/...`, `/email`, `/qr/create`, `/api/ollama/...`, or `/ws-traffic`.

## Environment Contract

The frontend runtime behavior is controlled by these environment variables. Vite reads them at build or dev-server time (`import.meta.env`); the nginx image does not read them at container start:

- `VITE_API_BASE_URL`
  Optional. Overrides the resolved API origin completely. Use this only when the frontend must call a non-default backend origin.
- `VITE_WAREHOUSE_ENABLED`
  Optional, default `true`. The warehouse board, My returns, admin returns and purchasing screens and order shipment tracking need warehouse-service. Set it to `false` for a build that runs without warehouse-service; the frontend then hides those screens and sends no requests to their endpoints. The Dockerfile accepts it as a build argument.
- `VITE_WAREHOUSE_API_BASE_URL`
  Optional. Origin of warehouse-service for shipments, order tracking, returns, suppliers, purchase orders and reorder suggestions. Defaults to the resolved API origin, which is correct behind the gateway. Set it to `http://localhost:4003` only when the Vite dev server talks to the services directly. The Dockerfile accepts it as a build argument.
- `VITE_PAYMENT_ENABLED`
  Optional, default `true`. Card payment screens need payment-service. Set it to `false` for a build that runs without payment-service; the frontend then hides those screens and sends no requests to their endpoints. The Dockerfile accepts it as a build argument.
- `VITE_PAYMENT_API_BASE_URL`
  Optional. Origin of payment-service for payments and the admin payment list. Defaults to the resolved API origin, which is correct behind the gateway. Set it to `http://localhost:4004` only when the Vite dev server talks to the services directly. The Dockerfile accepts it as a build argument.
- `VITE_DOCKER`
  Dev-only flag. When `true`, Vite development mode targets `http://host.docker.internal:4001` instead of `http://localhost:4001`.

Default behavior by profile:

- local Vite dev: API `http://localhost:4001` (warehouse and payment calls too, unless `VITE_WAREHOUSE_API_BASE_URL` or `VITE_PAYMENT_API_BASE_URL` is set), reset base `${window.location.origin}/reset`
- Dockerized Vite dev: API `http://host.docker.internal:4001` when `VITE_DOCKER=true`
- built Docker/server runtime: API same-origin via `window.location.origin`, reset base `${window.location.origin}/reset` unless overridden

Product image URLs are rendered exactly as provided by the backend. Relative paths like `/images/iphone.png` are supported and preferred for same-origin deployments.

## Static Asset Routing Rule

When this frontend is deployed behind the `awesome-localstack` gateway, the `/images/...` path is owned by the gateway and is used for shared static product images mounted from the stack host.

That means:

- frontend-owned branding assets must not live under `/images/...`
- use a separate public prefix such as `/branding/...` for logos, favicons, and similar frontend-only files
- if a logo works locally from the frontend container but returns `404` behind the gateway, check for a path collision with the gateway’s `/images/...` alias first

Current convention in this repo:

- product/backend-managed images: `/images/...`
- frontend branding assets: `/branding/...`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `./build-multiarch.sh <version>` - Build and push the multi-arch frontend image, for example `./build-multiarch.sh 3.6.2`

## Project Guidelines

This project follows specific guidelines defined in Cursor rules. These rules are located in the `.cursor/rules` directory:

1. `.cursor/rules/project-structure.md`
   - Directory structure
   - Component organization
   - Styling guidelines
   - API integration patterns
   - State management
   - Code style

2. `.cursor/rules/testing.md`
   - Unit and E2E test patterns
   - Test file organization
   - Testing best practices
   - Available test commands

3. `.cursor/rules/environment.md`
   - Development environment setup
   - Backend services configuration
   - Common issues and solutions
   - Development workflow

4. `.cursor/rules/ai-agent.md`
   - AI agent behavior
   - Test execution requirements
   - Change validation process
   - Error handling procedures

## Backend Integration

Run https://github.com/slawekradzyminski/test-secure-backend

The backend service runs on `http://localhost:4001` and provides:
- API Documentation: `/v3/api-docs`
- Swagger UI: `/swagger-ui/index.html`
- H2 Database Console: `/h2-console`

Business API calls from this frontend now target:
- `/api/v1/users/...`
- `/api/v1/email`
- `/api/v1/qr/create`
- `/api/v1/products/...`
- `/api/v1/orders/...`
- `/api/v1/cart/...`
- `/api/v1/traffic/info`
- `/api/v1/ollama/...`
- `/api/v1/ws-traffic`

## Password Reset Flow

The frontend now exposes:

- `/forgot-password` – allows anonymous users to request a reset using their username or e-mail. The backend builds the reset link from its own `PASSWORD_RESET_FRONTEND_BASE_URL` setting.
- `/reset` – consumes the token delivered via e-mail and lets the user pick a new password.

For local development you can retrieve reset links in two ways:
1. **Local Spring profile** – authenticate as an admin, call `DELETE /api/v1/local/email/outbox` before tests to clear it, then inspect `GET /api/v1/local/email/outbox` (default: `http://localhost:4001/api/v1/local/email/outbox`) to grab the latest payload and token. Protected sandbox deployments also require `X-Local-Outbox-Key`, sourced by the E2E suite from `LOCAL_EMAIL_OUTBOX_ACCESS_KEY`.
2. **Docker/localstack profile** – open Mailhog at [http://localhost:8025](http://localhost:8025) and copy the reset link from the emulated e-mail.

After successfully resetting a password the app redirects back to `/login` and displays a toast confirming the update.

## Testing

Run all checks before submitting changes:

```bash
npm run build          # Type-check + Vite production build
npm test               # Vitest suite
npx playwright test    # E2E tests (requires the docker compose gateway on :8081)
```

Before launching Playwright:
1. Run `docker compose up -d` from this repository. The compose stack builds the frontend nginx image and starts backend, warehouse-service, payment-service, Ollama mock, and the `8081` gateway.
2. Wait for the stack with `./scripts/wait-for-backend.sh` and `./scripts/wait-for-frontend.sh`.
3. Run `npx playwright test`.

Playwright exercises the full stack (e.g., the Tools tab triggers real streaming tool calls), so deterministic results come from the containerized mock service. Backend API calls go through the same gateway origin as the browser: `http://localhost:8081/api/...`.

CI uses this repository's `docker-compose.yml`. After backend changes, publish a new backend image from `../test-secure-backend` with `./build-multiarch.sh <version>`, then run frontend CI with `BACKEND_IMAGE=slawekradzyminski/backend:<version>` or update the compose default tag. `WAREHOUSE_IMAGE` and `PAYMENT_IMAGE` override warehouse-service and payment-service the same way.

## Release pipeline

Pushing a `vX.Y.Z` tag runs `.github/workflows/publish-image.yml`:

1. `validate` checks that the commit is on `main` and that the tag matches the project version.
2. `check-prior-verification` reads the git tree of the tagged commit and compares it with
   the trees of the commits behind the last 100 successful `ci.yml` runs (GitHub API,
   `actions: read`). PRs are squash-merged, so the tag commit is new but its tree is the
   tree of the PR head that passed CI (when the branch was up to date with `main`), or
   of the `main` push whose run has already finished.
3. When a matching run exists, `verify` (unit tests and build) and the sharded `e2e-tests`
   are skipped and the run summary links the CI run that verified the tree.
   Otherwise they run as before. Manual (`workflow_dispatch`) prereleases always run them,
   and any API error falls back to the full verification. A failed or cancelled
   verification job still blocks the release.
4. `publish` builds the amd64 runtime image, smoke-tests `/` and `/login` on both paths
   (CI only builds the image with E2E build arguments), then pushes the multi-platform image.

A tag whose tree already passed `ci.yml` publishes in about 4 minutes instead of 9.

The release does not reuse an image from the PR: CI builds the image with E2E build
arguments and never pushes it, and the published image carries the
release commit in its labels.

## Commerce transport

The signed-in **Shop API** selector switches products, carts, orders, and admin
inventory between REST and GraphQL. REST is the default; switching reloads the
page and clears cached data. See [the storefront guide](docs/GRAPHQL_STOREFRONT.md)
for scope, authentication behavior, and verification commands.
