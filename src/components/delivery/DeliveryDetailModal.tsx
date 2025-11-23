import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_DELIVERY,
  START_DELIVERY,
  FAIL_DELIVERY,
  COMPLETE_DELIVERY,
  GET_NEW_DELIVERIES,
  GET_IN_PROGRESS_DELIVERIES,
} from '../../graphql/queries';
import Button from '../ui/Button';
import type { Delivery, Response } from '../../types/graphql';

interface DeliveryDetailModalProps {
  orderId: string;
  onClose: () => void;
  initialStatus?: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({ orderId, onClose, initialStatus = 'NEW' }) => {
  const [status, setStatus] = useState<'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'>(initialStatus);

  const { data: deliveryData, loading: deliveryLoading, error } = useQuery<{ getDelivery: Delivery }>(
    GET_DELIVERY,
    {
      variables: { input: { orderId } },
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        console.log('[DeliveryDetailModal] Query completed:', {
          orderId,
          hasData: !!data,
          delivery: data?.getDelivery
        });
      },
      onError: (error) => {
        console.error('[DeliveryDetailModal] Query error:', {
          orderId,
          error: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError
        });
      },
    }
  );

  const [startDelivery, { loading: startLoading }] = useMutation<{ startDelivery: Response }>(
    START_DELIVERY,
    {
      variables: { input: { orderId } },
      update: (cache, { data }) => {
        if (data?.startDelivery.success && deliveryData?.getDelivery) {
          // Remove from NEW deliveries list
          try {
            const newDeliveriesData = cache.readQuery<any>({
              query: GET_NEW_DELIVERIES,
            });
            
            if (newDeliveriesData?.getNewDeliveries) {
              cache.writeQuery({
                query: GET_NEW_DELIVERIES,
                data: {
                  getNewDeliveries: {
                    ...newDeliveriesData.getNewDeliveries,
                    deliveries: newDeliveriesData.getNewDeliveries.deliveries.filter(
                      (d: Delivery) => d.orderId !== orderId
                    ),
                  },
                },
              });
            }
          } catch (e) {
            console.log('[startDelivery] No NEW deliveries cache to update');
          }

          // Add to IN_PROGRESS deliveries list
          try {
            const inProgressData = cache.readQuery<any>({
              query: GET_IN_PROGRESS_DELIVERIES,
            });
            
            if (inProgressData?.getInProgressDeliveries) {
              cache.writeQuery({
                query: GET_IN_PROGRESS_DELIVERIES,
                data: {
                  getInProgressDeliveries: {
                    ...inProgressData.getInProgressDeliveries,
                    deliveries: [
                      deliveryData.getDelivery,
                      ...inProgressData.getInProgressDeliveries.deliveries,
                    ],
                  },
                },
              });
            }
          } catch (e) {
            console.log('[startDelivery] No IN_PROGRESS deliveries cache to update');
          }
        }
      },
      onCompleted: (data) => {
        console.log('[startDelivery] Mutation completed:', {
          orderId,
          data,
          success: data?.startDelivery?.success
        });
        if (data?.startDelivery.success) {
          setStatus('IN_PROGRESS');
        }
      },
      onError: (error) => {
        console.error('[startDelivery] Mutation error:', {
          orderId,
          message: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          fullError: error
        });
        alert(`Failed to start delivery: ${error.message}`);
      },
    }
  );

