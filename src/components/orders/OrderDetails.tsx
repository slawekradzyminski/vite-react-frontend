import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orders, auth } from '../../lib/api';
import { OrderStatus } from '../../types/order';
import { Role } from '../../types/auth';

export const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => orders.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) => 
      orders.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
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
  };

  if (isLoadingOrder) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-gray-500">${item.unitPrice} x {item.quantity}</p>
              </div>
              <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 pt-2 border-t">
          <p className="font-semibold">Total</p>
          <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>
        <div className="text-gray-700">
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        {order.status === 'PENDING' && (
          <button
            onClick={handleCancelOrder}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            disabled={cancelOrderMutation.isPending}
          >
            {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}

        {isAdmin && (
          <div className="flex items-center space-x-2 ml-auto">
            <select
              value={order.status}
              onChange={handleStatusChange}
              className="border rounded p-2"
              disabled={updateStatusMutation.isPending}
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;