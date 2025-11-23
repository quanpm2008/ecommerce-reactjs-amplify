import React from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_ORDERS } from '../graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import type { PaginatedOrders, OrderStatus } from '../types/graphql';

const OrdersPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const { data, loading, error, fetchMore } = useQuery<{ getOrders: PaginatedOrders }>(
    GET_ORDERS,
    {
      skip: !isAuthenticated,
    }
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
        <p className="text-gray-600 mb-8">You need to be signed in to view your orders</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-red-600">Error loading orders: {error.message}</p>
      </div>
    );
  }

  const orders = data?.getOrders.orders || [];

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PACKAGING: 'bg-blue-100 text-blue-800',
      PACKAGED: 'bg-purple-100 text-purple-800',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.orderId} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.orderId.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {order.products.slice(0, 3).map((product, idx) => (
                        <li key={idx}>
                          {product.name} × {product.quantity}
                        </li>
                      ))}
                      {order.products.length > 3 && (
                        <li className="text-gray-500">
                          + {order.products.length - 3} more items
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Shipping Address</h4>
                    <p className="text-sm text-gray-600">
                      {order.address.name}<br />
                      {order.address.streetAddress}<br />
                      {order.address.city}, {order.address.state} {order.address.postCode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="text-xl font-bold text-gray-900">
                    ${order.total}
                  </span>
                </div>
                <Link to={`/orders/${order.orderId}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}

          {data?.getOrders.nextToken && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  fetchMore({
                    variables: {
                      nextToken: data.getOrders.nextToken,
                    },
                  });
                }}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
