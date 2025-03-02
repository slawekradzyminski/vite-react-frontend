import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orders } from '../../lib/api';
import { Order, OrderStatus } from '../../types/order';

export function OrderList() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', currentPage, selectedStatus],
    queryFn: () => orders.getUserOrders(currentPage, 10, selectedStatus),
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value === 'ALL' ? undefined : value as OrderStatus);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading orders</div>;
  }

  const ordersList = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  if (ordersList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="mb-4">You don't have any orders yet.</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Orders</h2>
        <div>
          <label htmlFor="status-filter" className="mr-2">Filter by status:</label>
          <select
            id="status-filter"
            className="border rounded p-2"
            value={selectedStatus || 'ALL'}
            onChange={handleStatusChange}
          >
            <option value="ALL">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        {ordersList.map((order: Order) => (
          <div key={order.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">Order #{order.id}</h3>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="font-medium">Total: ${order.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{order.items.length} items</p>
            </div>
            
            <Link 
              to={`/orders/${order.id}`} 
              className="text-blue-600 hover:underline block text-right"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded ${
                  currentPage === i ? 'bg-blue-600 text-white' : 'border'
                }`}
                onClick={() => handlePageChange(i)}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              className="px-3 py-1 rounded border disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </button>
          </nav>
        </div>
      )}
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