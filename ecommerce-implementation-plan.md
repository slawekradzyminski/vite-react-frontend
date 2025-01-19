# E-commerce Implementation Plan

## Backend API (Available at http://localhost:4001)

### Models

#### Product
```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Cart
```typescript
interface CartItem {
  productId: number;
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

interface Cart {
  username: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}
```

#### Order
```typescript
interface Order {
  id: number;
  username: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
```

### API Endpoints

#### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/{id}` - Update product (Admin)
- `DELETE /api/products/{id}` - Delete product (Admin)

#### Cart
- `GET /api/cart` - Get current user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{productId}` - Update item quantity
- `DELETE /api/cart/items/{productId}` - Remove item from cart
- `DELETE /api/cart` - Clear cart

#### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/{id}` - Get order by ID
- `PUT /api/orders/{id}/status` - Update order status (Admin)
- `POST /api/orders/{id}/cancel` - Cancel order

## Frontend Implementation

### Component Structure
```
src/
├── components/
│   ├── products/
│   │   ├── ProductList.tsx        [ ] TODO
│   │   ├── ProductCard.tsx        [ ] TODO
│   │   ├── ProductDetails.tsx     [ ] TODO
│   │   └── AdminProductForm.tsx   [ ] TODO
│   ├── cart/
│   │   ├── CartSummary.tsx       [ ] TODO
│   │   ├── CartItem.tsx          [ ] TODO
│   │   └── AddToCartButton.tsx   [ ] TODO
│   ├── orders/
│   │   ├── OrderList.tsx         [ ] TODO
│   │   ├── OrderDetails.tsx      [ ] TODO
│   │   └── CheckoutForm.tsx      [ ] TODO
│   └── shared/
│       ├── Pagination.tsx        [ ] TODO
│       └── LoadingSpinner.tsx    [ ] TODO
├── pages/
│   ├── ProductsPage.tsx          [ ] TODO
│   ├── ProductDetailsPage.tsx    [ ] TODO
│   ├── CartPage.tsx             [ ] TODO
│   ├── CheckoutPage.tsx         [ ] TODO
│   ├── OrdersPage.tsx           [ ] TODO
│   └── AdminProductsPage.tsx    [ ] TODO
└── api/
    └── ecommerce.ts             [ ] TODO
```

### Implementation Phases

#### Phase 1: Product Browsing
- [ ] Set up product types and API client
- [ ] Implement ProductList and ProductCard
- [ ] Add product filtering and sorting
- [ ] Implement product details view
- [ ] Add tests for product components

#### Phase 2: Shopping Cart
- [ ] Implement cart state management
- [ ] Create CartSummary and CartItem components
- [ ] Add AddToCartButton with quantity selection
- [ ] Implement cart persistence
- [ ] Add tests for cart functionality

#### Phase 3: Checkout & Orders
- [ ] Create checkout form with address input
- [ ] Implement order creation flow
- [ ] Add order history view
- [ ] Create order details view
- [ ] Add tests for order components

#### Phase 4: Admin Features
- [ ] Add product management CRUD
- [ ] Implement order status management
- [ ] Add admin-only routes
- [ ] Create tests for admin functionality

### Test Strategy

#### Component Test Example
```typescript
// ProductCard.test.tsx
describe('ProductCard', () => {
  // given
  it('should render product details correctly', () => {
    const product = {
      id: 1,
      name: "Test Product",
      price: 99.99,
      description: "Test Description"
    };
    
    render(<ProductCard product={product} />);
    
    // when/then
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(`$${product.price}`)).toBeInTheDocument();
  });

  // given
  it('should handle add to cart action', async () => {
    const mockAddToCart = vi.fn();
    
    render(<ProductCard product={product} onAddToCart={mockAddToCart} />);
    
    // when
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    
    // then
    expect(mockAddToCart).toHaveBeenCalledWith(product.id, 1);
  });
});
```

### Test Coverage Requirements

#### Unit Tests
- [ ] API client functions
- [ ] State management logic
- [ ] Utility functions
- [ ] Form validation

#### Component Tests
- [ ] Rendering of all components
- [ ] User interactions
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

#### Integration Tests
- [ ] Complete purchase flow
- [ ] Cart operations
- [ ] Checkout process
- [ ] Admin operations

### AI Development Notes

1. **Component Development**
   - Use shadcn/ui components as base
   - Follow Tailwind CSS patterns
   - Implement responsive design
   - Handle loading and error states

2. **API Integration**
   - Use React Query for data fetching
   - Implement proper error handling
   - Add request/response interceptors
   - Handle authentication headers

3. **Testing Tips**
   - Mock API responses using MSW
   - Test both success and error paths
   - Use proper async testing patterns
   - Follow given/when/then structure

4. **Common Gotchas**
   - Check token expiration
   - Handle race conditions in cart updates
   - Validate stock availability
   - Handle network errors gracefully

### Progress Tracking

- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] All Tests Passing
- [ ] Documentation Updated 