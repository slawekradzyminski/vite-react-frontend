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
- **Chat** streams conversations through `qwen3:0.6b` and can expose the model’s thinking traces on demand.
- **Generate** also targets `qwen3:0.6b` but uses a single-prompt workflow with the same temperature + thinking controls.
- **Tools** is the catalog/Grokipedia playground pinned to `qwen3:4b-instruct`, showing live tool call notices, tool outputs, and a disabled thinking notice (that model does not emit reasoning).
- The Tools mode fetches runtime tool schemas from the backend at `/api/ollama/chat/tools/definitions` and renders an expandable JSON viewer so you see exactly what’s passed to the LLM.

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

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

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

## Password Reset Flow

The frontend now exposes:

- `/forgot-password` – allows anonymous users to request a reset using their username or e-mail. The reset link base URL defaults to `${window.location.origin}/reset` and can be overridden via the optional `VITE_PASSWORD_RESET_BASE_URL` env variable.
- `/reset` – consumes the token delivered via e-mail and lets the user pick a new password.

For local development you can retrieve reset links in two ways:
1. **Local Spring profile** – call `DELETE /local/email/outbox` before tests to clear it, then inspect `GET /local/email/outbox` (default: `http://localhost:4001/local/email/outbox`) to grab the latest payload and token.
2. **Docker/localstack profile** – open Mailhog at [http://localhost:8025](http://localhost:8025) and copy the reset link from the emulated e-mail.

After successfully resetting a password the app redirects back to `/login` and displays a toast confirming the update.

## Testing

Run all checks before submitting changes:

```bash
npm run build          # Type-check + Vite production build
npm test               # Vitest suite
npx playwright test    # E2E tests (requires backend on :4001, dev server on :8081, and ollama-mock on :11434)
```

Before launching Playwright:
1. Start the Spring backend (`./mvnw spring-boot:run`) so the frontend can authenticate and proxy to Ollama.
2. Start the deterministic Ollama mock (`cd ../ollama-mock && ./mvnw spring-boot:run`) – it listens on `http://localhost:11434` and the backend is already configured to point at it when the local profile is active.
3. Run `npm run dev` to serve the Vite app on `http://localhost:8081`.

Playwright exercises the full stack (e.g., the Tools tab triggers real streaming tool calls), so deterministic results come from that mock service. The tests still rely on the backend’s local email outbox endpoint, so run the backend with the `local` Spring profile or adapt helpers to pull tokens from Mailhog when using docker/localstack.
