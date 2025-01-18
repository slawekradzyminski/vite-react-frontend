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
│   ├── ui/            # Base UI components (button, input, etc.)
│   └── ProtectedRoute.tsx  # Auth wrapper component
├── lib/               # Utilities and API client
│   ├── api.ts         # Axios instance and API endpoints
│   └── utils.ts       # Utility functions
├── pages/             # Page components
│   ├── login.tsx      # Login page
│   ├── register.tsx   # Registration page
│   ├── home.tsx       # Home page
│   ├── users.tsx      # Users list page
│   └── edit-user.tsx  # User edit page
├── types/             # TypeScript type definitions
│   └── auth.ts        # Auth-related types
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
- Responsive design

## API Integration

The application integrates with a REST API running on `http://localhost:4001` that provides:

### Authentication Endpoints
- POST `/users/signin` - Login
- POST `/users/signup` - Registration
- GET `/users/refresh` - Token refresh
- GET `/users/me` - Current user info

### User Management Endpoints
- GET `/users` - List all users
- PUT `/users/{username}` - Update user
- DELETE `/users/{username}` - Delete user

All endpoints except login and register require Bearer token authentication.

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

## For Future AI Sessions

### Key Implementation Details

1. **Authentication Flow**:
   - JWT tokens stored in localStorage
   - Automatic token injection via axios interceptor
   - Protected routes verify token using /users/me endpoint

2. **Role-Based Access**:
   - Admin features check for 'ROLE_ADMIN'
   - UI elements conditionally rendered based on role
   - Server-side role verification on protected endpoints

3. **State Management**:
   - React Query for server state
   - Automatic cache invalidation on mutations
   - Optimistic updates for better UX

4. **Component Architecture**:
   - Shadcn/ui-style components in /components/ui
   - Form handling with native FormData
   - Consistent error handling pattern

### Common Tasks

1. **Adding New Features**:
   - Place new components in appropriate directories
   - Follow existing patterns for API integration
   - Use React Query for data fetching
   - Implement proper type definitions

2. **Styling Guidelines**:
   - Use Tailwind CSS utility classes
   - Follow shadcn/ui component patterns
   - Maintain responsive design

3. **Authentication**:
   - Use ProtectedRoute component for new protected routes
   - Check roles using currentUser?.data.roles.includes()
   - Handle 401/403 errors in API interceptor

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Testing Guidelines

- Each new component must have accompanying tests
- Use Vitest for unit and component testing
- Follow the given/when/then pattern in test comments
- Test files should be co-located with the component (same directory)
- Use React Testing Library for component testing
- Mock external dependencies (e.g., axios) appropriately
- Maintain high test coverage for critical paths

### Example Test Structure
```typescript
// given
describe('ComponentName', () => {
  // when
  it('should behave in a certain way', () => {
    // then
    expect(result).toBe(expected);
  });
});
```

### Running Tests
```bash
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
npm run test:ui     # Run tests with UI
npm run test:coverage # Run tests with coverage report
```
