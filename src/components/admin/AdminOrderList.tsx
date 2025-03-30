import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orders } from '../../lib/api';
import { OrderStatus } from '../../types/order';

export function AdminOrderList() {
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-indexed to match API
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', currentPage, selectedStatus],
    queryFn: () => orders.getAllOrders(
      currentPage,
      10,
      selectedStatus !== 'ALL' ? selectedStatus as OrderStatus : undefined
    ),
  });
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value as OrderStatus | 'ALL');
    setCurrentPage(0); // Reset to first page when filter changes
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < (data?.data?.totalPages || 1) - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8" data-testid="admin-order-list-loading">Loading orders...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8" data-testid="admin-order-list-error">
        <p className="text-red-500 mb-4">Error loading orders</p>
      </div>
    );
  }
  
  const orderList = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 1;
  const displayPage = currentPage + 1; // For display purposes (1-indexed)
  
  return (
    <div className="max-w-6xl mx-auto p-4" data-testid="admin-order-list">
      <h1 className="text-2xl font-bold mb-6" data-testid="admin-order-list-title">Manage Orders</h1>
      
      <div className="mb-6 flex justify-between items-center" data-testid="admin-order-list-filters">
        <div>
          <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            className="border rounded p-2"
            value={selectedStatus}
            onChange={handleStatusChange}
            data-testid="admin-order-list-status-filter"
          >
            <option value="ALL">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600" data-testid="admin-order-list-pagination-info">
          Page {displayPage} of {totalPages}
        </div>
      </div>
      
      {orderList.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center" data-testid="admin-order-list-empty">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="admin-order-list-table-container">
          <table className="min-w-full divide-y divide-gray-200" data-testid="admin-order-list-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderList.map((order) => (
                <tr key={order.id} data-testid={`admin-order-row-${order.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`admin-order-id-${order.id}`}>
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`admin-order-customer-${order.id}`}>
                    {order.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`admin-order-date-${order.id}`}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`admin-order-amount-${order.id}`}>
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`admin-order-status-cell-${order.id}`}>
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}
                      data-testid={`admin-order-status-${order.id}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900"
                      data-testid={`admin-order-details-${order.id}`}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200" data-testid="admin-order-list-pagination">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className={`px-3 py-1 rounded ${
                currentPage === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              data-testid="admin-order-list-prev-page"
            >
              Previous
            </button>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className={`px-3 py-1 rounded ${
                currentPage >= totalPages - 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              data-testid="admin-order-list-next-page"
            >
              Next
            </button>
          </div>
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