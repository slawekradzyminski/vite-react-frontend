# Page Restructuring Plan

This document tracks the progress of restructuring the `/src/pages` directory to improve organization and naming conventions.

## Goals
1. Move all page components into appropriate subfolders
2. Replace `index.tsx` with descriptive filenames (e.g., `emailPage.tsx`)
3. Update imports across the project to maintain functionality
4. Ensure all tests continue to pass

## Page Structure Plan

### Regular Pages
- [x] `src/pages/home.tsx` → `src/pages/home/homePage.tsx`
- [x] `src/pages/login.tsx` → `src/pages/auth/loginPage.tsx`
- [x] `src/pages/register.tsx` → `src/pages/auth/registerPage.tsx`
- [x] `src/pages/users.tsx` → `src/pages/users/usersPage.tsx`
- [x] `src/pages/edit-user.tsx` → `src/pages/users/editUserPage.tsx`
- [x] `src/pages/products.tsx` → `src/pages/products/productsPage.tsx`
- [x] `src/pages/product-details.tsx` → `src/pages/products/productDetailsPage.tsx`
- [x] `src/pages/cart.tsx` → `src/pages/cart/cartPage.tsx`
- [x] `src/pages/checkout.tsx` → `src/pages/checkout/checkoutPage.tsx`
- [x] `src/pages/order-details.tsx` → `src/pages/orders/orderDetailsPage.tsx`

### Existing Subdirectories to Refactor
- [ ] `src/pages/email/index.tsx` → `src/pages/email/emailPage.tsx`
- [ ] `src/pages/profile/index.tsx` → `src/pages/profile/profilePage.tsx`
- [ ] `src/pages/admin/dashboard.tsx` → `src/pages/admin/dashboardPage.tsx`
- [ ] `src/pages/admin/orders.tsx` → `src/pages/admin/ordersPage.tsx`
- [ ] `src/pages/admin/products.tsx` → `src/pages/admin/productsPage.tsx`
- [ ] `src/pages/admin/product-form.tsx` → `src/pages/admin/productFormPage.tsx`
- [ ] `src/pages/traffic/index.tsx` → `src/pages/traffic/trafficPage.tsx`
- [ ] `src/pages/llm/index.tsx` → `src/pages/llm/llmPage.tsx`
- [ ] `src/pages/ollama-chat/index.tsx` → `src/pages/ollama/chatPage.tsx`
- [ ] `src/pages/ollama-generate/index.tsx` → `src/pages/ollama/generatePage.tsx`
- [ ] `src/pages/qr/index.tsx` → `src/pages/qr/qrPage.tsx`

## Implementation Strategy
1. Create new directories and files
2. Update component exports
3. Update all imports across the project
4. Run tests to verify functionality
5. Remove old files once everything is working

## Progress
- Pages to restructure: 21
- Pages completed: 21
- Pages remaining: 0

## Completed Pages
- [x] src/pages/login.tsx -> src/pages/auth/loginPage.tsx
- [x] src/pages/register.tsx -> src/pages/auth/registerPage.tsx
- [x] src/pages/users.tsx -> src/pages/users/usersPage.tsx
- [x] src/pages/edit-user.tsx -> src/pages/users/editUserPage.tsx
- [x] src/pages/products.tsx -> src/pages/products/productsPage.tsx
- [x] src/pages/product-details.tsx -> src/pages/products/productDetailsPage.tsx
- [x] src/pages/cart.tsx -> src/pages/cart/cartPage.tsx
- [x] src/pages/checkout.tsx -> src/pages/checkout/checkoutPage.tsx
- [x] src/pages/order-details.tsx -> src/pages/orders/orderDetailsPage.tsx
- [x] src/pages/email/index.tsx -> src/pages/email/emailPage.tsx
- [x] src/pages/profile/index.tsx -> src/pages/profile/profilePage.tsx
- [x] src/pages/admin/dashboard.tsx -> src/pages/admin/dashboardPage.tsx
- [x] src/pages/admin/orders.tsx -> src/pages/admin/ordersPage.tsx
- [x] src/pages/admin/products.tsx -> src/pages/admin/productsPage.tsx
- [x] src/pages/admin/product-form.tsx -> src/pages/admin/productFormPage.tsx
- [x] src/pages/traffic/index.tsx -> src/pages/traffic/trafficPage.tsx
- [x] src/pages/llm/index.tsx -> src/pages/llm/llmPage.tsx
- [x] src/pages/ollama-chat/index.tsx -> src/pages/ollama/chatPage.tsx
- [x] src/pages/ollama-generate/index.tsx -> src/pages/ollama/generatePage.tsx
- [x] src/pages/qr/index.tsx -> src/pages/qr/qrPage.tsx

## Next Steps
1. Remove old files after verifying all functionality works
2. Update any remaining imports in the codebase
3. Run full test suite to verify the restructuring hasn't broken anything