import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { HomePage } from './pages/home';
import { UsersPage } from './pages/users';
import { EditUserPage } from './pages/edit-user';
import { EmailPage } from './pages/email';
import { QrCodePage } from './pages/qr';
import { LlmPage } from './pages/llm';
import { ProtectedRoute } from './components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:username/edit"
        element={
          <ProtectedRoute>
            <EditUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email"
        element={
          <ProtectedRoute>
            <EmailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr"
        element={
          <ProtectedRoute>
            <QrCodePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/llm"
        element={
          <ProtectedRoute>
            <LlmPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
} 