  const [failDelivery, { loading: failLoading }] = useMutation<{ failDelivery: Response }>(
    FAIL_DELIVERY,
    {
      variables: { input: { orderId } },
      update: (cache, { data }) => {
        if (data?.failDelivery.success) {
          // Remove from IN_PROGRESS deliveries list
          try {
            const inProgressData = cache.readQuery<any>({
              query: GET_IN_PROGRESS_DELIVERIES,
            });
            
            if (inProgressData?.getInProgressDeliveries) {
              cache.writeQuery({
                query: GET_IN_PROGRESS_DELIVERIES,
                data: {
                  getInProgressDeliveries: {
                    ...inProgressData.getInProgressDeliveries,
                    deliveries: inProgressData.getInProgressDeliveries.deliveries.filter(
                      (d: Delivery) => d.orderId !== orderId
                    ),
                  },
                },
              });
            }
          } catch (e) {
            console.log('[failDelivery] No IN_PROGRESS deliveries cache to update');
          }
        }
      },
      onCompleted: (data) => {
        console.log('[failDelivery] Mutation completed:', {
          orderId,
          data,
          success: data?.failDelivery?.success
        });
        if (data?.failDelivery.success) {
          setStatus('FAILED');
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      },
      onError: (error) => {
        console.error('[failDelivery] Mutation error:', {
          orderId,
          message: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          fullError: error
        });
        alert(`Failed to mark delivery as failed: ${error.message}`);
      },
    }
  );

  const [completeDelivery, { loading: completeLoading }] = useMutation<{ completeDelivery: Response }>(
    COMPLETE_DELIVERY,
    {
      variables: { input: { orderId } },
      update: (cache, { data }) => {
        if (data?.completeDelivery.success) {
          // Remove from IN_PROGRESS deliveries list
          try {
            const inProgressData = cache.readQuery<any>({
              query: GET_IN_PROGRESS_DELIVERIES,
            });
            
            if (inProgressData?.getInProgressDeliveries) {
              cache.writeQuery({
                query: GET_IN_PROGRESS_DELIVERIES,
                data: {
                  getInProgressDeliveries: {
                    ...inProgressData.getInProgressDeliveries,
                    deliveries: inProgressData.getInProgressDeliveries.deliveries.filter(
                      (d: Delivery) => d.orderId !== orderId
                    ),
                  },
                },
              });
            }
          } catch (e) {
            console.log('[completeDelivery] No IN_PROGRESS deliveries cache to update');
          }
        }
      },
      onCompleted: (data) => {
        console.log('[completeDelivery] Mutation completed:', {
          orderId,
          data,
          success: data?.completeDelivery?.success
        });
        if (data?.completeDelivery.success) {
          setStatus('COMPLETED');
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      },
      onError: (error) => {
        console.error('[completeDelivery] Mutation error:', {
          orderId,
          message: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          fullError: error
        });
        alert(`Failed to complete delivery: ${error.message}`);
      },
    }
  );

  const handleStartDelivery = async () => {
    try {
      console.log('[handleStartDelivery] Button clicked for order:', orderId);
      await startDelivery({ variables: { input: { orderId } } });
    } catch (err) {
      console.error('[handleStartDelivery] Exception caught:', {
        orderId,
        error: err,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleFailDelivery = async () => {
    if (!confirm('Are you sure you want to mark this delivery as failed?')) {
      return;
    }
    try {
      console.log('[handleFailDelivery] Button clicked for order:', orderId);
      await failDelivery({ variables: { input: { orderId } } });
    } catch (err) {
      console.error('[handleFailDelivery] Exception caught:', {
        orderId,
        error: err,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      console.log('[handleCompleteDelivery] Button clicked for order:', orderId);
      await completeDelivery({ variables: { input: { orderId } } });
    } catch (err) {
      console.error('[handleCompleteDelivery] Exception caught:', {
        orderId,
        error: err,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (deliveryLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deliveryData || !deliveryData.getDelivery) {
    console.error('[DeliveryDetailModal] Validation failed:', {
      orderId,
      hasError: !!error,
      errorMessage: error?.message,
      hasDeliveryData: !!deliveryData,
      hasDelivery: !!deliveryData?.getDelivery,
      deliveryDataRaw: deliveryData
    });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-red-600 text-center">
            <p className="mb-4">Failed to load delivery information</p>
            {error && <p className="text-sm mb-2">{error.message}</p>}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const delivery = deliveryData.getDelivery;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delivery Details</h2>
              <p className="text-sm text-green-100 font-mono">{orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status Badge */}
          <div className="mb-6 flex items-center justify-between">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(status)}`}>
              {status}
            </span>
            {status === 'NEW' && (
              <Button
                variant="primary"
                onClick={handleStartDelivery}
                isLoading={startLoading}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Delivery
                </span>
              </Button>
            )}
          </div>

          {/* Delivery Address */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Address
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Recipient</p>
                <p className="text-gray-900 font-semibold">{delivery.address.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{delivery.address.streetAddress}</p>
                <p className="text-gray-900">
                  {delivery.address.city}
                  {delivery.address.state && `, ${delivery.address.state}`}
                </p>
                <p className="text-gray-900 font-semibold">{delivery.address.country}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-gray-900 font-mono">{delivery.address.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {status === 'IN_PROGRESS' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Delivery in Progress</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please complete the delivery and update the status once delivered, or mark as failed if unable to deliver.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleFailDelivery}
                isLoading={failLoading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Mark as Failed
                </span>
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteDelivery}
                isLoading={completeLoading}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete Delivery
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailModal;
