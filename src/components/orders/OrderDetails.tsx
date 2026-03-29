import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orders, auth } from '../../lib/api';
import { OrderStatus } from '../../types/order';
import { Role } from '../../types/auth';
import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { Surface } from '../ui/surface';
import { Badge } from '../ui/badge';

export const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id || '0', 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch order details
  const { data: orderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orders.getOrderById(orderId),
    enabled: !!orderId,
  });

  // Fetch user data to check if admin
  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: () => auth.me(),
  });

  const isAdmin = userData?.data?.roles?.includes(Role.ADMIN);
  const order = orderData?.data;

  // State to track the selected status in the dropdown
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => orders.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast({
        title: 'Order Cancelled',
        description: `Order #${orderId} has been cancelled successfully.`,
        variant: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel the order. Please try again.',
        variant: 'error',
      });
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) => 
      orders.updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast({
        title: 'Status Updated',
        description: `Order status has been updated to ${variables.status}.`,
        variant: 'success',
      });
      setSelectedStatus(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'error',
      });
    },
  });

  const effectiveSelectedStatus = selectedStatus ?? order?.status ?? null;
  const isUpdateDisabled =
    updateStatusMutation.isPending || !order || !effectiveSelectedStatus || effectiveSelectedStatus === order.status;

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setSelectedStatus(newStatus);
  };
  
  const handleUpdateStatus = () => {
    if (effectiveSelectedStatus && effectiveSelectedStatus !== order?.status) {
      updateStatusMutation.mutate({ orderId, status: effectiveSelectedStatus });
    }
  };

  const getStatusVariant = (status: string) => {
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
  };

  if (isLoadingOrder) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="order-details-loading">Loading order details...</Surface>;
  }

  if (!order) {
    return <Surface variant="muted" padding="message" className="text-center text-slate-500" data-testid="order-details-not-found">Order not found</Surface>;
  }

  return (
    <Surface variant="default" padding="lg" data-testid="order-details">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Order detail</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950" data-testid="order-details-title">Order #{order.id}</h1>
        </div>
        <Badge
          variant={getStatusVariant(order.status)}
          className="w-fit text-sm font-medium"
          data-testid="order-details-status"
        >
          {order.status}
        </Badge>
      </div>

      <Surface variant="inset" padding="md" className="mb-6" data-testid="order-details-items-section">
        <h2 className="mb-3 text-lg font-semibold text-slate-950" data-testid="order-details-items-title">Items</h2>
        <div className="space-y-4" data-testid="order-details-items-list">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b border-stone-200 pb-3 last:border-b-0 last:pb-0" data-testid={`order-item-${item.id}`}>
              <div>
                <p className="font-medium text-slate-900" data-testid={`order-item-name-${item.id}`}>{item.productName}</p>
                <p className="text-sm text-slate-500" data-testid={`order-item-price-details-${item.id}`}>${item.unitPrice} x {item.quantity}</p>
              </div>
              <p className="font-medium text-slate-900" data-testid={`order-item-total-${item.id}`}>${item.totalPrice.toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3" data-testid="order-details-total">
          <p className="font-semibold text-slate-700">Total</p>
          <p className="font-bold text-lg text-slate-950" data-testid="order-details-total-amount">${order.totalAmount.toFixed(2)}</p>
        </div>
      </Surface>

      <Surface variant="inset" padding="md" className="mb-6" data-testid="order-details-shipping-section">
        <h2 className="mb-3 text-lg font-semibold text-slate-950" data-testid="order-details-shipping-title">Shipping Address</h2>
        <div className="text-slate-700" data-testid="order-details-shipping-address">
          <p data-testid="order-details-address-street">{order.shippingAddress.street}</p>
          <p data-testid="order-details-address-city-state">
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </p>
          <p data-testid="order-details-address-country">{order.shippingAddress.country}</p>
        </div>
      </Surface>

      <div className="flex justify-between items-center" data-testid="order-details-actions">
        {order.status === 'PENDING' && (
          <button
            onClick={handleCancelOrder}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            disabled={cancelOrderMutation.isPending}
            data-testid="order-details-cancel-button"
          >
            {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}

        {isAdmin && (
          <div className="flex items-center space-x-2 ml-auto" data-testid="order-details-admin-controls">
            <select
              value={effectiveSelectedStatus ?? ''}
              onChange={handleStatusChange}
              className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              disabled={updateStatusMutation.isPending}
              data-testid="order-details-status-select"
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={handleUpdateStatus}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-slate-800 disabled:bg-stone-300"
              disabled={isUpdateDisabled}
              data-testid="order-details-update-status-button"
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
        )}
      </div>
    </Surface>
  );
};

export default OrderDetails;
