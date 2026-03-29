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

  const renderOrdersHeader = () => (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" data-testid="order-list-header">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">History</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950" data-testid="order-list-title">Your Orders</h2>
      </div>
      <div className="flex items-center gap-2" data-testid="order-list-filter">
        <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">Filter by status:</label>
        <select
          id="status-filter"
          className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          value={selectedStatus || 'ALL'}
          onChange={handleStatusChange}
          data-testid="order-list-status-filter"
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
  );

  if (isLoading) {
    return (
      <div data-testid="order-list-container">
        {renderOrdersHeader()}
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-6 py-10 text-center text-slate-500" data-testid="order-list-loading">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="order-list-container">
        {renderOrdersHeader()}
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-6 py-10 text-center text-red-600" data-testid="order-list-error">Error loading orders</div>
      </div>
    );
  }

  const ordersList = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  if (ordersList.length === 0) {
    return (
      <div data-testid="order-list-container">
        {renderOrdersHeader()}
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-6 py-10 text-center text-slate-600" data-testid="order-list-empty">
          {selectedStatus ? (
            <p>No orders found with status "{selectedStatus}". Try selecting a different status or view all orders.</p>
          ) : (
            <p>You don't have any orders yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="order-list-container">
      {renderOrdersHeader()}
      
      <div className="space-y-4" data-testid="order-list-items">
        {ordersList.map((order: Order) => (
          <div key={order.id} className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 transition hover:bg-white hover:shadow-[0_20px_45px_-35px_rgba(15,23,42,0.5)]" data-testid={`order-item-${order.id}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-950" data-testid={`order-id-${order.id}`}>Order #{order.id}</h3>
                <p className="text-sm text-slate-500" data-testid={`order-date-${order.id}`}>
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span 
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}
                  data-testid={`order-status-${order.id}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="font-medium text-slate-900" data-testid={`order-total-${order.id}`}>Total: ${order.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-slate-600" data-testid={`order-items-count-${order.id}`}>{order.items.length} items</p>
            </div>
            
            <Link 
              to={`/orders/${order.id}`} 
              className="block text-right text-sm font-medium text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
              data-testid={`order-details-link-${order.id}`}
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-6" data-testid="order-list-pagination">
          <nav className="flex items-center space-x-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2">
            <button
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              data-testid="order-list-prev-page"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  currentPage === i ? 'bg-slate-900 text-stone-50' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
                onClick={() => handlePageChange(i)}
                data-testid={`order-list-page-${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              data-testid="order-list-next-page"
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
