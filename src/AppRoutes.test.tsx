import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { AppRoutes } from './AppRoutes';
import { auth } from './lib/api';
import { authStorage } from './lib/authStorage';

// Pages are replaced by text stubs so this test pins down only the route table:
// which path renders which page, and which guard protects it.
vi.mock('./lib/api', () => ({ auth: { me: vi.fn() } }));
vi.mock('./pages/auth/loginPage', () => ({ LoginPage: () => 'page:Login' }));
vi.mock('./pages/auth/registerPage', () => ({ RegisterPage: () => 'page:Register' }));
vi.mock('./pages/auth/forgotPasswordPage', () => ({ ForgotPasswordPage: () => 'page:ForgotPassword' }));
vi.mock('./pages/auth/resetPasswordPage', () => ({ ResetPasswordPage: () => 'page:ResetPassword' }));
vi.mock('./pages/auth/ssoCallbackPage', () => ({ SsoCallbackPage: () => 'page:SsoCallback' }));
vi.mock('./pages/home/homePage', () => ({ HomePage: () => 'page:Home' }));
vi.mock('./pages/users/usersPage', () => ({ UsersPage: () => 'page:Users' }));
vi.mock('./pages/users/editUserPage', () => ({ EditUserPage: () => 'page:EditUser' }));
vi.mock('./pages/email/emailPage', () => ({ EmailPage: () => 'page:Email' }));
vi.mock('./pages/qr/qrPage', () => ({ QrCodePage: () => 'page:QrCode' }));
vi.mock('./pages/llm/llmPage', () => ({ LlmPage: () => 'page:Llm' }));
vi.mock('./pages/llm/llmModePages', () => ({
  LlmChatExperience: () => 'page:LlmChat',
  LlmGenerateExperience: () => 'page:LlmGenerate',
  LlmToolExperience: () => 'page:LlmTools',
}));
vi.mock('./pages/profile/profilePage', () => ({ Profile: () => 'page:Profile' }));
vi.mock('./pages/products/productsPage', () => ({ ProductsPage: () => 'page:Products' }));
vi.mock('./pages/products/productDetailsPage', () => ({ ProductDetailsPage: () => 'page:ProductDetails' }));
vi.mock('./pages/cart/cartPage', () => ({ CartPage: () => 'page:Cart' }));
vi.mock('./pages/checkout/checkoutPage', () => ({ CheckoutPage: () => 'page:Checkout' }));
vi.mock('./pages/orders/orderDetailsPage', () => ({ OrderDetailsPage: () => 'page:OrderDetails' }));
vi.mock('./pages/admin/dashboardPage', () => ({ AdminDashboardPage: () => 'page:AdminDashboard' }));
vi.mock('./pages/admin/productsPage', () => ({ AdminProductsPage: () => 'page:AdminProducts' }));
vi.mock('./pages/admin/productFormPage', () => ({ AdminProductFormPage: () => 'page:AdminProductForm' }));
vi.mock('./pages/admin/ordersPage', () => ({ AdminOrdersPage: () => 'page:AdminOrders' }));
vi.mock('./pages/admin/inventoryPage', () => ({ AdminInventoryPage: () => 'page:AdminInventory' }));
vi.mock('./pages/traffic/trafficPage', () => ({ TrafficMonitorPage: () => 'page:TrafficMonitor' }));
vi.mock('./features/webmcp/WebMcpPage', () => ({ WebMcpPage: () => 'page:WebMcp' }));
vi.mock('./pages/returns/myReturnsPage', () => ({ MyReturnsPage: () => 'page:MyReturns' }));
vi.mock('./pages/warehouse/warehousePage', () => ({ WarehousePage: () => 'page:Warehouse' }));
vi.mock('./pages/admin/returnsPage', () => ({ AdminReturnsPage: () => 'page:AdminReturns' }));
vi.mock('./pages/admin/purchasingPage', () => ({ AdminPurchasingPage: () => 'page:AdminPurchasing' }));
vi.mock('./pages/orders/orderPaymentPage', () => ({ OrderPaymentPage: () => 'page:OrderPayment' }));
vi.mock('./pages/account/loyaltyPage', () => ({ LoyaltyPage: () => 'page:Loyalty' }));

const publicRoutes: Array<[string, string]> = [
  ['/login', 'page:Login'],
  ['/register', 'page:Register'],
  ['/forgot-password', 'page:ForgotPassword'],
  ['/reset', 'page:ResetPassword'],
  ['/auth/sso/callback', 'page:SsoCallback'],
];

