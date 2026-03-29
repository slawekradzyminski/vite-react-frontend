import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orders, products } from '../../lib/api';
import { OrderStatus } from '../../types/order';
import { Surface } from '../ui/surface';
import { Badge } from '../ui/badge';

export function AdminDashboard() {
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: products.getAllProducts,
  });
  
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['admin-orders', 0, 50],
    queryFn: () => orders.getAllOrders(0, 50),
  });
  
  // Early return with partial data if available
  if (isLoadingProducts && isLoadingOrders) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="admin-dashboard-loading">Loading dashboard data...</Surface>;
  }
  
  const productList = productsData?.data || [];
  const orderList = ordersData?.data?.content || [];
  
  // Calculate dashboard metrics
  const totalProducts = productList.length;
  const totalOrders = orderList.length;
  const pendingOrders = orderList.filter(order => order.status === 'PENDING').length;
  const totalRevenue = orderList
    .filter(order => order.status !== 'CANCELLED')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  // Get low stock products (less than 5 items)
  const lowStockProducts = productList.filter(product => product.stockQuantity < 5);
  
  // Get recent orders (last 5)
  const recentOrders = [...orderList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-6 pb-10" data-testid="admin-dashboard">
      <Surface as="section" variant="hero" padding="xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
        <div className="mt-3 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Review catalog, order throughput, pending work, and inventory risk from one operator surface.
          </p>
        </div>
      </Surface>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="admin-dashboard-metrics">
        <Surface variant="default" padding="lg" data-testid="admin-dashboard-products-card">
          <h2 className="mb-2 text-sm font-medium uppercase text-slate-500">Total Products</h2>
          <p className="text-3xl font-bold text-slate-950" data-testid="admin-dashboard-products-count">{totalProducts}</p>
          <Link to="/admin/products" className="mt-2 inline-block text-sm text-sky-700 hover:underline" data-testid="admin-dashboard-products-link">
            Manage Products →
          </Link>
        </Surface>
        
        <Surface variant="default" padding="lg" data-testid="admin-dashboard-orders-card">
          <h2 className="mb-2 text-sm font-medium uppercase text-slate-500">Total Orders</h2>
          <p className="text-3xl font-bold text-slate-950" data-testid="admin-dashboard-orders-count">{totalOrders}</p>
          <Link to="/admin/orders" className="mt-2 inline-block text-sm text-sky-700 hover:underline" data-testid="admin-dashboard-orders-link">
            View All Orders →
          </Link>
        </Surface>
        
        <Surface variant="default" padding="lg" data-testid="admin-dashboard-pending-card">
          <h2 className="mb-2 text-sm font-medium uppercase text-slate-500">Pending Orders</h2>
          <p className="text-3xl font-bold text-slate-950" data-testid="admin-dashboard-pending-count">{pendingOrders}</p>
          <Link to="/admin/orders" className="mt-2 inline-block text-sm text-sky-700 hover:underline" data-testid="admin-dashboard-pending-link">
            Process Orders →
          </Link>
        </Surface>
        
        <Surface variant="default" padding="lg" data-testid="admin-dashboard-revenue-card">
          <h2 className="mb-2 text-sm font-medium uppercase text-slate-500">Total Revenue</h2>
          <p className="text-3xl font-bold text-slate-950" data-testid="admin-dashboard-revenue-amount">${totalRevenue.toFixed(2)}</p>
        </Surface>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Surface variant="default" padding="lg" data-testid="admin-dashboard-recent-orders">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-sky-700 hover:underline" data-testid="admin-dashboard-view-all-orders">
              View All
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-slate-500" data-testid="admin-dashboard-no-orders">No orders found</p>
          ) : (
            <div className="space-y-4" data-testid="admin-dashboard-orders-list">
              {recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center border-b border-stone-200 pb-3" data-testid={`admin-dashboard-order-${order.id}`}>
                  <div>
                    <p className="font-medium text-slate-900" data-testid={`admin-dashboard-order-id-${order.id}`}>Order #{order.id}</p>
                    <p className="text-sm text-slate-500" data-testid={`admin-dashboard-order-date-${order.id}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900" data-testid={`admin-dashboard-order-amount-${order.id}`}>${order.totalAmount.toFixed(2)}</p>
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className="text-xs leading-5"
                      data-testid={`admin-dashboard-order-status-${order.id}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
        
        <Surface variant="default" padding="lg" data-testid="admin-dashboard-low-stock">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-950">Low Stock Products</h2>
            <Link to="/admin/products" className="text-sm text-sky-700 hover:underline" data-testid="admin-dashboard-manage-inventory">
              Manage Inventory
            </Link>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <p className="text-slate-500" data-testid="admin-dashboard-no-low-stock">No low stock products</p>
          ) : (
            <div className="space-y-4" data-testid="admin-dashboard-low-stock-list">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center border-b border-stone-200 pb-3" data-testid={`admin-dashboard-product-${product.id}`}>
                  <div className="flex items-center">
                    {product.imageUrl && (
                      <div className="shrink-0 h-10 w-10 mr-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.imageUrl}
                          alt={product.name}
                          data-testid={`admin-dashboard-product-image-${product.id}`}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900" data-testid={`admin-dashboard-product-name-${product.id}`}>{product.name}</p>
                      <p className="text-sm text-slate-500" data-testid={`admin-dashboard-product-price-${product.id}`}>${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className={`font-medium ${product.stockQuantity === 0 ? 'text-red-600' : 'text-yellow-600'}`}
                      data-testid={`admin-dashboard-product-stock-${product.id}`}
                    >
                      {product.stockQuantity} in stock
                    </p>
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-sm text-sky-700 hover:underline"
                      data-testid={`admin-dashboard-product-update-${product.id}`}
                    >
                      Update
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

function getStatusVariant(status: OrderStatus): 'default' | 'outline' | 'success' | 'error' | 'warning' {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'PAID':
      return 'default';
    case 'SHIPPED':
      return 'outline';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
}
