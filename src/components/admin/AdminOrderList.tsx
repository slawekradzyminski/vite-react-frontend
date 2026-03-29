import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orders } from '../../lib/api';
import { OrderStatus } from '../../types/order';
import { Button } from '../ui/button';
import { Surface } from '../ui/surface';
import { Badge } from '../ui/badge';

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
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="admin-order-list-loading">Loading orders...</Surface>;
  }
  
  if (error) {
    return (
      <Surface variant="danger" padding="message" className="text-center" data-testid="admin-order-list-error">
        <p className="mb-4 text-red-500">Error loading orders</p>
      </Surface>
    );
  }
  
  const orderList = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 1;
  const displayPage = currentPage + 1; // For display purposes (1-indexed)
  
  return (
    <div className="space-y-6 pb-10" data-testid="admin-order-list">
      <Surface as="section" variant="hero" padding="xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="admin-order-list-title">Manage Orders</h1>
      </Surface>
      
      <Surface variant="muted" padding="md" className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" data-testid="admin-order-list-filters">
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            className="h-11 rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300"
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
        
        <div className="text-sm text-slate-600" data-testid="admin-order-list-pagination-info">
          Page {displayPage} of {totalPages}
        </div>
      </Surface>
      
      {orderList.length === 0 ? (
        <Surface variant="default" className="p-8 text-center" data-testid="admin-order-list-empty">
          <p className="text-slate-600">No orders found</p>
        </Surface>
      ) : (
        <Surface variant="default" className="overflow-hidden" data-testid="admin-order-list-table-container">
          <table className="min-w-full divide-y divide-stone-200" data-testid="admin-order-list-table">
            <thead className="bg-stone-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white/60">
              {orderList.map((order) => (
                <tr key={order.id} data-testid={`admin-order-row-${order.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`admin-order-id-${order.id}`}>
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900" data-testid={`admin-order-customer-${order.id}`}>
                    {order.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`admin-order-date-${order.id}`}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" data-testid={`admin-order-amount-${order.id}`}>
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" data-testid={`admin-order-status-cell-${order.id}`}>
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className="text-xs leading-5"
                      data-testid={`admin-order-status-${order.id}`}
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-sky-700 hover:text-sky-900"
                      data-testid={`admin-order-details-${order.id}`}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4" data-testid="admin-order-list-pagination">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              variant="outline"
              size="sm"
              data-testid="admin-order-list-prev-page"
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              size="sm"
              data-testid="admin-order-list-next-page"
            >
              Next
            </Button>
          </div>
        </Surface>
      )}
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
