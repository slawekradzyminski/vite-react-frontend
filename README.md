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

The backend service runs on `http://localhost:4001` and provides:
- API Documentation: `/v3/api-docs`
- Swagger UI: `/swagger-ui/index.html`
- H2 Database Console: `/h2-console`

For detailed implementation, refer to `backend.md`.