const signedInRoutes: Array<[string, string]> = [
  ['/', 'page:Home'],
  ['/webmcp', 'page:WebMcp'],
  ['/products', 'page:Products'],
  ['/products/7', 'page:ProductDetails'],
  ['/users', 'page:Users'],
  ['/users/alice/edit', 'page:EditUser'],
  ['/email', 'page:Email'],
  ['/qr', 'page:QrCode'],
  ['/llm', 'page:Llm'],
  ['/llm/chat', 'page:LlmChat'],
  ['/llm/generate', 'page:LlmGenerate'],
  ['/llm/tools', 'page:LlmTools'],
  ['/profile', 'page:Profile'],
  ['/cart', 'page:Cart'],
  ['/checkout', 'page:Checkout'],
  ['/orders', 'page:Profile'],
  ['/orders/3', 'page:OrderDetails'],
  ['/orders/3/pay', 'page:OrderPayment'],
  ['/account/loyalty', 'page:Loyalty'],
  ['/traffic', 'page:TrafficMonitor'],
];

const adminRoutes: Array<[string, string]> = [
  ['/admin', 'page:AdminDashboard'],
  ['/admin/products', 'page:AdminProducts'],
  ['/admin/products/new', 'page:AdminProductForm'],
  ['/admin/products/edit/5', 'page:AdminProductForm'],
  ['/admin/orders', 'page:AdminOrders'],
  ['/admin/inventory', 'page:AdminInventory'],
  ['/admin/inventory/5', 'page:AdminInventory'],
];

const meResponse = (roles: string[]) =>
  ({
    data: { id: 1, username: 'alice', email: 'alice@example.com', firstName: 'Alice', lastName: 'Doe', roles },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }) as unknown as AxiosResponse;

const signInWithRoles = (roles: string[]) => {
  authStorage.setTokens({ token: 'access-token', refreshToken: 'refresh-token' });
  vi.mocked(auth.me).mockResolvedValue(meResponse(roles));
};

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('AppRoutes access contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(publicRoutes)('renders public route %s without a session', async (path, page) => {
    renderAt(path);

    expect(await screen.findByText(page)).toBeInTheDocument();
    expect(auth.me).not.toHaveBeenCalled();
  });

  it.each([...signedInRoutes, ...adminRoutes])(
    'sends an anonymous visitor of %s to the login page',
    async (path) => {
      renderAt(path);

      expect(await screen.findByText('page:Login')).toBeInTheDocument();
    }
  );

  it.each(signedInRoutes)('renders %s for a signed-in client', async (path, page) => {
    signInWithRoles(['ROLE_CLIENT']);

    renderAt(path);

    expect(await screen.findByText(page)).toBeInTheDocument();
  });

  it.each(adminRoutes)('keeps a client out of admin route %s', async (path, page) => {
    signInWithRoles(['ROLE_CLIENT']);

    renderAt(path);

    expect(await screen.findByText('page:Home')).toBeInTheDocument();
    expect(screen.queryByText(page)).not.toBeInTheDocument();
  });

  it.each(adminRoutes)('renders admin route %s for an admin', async (path, page) => {
    signInWithRoles(['ROLE_ADMIN']);

    renderAt(path);

    expect(await screen.findByText(page)).toBeInTheDocument();
  });

  it('sends a visitor whose session the backend rejects to the login page', async () => {
    authStorage.setTokens({ token: 'expired-token', refreshToken: 'refresh-token' });
    vi.mocked(auth.me).mockRejectedValue(new Error('401'));

    renderAt('/admin');

    expect(await screen.findByText('page:Login')).toBeInTheDocument();
  });

});

describe('warehouse-service routes', () => {
  const warehouseRoutes: Array<[string, string, string[]]> = [
    ['/returns', 'page:MyReturns', ['ROLE_CLIENT']],
    ['/warehouse', 'page:Warehouse', ['ROLE_WAREHOUSE']],
    ['/warehouse', 'page:Warehouse', ['ROLE_ADMIN']],
    ['/admin/returns', 'page:AdminReturns', ['ROLE_ADMIN']],
    ['/admin/purchasing', 'page:AdminPurchasing', ['ROLE_ADMIN']],
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(warehouseRoutes)('does not render %s when a build disables warehouse-service', async (path, page, roles) => {
    vi.stubEnv('VITE_WAREHOUSE_ENABLED', 'false');
    signInWithRoles(roles);

    const { container } = renderAt(path);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText(page)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it.each(warehouseRoutes)('renders %s for %s by default', async (path, page, roles) => {
    signInWithRoles(roles);

    renderAt(path);

    expect(await screen.findByText(page)).toBeInTheDocument();
  });

  it('keeps clients off the warehouse board', async () => {
    signInWithRoles(['ROLE_CLIENT']);

    renderAt('/warehouse');

    expect(await screen.findByText('page:Home')).toBeInTheDocument();
  });
});

describe('AppRoutes payment flag', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not render the card payment page when a build disables payment-service', async () => {
    // given
    vi.stubEnv('VITE_PAYMENT_ENABLED', 'false');
    signInWithRoles(['ROLE_CLIENT']);

    // when
    const { container } = renderAt('/orders/3/pay');

    // then
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText('page:OrderPayment')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
