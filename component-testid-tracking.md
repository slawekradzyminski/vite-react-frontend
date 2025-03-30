# Component data-testid Tracking

This file tracks the progress of adding data-testid attributes to all components in the React application to improve testability.

## UI Components

- [x] Button (`src/components/ui/button.tsx`)
- [x] Input (`src/components/ui/input.tsx`)
- [x] Label (`src/components/ui/label.tsx`)
- [x] Spinner (`src/components/ui/spinner.tsx`)
- [x] Tabs (`src/components/ui/tabs.tsx`)
- [x] Textarea (`src/components/ui/textarea.tsx`)
- [x] ToastProvider (`src/components/ui/ToastProvider.tsx`)

## Core Components

- [x] ProtectedRoute (`src/components/ProtectedRoute.tsx`)

## Layout Components

- [x] Navigation (`src/components/layout/Navigation.tsx`)

## User Components

- [x] UserEditForm (`src/components/user/UserEditForm.tsx`)

## Admin Components 

- [x] AdminProductList (`src/components/admin/AdminProductList.tsx`)
- [x] AdminDashboard (`src/components/admin/AdminDashboard.tsx`)
- [x] AdminOrderList (`src/components/admin/AdminOrderList.tsx`)

## Cart Components

- [x] CartPage (`src/components/cart/CartPage.tsx`)
- [x] CartItem (`src/components/cart/CartItem.tsx`)
- [x] CartSummary (`src/components/cart/CartSummary.tsx`)
- [x] AddToCartButton (`src/components/cart/AddToCartButton.tsx`)

## Order Components

- [x] OrderList (`src/components/orders/OrderList.tsx`)
- [x] OrderDetails (`src/components/orders/OrderDetails.tsx`)

## Product Components

- [x] ProductList (`src/components/products/ProductList.tsx`)
- [x] ProductDetails (`src/components/products/ProductDetails.tsx`)
- [x] ProductCard (`src/components/products/ProductCard.tsx`)
- [x] AdminProductForm (`src/components/products/AdminProductForm.tsx`)

## Email Components

- [x] EmailForm (`src/components/email/EmailForm.tsx`)

## Checkout Components

- [x] CheckoutPage (`src/components/checkout/CheckoutPage.tsx`)
- [x] CheckoutForm (`src/components/checkout/CheckoutForm.tsx`)

## QR Components

- [x] QrCodeGenerator (`src/components/qr/QrCodeGenerator.tsx`)

## Page Components

- [x] HomePage (`src/pages/home.tsx`)
- [x] LoginPage (`src/pages/login.tsx`)
- [x] RegisterPage (`src/pages/register.tsx`)
- [x] UsersPage (`src/pages/users.tsx`)
- [x] ProductDetailsPage (`src/pages/product-details.tsx`)
- [x] ProductsPage (`src/pages/products.tsx`)
- [x] CartPage (`src/pages/cart.tsx`)
- [x] CheckoutPage (`src/pages/checkout.tsx`)
- [x] OrderDetailsPage (`src/pages/order-details.tsx`)
- [x] EditUserPage (`src/pages/edit-user.tsx`)

### Subdirectories
- [x] Email Pages (`src/pages/email/`)
- [x] Profile Pages (`src/pages/profile/`)
- [x] Admin Pages (`src/pages/admin/`)
- [x] Traffic Pages (`src/pages/traffic/`)
- [x] LLM Pages (`src/pages/llm/`)
- [x] Ollama Chat Pages (`src/pages/ollama-chat/`)
- [x] Ollama Generate Pages (`src/pages/ollama-generate/`)
- [x] QR Pages (`src/pages/qr/`)

## Progress

- Total components identified: 35
- Components completed: 35
- Components remaining: 0

## Notes

- Data-testid attributes should follow a consistent naming convention: `{component-name}-{element-type}` (e.g., `button-submit`, `input-username`)
- Each component's test files should be updated to use the new data-testid attributes
- E2E tests may need updates to use the new data-testid attributes 