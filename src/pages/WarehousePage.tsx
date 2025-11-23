import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_NEW_PACKAGING_REQUEST_IDS } from '../graphql/queries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PackagingDetailModal from '../components/warehouse/PackagingDetailModal';
import type { PaginatedPackagingRequestIds } from '../types/graphql';

const WarehousePage: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const { data, loading, error, fetchMore } = useQuery<{ getNewPackagingRequestIds: PaginatedPackagingRequestIds }>(
    GET_NEW_PACKAGING_REQUEST_IDS,
    {
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        console.log('[WarehousePage] NEW Query completed:', JSON.stringify(data, null, 2));
      },
      onError: (error) => {
        console.error('[WarehousePage] NEW Query error:', error);
        console.error('[WarehousePage] Error details:', JSON.stringify(error, null, 2));
      },
    }
  );

  const handleLoadMore = () => {
    if (data?.getNewPackagingRequestIds.nextToken) {
      fetchMore({
        variables: {
          nextToken: data.getNewPackagingRequestIds.nextToken,
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Packaging Requests</h2>
          <p className="text-gray-600">{error.message}</p>
        </Card>
      </div>
    );
  }

  const packagingRequests = data?.getNewPackagingRequestIds.packagingRequestIds || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Dashboard</h1>
        </div>
        <p className="text-gray-600">Manage packaging requests and track order fulfillment</p>
      </div>

      {/* Stats Card */}
      <div className="mb-8">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Pending Requests</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{packagingRequests.length}</p>
            </div>
            <div className="bg-blue-500 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Packaging Requests List */}
      {packagingRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Packaging Requests</h3>
          <p className="text-gray-600">All orders have been processed. Great job!</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packagingRequests.map((orderId) => (
              <Card
                key={orderId}
                className="p-6 hover:shadow-xl transition-shadow duration-200 cursor-pointer border-2 border-transparent hover:border-indigo-200"
                onClick={() => setSelectedOrderId(orderId)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 rounded-lg p-2">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order ID</p>
                      <p className="text-sm font-mono text-gray-900">{orderId.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor('NEW')}`}>
                    NEW
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Awaiting Processing</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOrderId(orderId);
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Packaging
                  </span>
                </Button>
              </Card>
            ))}
          </div>

          {data?.getNewPackagingRequestIds.nextToken && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                isLoading={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Packaging Detail Modal */}
      {selectedOrderId && (
        <PackagingDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

export default WarehousePage;
