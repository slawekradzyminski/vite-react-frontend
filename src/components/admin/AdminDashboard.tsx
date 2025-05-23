import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orders, products } from '../../lib/api';
import { OrderStatus } from '../../types/order';

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
    return <div className="text-center py-8" data-testid="admin-dashboard-loading">Loading dashboard data...</div>;
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
    <div className="max-w-6xl mx-auto p-4" data-testid="admin-dashboard">
      <h1 className="text-2xl font-bold mb-6" data-testid="admin-dashboard-title">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="admin-dashboard-metrics">
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="admin-dashboard-products-card">
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Products</h2>
          <p className="text-3xl font-bold" data-testid="admin-dashboard-products-count">{totalProducts}</p>
          <Link to="/admin/products" className="text-blue-600 text-sm hover:underline mt-2 inline-block" data-testid="admin-dashboard-products-link">
            Manage Products →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="admin-dashboard-orders-card">
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Orders</h2>
          <p className="text-3xl font-bold" data-testid="admin-dashboard-orders-count">{totalOrders}</p>
          <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline mt-2 inline-block" data-testid="admin-dashboard-orders-link">
            View All Orders →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="admin-dashboard-pending-card">
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Pending Orders</h2>
          <p className="text-3xl font-bold" data-testid="admin-dashboard-pending-count">{pendingOrders}</p>
          <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline mt-2 inline-block" data-testid="admin-dashboard-pending-link">
            Process Orders →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="admin-dashboard-revenue-card">
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold" data-testid="admin-dashboard-revenue-amount">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="admin-dashboard-recent-orders">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline" data-testid="admin-dashboard-view-all-orders">
              View All
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-500" data-testid="admin-dashboard-no-orders">No orders found</p>
          ) : (
            <div className="space-y-4" data-testid="admin-dashboard-orders-list">
              {recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center border-b pb-3" data-testid={`admin-dashboard-order-${order.id}`}>
                  <div>
                    <p className="font-medium" data-testid={`admin-dashboard-order-id-${order.id}`}>Order #{order.id}</p>
                    <p className="text-sm text-gray-500" data-testid={`admin-dashboard-order-date-${order.id}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" data-testid={`admin-dashboard-order-amount-${order.id}`}>${order.totalAmount.toFixed(2)}</p>
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}
                      data-testid={`admin-dashboard-order-status-${order.id}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6" data-testid="admin-dashboard-low-stock">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Low Stock Products</h2>
            <Link to="/admin/products" className="text-blue-600 text-sm hover:underline" data-testid="admin-dashboard-manage-inventory">
              Manage Inventory
            </Link>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500" data-testid="admin-dashboard-no-low-stock">No low stock products</p>
          ) : (
            <div className="space-y-4" data-testid="admin-dashboard-low-stock-list">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center border-b pb-3" data-testid={`admin-dashboard-product-${product.id}`}>
                  <div className="flex items-center">
                    {product.imageUrl && (
                      <div className="flex-shrink-0 h-10 w-10 mr-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.imageUrl}
                          alt={product.name}
                          data-testid={`admin-dashboard-product-image-${product.id}`}
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium" data-testid={`admin-dashboard-product-name-${product.id}`}>{product.name}</p>
                      <p className="text-sm text-gray-500" data-testid={`admin-dashboard-product-price-${product.id}`}>${product.price.toFixed(2)}</p>
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
                      className="text-blue-600 text-sm hover:underline"
                      data-testid={`admin-dashboard-product-update-${product.id}`}
                    >
                      Update
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-blue-100 text-blue-800';
    case 'SHIPPED':
      return 'bg-purple-100 text-purple-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 