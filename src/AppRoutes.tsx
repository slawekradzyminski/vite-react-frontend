import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/loginPage';
import { RegisterPage } from './pages/auth/registerPage';
import { ForgotPasswordPage } from './pages/auth/forgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/resetPasswordPage';
import { HomePage } from './pages/home/homePage';
import { UsersPage } from './pages/users/usersPage';
import { EditUserPage } from './pages/users/editUserPage';
import { EmailPage } from './pages/email/emailPage';
import { QrCodePage } from './pages/qr/qrPage';
import { LlmPage } from './pages/llm/llmPage';
import { Profile } from './pages/profile/profilePage';
import { ProductsPage } from './pages/products/productsPage';
import { ProductDetailsPage } from './pages/products/productDetailsPage';
import { CartPage } from './pages/cart/cartPage';
import { CheckoutPage } from './pages/checkout/checkoutPage';
import { OrderDetailsPage } from './pages/orders/orderDetailsPage';
import { AdminDashboardPage } from './pages/admin/dashboardPage';
import { AdminProductsPage } from './pages/admin/productsPage';
import { AdminProductFormPage } from './pages/admin/productFormPage';
import { AdminOrdersPage } from './pages/admin/ordersPage';
import { TrafficMonitorPage } from './pages/traffic/trafficPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />
      
      {/* Public routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      
      {/* Protected routes */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetailsPage />
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
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      
      {/* E-commerce routes */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Navigate to="/profile" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminProductFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/edit/:id"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminProductFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminOrdersPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/traffic"
        element={
          <ProtectedRoute>
            <TrafficMonitorPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
} 
