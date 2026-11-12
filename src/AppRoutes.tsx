import { Routes, Route, Navigate } from 'react-router';
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
import { LlmChatExperience, LlmGenerateExperience, LlmToolExperience } from './pages/llm/llmModePages';
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
import { AdminInventoryPage } from './pages/admin/inventoryPage';
import { TrafficMonitorPage } from './pages/traffic/trafficPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RedirectIfAuthenticated } from './components/RedirectIfAuthenticated';
import { WebMcpPage } from './features/webmcp/WebMcpPage';

import { WishlistPage } from './pages/wishlist/wishlistPage';
import { MyReturnsPage } from './pages/returns/myReturnsPage';
import { WarehousePage } from './pages/warehouse/warehousePage';
import { TrackingPage } from './pages/tracking/trackingPage';
import { AdminCouponsPage } from './pages/admin/couponsPage';
import { AdminReviewsPage } from './pages/admin/reviewsPage';
import { AdminReturnsPage } from './pages/admin/returnsPage';
import { AdminPurchasingPage } from './pages/admin/purchasingPage';
import { OrderPaymentPage } from './pages/orders/orderPaymentPage';
import { LoyaltyPage } from './pages/account/loyaltyPage';
import { WebhooksPage } from './pages/webhooks/webhooksPage';
import { AdminGiftCardsPage } from './pages/admin/giftCardsPage';
import { AdminVatRatesPage } from './pages/admin/vatRatesPage';
import { AdminCurrenciesPage } from './pages/admin/currenciesPage';
import { AdminPaymentsPage } from './pages/admin/paymentsPage';
import { AdminWebhooksPage } from './pages/admin/webhooksPage';
import { isPaymentEnabled, isWarehouseEnabled } from './lib/runtimeConfig';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage />} />
      
      {/* Public routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/webmcp" element={<ProtectedRoute><WebMcpPage /></ProtectedRoute>} />
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
        path="/llm/chat"
        element={
          <ProtectedRoute>
            <LlmChatExperience />
          </ProtectedRoute>
        }
      />
      <Route
        path="/llm/generate"
        element={
          <ProtectedRoute>
            <LlmGenerateExperience />
          </ProtectedRoute>
        }
      />
      <Route
        path="/llm/tools"
        element={
          <ProtectedRoute>
            <LlmToolExperience />
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
        path="/admin/inventory"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminInventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory/:productId"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminInventoryPage />
          </ProtectedRoute>
        }
      />
      
      {/* Commerce extensions */}
      <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      <Route path="/account/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
      {/* Served by payment-service; hidden when a build sets VITE_PAYMENT_ENABLED=false. */}
      {isPaymentEnabled() && <Route path="/orders/:id/pay" element={<ProtectedRoute><OrderPaymentPage /></ProtectedRoute>} />}
      <Route path="/admin/coupons" element={<ProtectedRoute requiredRole="ADMIN"><AdminCouponsPage /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute requiredRole="ADMIN"><AdminReviewsPage /></ProtectedRoute>} />
      {/* Served by warehouse-service; hidden when a build sets VITE_WAREHOUSE_ENABLED=false. */}
      {isWarehouseEnabled() && (
        <>
          {/* Public parcel tracking: no login. */}
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/track/:number" element={<TrackingPage />} />
          <Route path="/returns" element={<ProtectedRoute><MyReturnsPage /></ProtectedRoute>} />
          <Route path="/warehouse" element={<ProtectedRoute requiredRole={['WAREHOUSE', 'ADMIN']}><WarehousePage /></ProtectedRoute>} />
          <Route path="/admin/returns" element={<ProtectedRoute requiredRole="ADMIN"><AdminReturnsPage /></ProtectedRoute>} />
          <Route path="/admin/purchasing" element={<ProtectedRoute requiredRole="ADMIN"><AdminPurchasingPage /></ProtectedRoute>} />
        </>
      )}
      {/* Webhooks and commerce settings */}
      <Route path="/account/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
      <Route path="/admin/gift-cards" element={<ProtectedRoute requiredRole="ADMIN"><AdminGiftCardsPage /></ProtectedRoute>} />
      <Route path="/admin/vat-rates" element={<ProtectedRoute requiredRole="ADMIN"><AdminVatRatesPage /></ProtectedRoute>} />
      <Route path="/admin/currencies" element={<ProtectedRoute requiredRole="ADMIN"><AdminCurrenciesPage /></ProtectedRoute>} />
      <Route path="/admin/webhooks" element={<ProtectedRoute requiredRole="ADMIN"><AdminWebhooksPage /></ProtectedRoute>} />
      {/* Served by payment-service; hidden when a build sets VITE_PAYMENT_ENABLED=false. */}
      {isPaymentEnabled() && (
        <Route path="/admin/payments" element={<ProtectedRoute requiredRole="ADMIN"><AdminPaymentsPage /></ProtectedRoute>} />
      )}
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
