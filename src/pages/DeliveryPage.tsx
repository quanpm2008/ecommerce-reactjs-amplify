import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_NEW_DELIVERIES, GET_IN_PROGRESS_DELIVERIES } from '../graphql/queries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DeliveryDetailModal from '../components/delivery/DeliveryDetailModal';
import type { PaginatedDeliveries } from '../types/graphql';

const DeliveryPage: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'NEW' | 'IN_PROGRESS'>('NEW');
  
  const { 
    data: newData, 
    loading: newLoading, 
    error: newError, 
    fetchMore: fetchMoreNew 
  } = useQuery<{ getNewDeliveries: PaginatedDeliveries }>(
    GET_NEW_DELIVERIES,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        console.log('[DeliveryPage] New deliveries loaded:', data.getNewDeliveries.deliveries.length);
      },
      onError: (error) => {
        console.error('[DeliveryPage] New deliveries error:', error);
      },
    }
  );

  const { 
    data: inProgressData, 
    loading: inProgressLoading, 
    error: inProgressError, 
    fetchMore: fetchMoreInProgress 
  } = useQuery<{ getInProgressDeliveries: PaginatedDeliveries }>(
    GET_IN_PROGRESS_DELIVERIES,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        console.log('[DeliveryPage] In-progress deliveries loaded:', data.getInProgressDeliveries.deliveries.length);
      },
      onError: (error) => {
        console.error('[DeliveryPage] In-progress deliveries error:', error);
      },
    }
  );

  const handleLoadMoreNew = () => {
    if (newData?.getNewDeliveries.nextToken) {
      fetchMoreNew({
        variables: {
          nextToken: newData.getNewDeliveries.nextToken,
        },
      });
    }
  };

  const handleLoadMoreInProgress = () => {
    if (inProgressData?.getInProgressDeliveries.nextToken) {
      fetchMoreInProgress({
        variables: {
          nextToken: inProgressData.getInProgressDeliveries.nextToken,
        },
      });
    }
  };

  const isLoading = (newLoading && !newData) || (inProgressLoading && !inProgressData);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (newError || inProgressError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Deliveries</h2>
          <p className="text-gray-600">{newError?.message || inProgressError?.message}</p>
        </Card>
      </div>
    );
  }

  const newDeliveries = newData?.getNewDeliveries.deliveries || [];
  const inProgressDeliveries = inProgressData?.getInProgressDeliveries.deliveries || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        </div>
        <p className="text-gray-600">Manage deliveries and track order shipments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Pending Deliveries</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{newDeliveries.length}</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">In Progress</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{inProgressDeliveries.length}</p>
            </div>
            <div className="bg-orange-500 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Deliveries Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-lg">NEW</span>
          Pending Deliveries
        </h2>
        {newDeliveries.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600">No pending deliveries</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newDeliveries.map((delivery) => (
                <Card
                  key={delivery.orderId}
                  className="p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
                  onClick={() => {
                    setSelectedOrderId(delivery.orderId);
                    setSelectedStatus('NEW');
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order ID</p>
                        <p className="text-sm font-mono text-gray-900">{delivery.orderId.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      NEW
                    </span>
                  </div>

                  {/* Address Preview */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{delivery.address.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="line-clamp-2">{delivery.address.streetAddress}</p>
                        <p className="text-xs">
                          {delivery.address.city}, {delivery.address.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-mono">{delivery.address.phoneNumber}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderId(delivery.orderId);
                      setSelectedStatus('NEW');
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Delivery
                    </span>
                  </Button>
                </Card>
              ))}
            </div>

            {newData?.getNewDeliveries.nextToken && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMoreNew}
                  isLoading={newLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* In Progress Deliveries Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-lg">IN PROGRESS</span>
          Active Deliveries
        </h2>
        {inProgressDeliveries.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <p className="text-gray-600">No deliveries in progress</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressDeliveries.map((delivery) => (
                <Card
                  key={delivery.orderId}
                  className="p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer border-2 border-transparent hover:border-orange-200"
                  onClick={() => {
                    setSelectedOrderId(delivery.orderId);
                    setSelectedStatus('IN_PROGRESS');
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 rounded-lg p-2">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order ID</p>
                        <p className="text-sm font-mono text-gray-900">{delivery.orderId.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                      IN PROGRESS
                    </span>
                  </div>

                  {/* Address Preview */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{delivery.address.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="line-clamp-2">{delivery.address.streetAddress}</p>
                        <p className="text-xs">
                          {delivery.address.city}, {delivery.address.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-mono">{delivery.address.phoneNumber}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderId(delivery.orderId);
                      setSelectedStatus('IN_PROGRESS');
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </span>
                  </Button>
                </Card>
              ))}
            </div>

            {inProgressData?.getInProgressDeliveries.nextToken && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMoreInProgress}
                  isLoading={inProgressLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delivery Detail Modal */}
      {selectedOrderId && (
        <DeliveryDetailModal
          orderId={selectedOrderId}
          initialStatus={selectedStatus}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default DeliveryPage;
