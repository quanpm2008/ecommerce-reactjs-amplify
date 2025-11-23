import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_PACKAGING_REQUEST_V2,
  START_PACKAGING,
  UPDATE_PACKAGING_PRODUCT,
  COMPLETE_PACKAGING,
  GET_NEW_PACKAGING_REQUEST_IDS,
} from '../../graphql/queries';
import Button from '../ui/Button';
import type { PackagingRequest, UpdatePackagingProductInput, Response } from '../../types/graphql';

interface PackagingDetailModalProps {
  orderId: string;
  onClose: () => void;
}

const PackagingDetailModal: React.FC<PackagingDetailModalProps> = ({ orderId, onClose }) => {
  // Track which products are checked (packed), not quantities
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(new Set());

  const { data: packagingData, loading: packagingLoading, error, refetch } = useQuery<{ getPackagingRequest: PackagingRequest }>(
    GET_PACKAGING_REQUEST_V2,
    {
      variables: { input: { orderId } },
      fetchPolicy: 'network-only',
      onCompleted: (data) => {
        console.log('[PackagingDetailModal] Query completed:', {
          orderId,
          hasData: !!data,
          packagingRequest: data?.getPackagingRequest,
          products: data?.getPackagingRequest?.products
        });
        // Initialize with no products checked
        // Filter out __metadata record - it's not a real product
        setCheckedProducts(new Set());
        console.log('[PackagingDetailModal] Initialized with no checked products');
      },
      onError: (error) => {
        console.error('[PackagingDetailModal] Query error:', {
          orderId,
          error: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError
        });
      },
    }
  );

  const [startPackaging, { loading: startLoading }] = useMutation<{ startPackaging: Response }>(
    START_PACKAGING,
    {
      variables: { input: { orderId } },
      // Remove refetchQueries to avoid race condition with cache update
      // refetchQueries: [{ query: GET_PACKAGING_REQUEST_V2, variables: { input: { orderId } } }],
      awaitRefetchQueries: true,
      update: (cache, { data }) => {
        console.log('[startPackaging] Update callback:', {
          orderId,
          hasData: !!data,
          success: data?.startPackaging?.success,
          fullData: data
        });
        
        if (data?.startPackaging.success) {
          const queryOptions = { query: GET_PACKAGING_REQUEST_V2, variables: { input: { orderId } } };
          const existingData = cache.readQuery<{ getPackagingRequest: PackagingRequest }>(queryOptions);
          
          console.log('[startPackaging] Cache read:', {
            hasExistingData: !!existingData,
            hasPackagingRequest: !!existingData?.getPackagingRequest,
            currentStatus: existingData?.getPackagingRequest?.status,
            existingData
          });
          
          if (existingData && existingData.getPackagingRequest) {
            const newData = {
              getPackagingRequest: {
                ...existingData.getPackagingRequest,
                status: 'IN_PROGRESS',
              },
            };
            
            console.log('[startPackaging] Writing to cache:', newData);
            
            cache.writeQuery({
              ...queryOptions,
              data: newData,
            });
            
            // Remove this order from the NEW packaging requests list
            try {
              const newRequestsQuery = { query: GET_NEW_PACKAGING_REQUEST_IDS };
              const newRequestsData = cache.readQuery<{ getNewPackagingRequestIds: { packagingRequestIds: string[], nextToken?: string } }>(newRequestsQuery);
              
              if (newRequestsData?.getNewPackagingRequestIds) {
                const updatedIds = newRequestsData.getNewPackagingRequestIds.packagingRequestIds.filter(
                  (id) => id !== orderId
                );
                
                cache.writeQuery({
                  ...newRequestsQuery,
                  data: {
                    getNewPackagingRequestIds: {
                      ...newRequestsData.getNewPackagingRequestIds,
                      packagingRequestIds: updatedIds,
                    },
                  },
                });
                
                console.log('[startPackaging] Removed order from NEW list:', orderId);
              }
            } catch (e) {
              console.warn('[startPackaging] Could not update NEW list cache:', e);
            }
            
            console.log('[startPackaging] Cache write completed');
          } else {
            console.warn('[startPackaging] Cannot update cache - no existing data found');
          }
        } else {
          console.warn('[startPackaging] Mutation did not return success');
        }
      },
      onCompleted: (data) => {
        console.log('[startPackaging] Mutation completed:', {
          orderId,
          data,
          success: data?.startPackaging?.success
        });
        
        // Don't refetch immediately - let the optimistic cache update persist
        // The cache will be updated correctly via the update() function above
        // Refetching too soon can overwrite the cache with stale data from backend
      },
      onError: (error) => {
        console.error('[startPackaging] Mutation error:', {
          orderId,
          message: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          fullError: error
        });
      },
    }
  );

  // Note: updatePackagingProduct mutation doesn't have a resolver in backend
  // We only use local state (packingProgress) to track packing progress
  // This is fine since the backend doesn't need to know until we complete packaging
  const updateLoading = false; // No actual mutation

  const [completePackaging, { loading: completeLoading }] = useMutation<{ completePackaging: Response }>(
    COMPLETE_PACKAGING,
    {
      variables: { input: { orderId } },
      refetchQueries: [
        { query: GET_NEW_PACKAGING_REQUEST_IDS },
        { query: GET_PACKAGING_REQUEST_V2, variables: { input: { orderId } } },
      ],
      awaitRefetchQueries: true,
      update: (cache, { data }) => {
        console.log('[completePackaging] Update callback:', {
          orderId,
          hasData: !!data,
          success: data?.completePackaging?.success
        });
        
        if (data?.completePackaging.success) {
          // Update the packaging request status in cache
          const queryOptions = { query: GET_PACKAGING_REQUEST_V2, variables: { input: { orderId } } };
          const existingData = cache.readQuery<{ getPackagingRequest: PackagingRequest }>(queryOptions);
          
          if (existingData && existingData.getPackagingRequest) {
            cache.writeQuery({
              ...queryOptions,
              data: {
                getPackagingRequest: {
                  ...existingData.getPackagingRequest,
                  status: 'COMPLETED',
                },
              },
            });
            console.log('[completePackaging] Updated cache status to COMPLETED');
          }
          
          // Remove from NEW packaging requests list
          try {
            const newRequestsQuery = { query: GET_NEW_PACKAGING_REQUEST_IDS };
            const newRequestsData = cache.readQuery<{ getNewPackagingRequestIds: { packagingRequestIds: string[], nextToken?: string } }>(newRequestsQuery);
            
            if (newRequestsData?.getNewPackagingRequestIds) {
              const updatedIds = newRequestsData.getNewPackagingRequestIds.packagingRequestIds.filter(
                (id) => id !== orderId
              );
              
              cache.writeQuery({
                ...newRequestsQuery,
                data: {
                  getNewPackagingRequestIds: {
                    ...newRequestsData.getNewPackagingRequestIds,
                    packagingRequestIds: updatedIds,
                  },
                },
              });
              
              console.log('[completePackaging] Removed order from NEW list:', orderId);
            }
          } catch (e) {
            console.warn('[completePackaging] Could not update NEW list cache:', e);
          }
        }
      },
      onCompleted: (data) => {
        console.log('[completePackaging] Mutation completed:', {
          orderId,
          data,
          success: data?.completePackaging?.success
        });
        
        // Small delay to allow DynamoDB GSI to update before closing modal
        // This ensures the NEW list query sees the updated index
        setTimeout(() => {
          onClose();
        }, 500);
      },
      onError: (error) => {
        console.error('[completePackaging] Mutation error:', {
          orderId,
          message: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          fullError: error
        });
        
        // Show user-friendly error message
        const errorMsg = error.graphQLErrors?.[0]?.message || error.message;
        alert(`Cannot complete packaging: ${errorMsg}\n\nThis may happen if the order status is not IN_PROGRESS in the database.`);
      },
    }
  );

  const handleStartPackaging = async () => {
    try {
      console.log('[handleStartPackaging] Button clicked for order:', orderId);
      console.log('[handleStartPackaging] Sending mutation with variables:', { input: { orderId } });
      
      const result = await startPackaging({ variables: { input: { orderId } } });
      
      console.log('[handleStartPackaging] Mutation returned:', {
        result,
        data: result.data,
        errors: result.errors
      });
    } catch (err) {
      console.error('[handleStartPackaging] Exception caught:', {
        orderId,
        error: err,
        message: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const handleToggleProduct = (productId: string) => {
    setCheckedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        console.log('[handleToggleProduct] Unchecked:', productId);
      } else {
        newSet.add(productId);
        console.log('[handleToggleProduct] Checked:', productId);
      }
      console.log('[handleToggleProduct] All checked products:', Array.from(newSet));
      return newSet;
    });
  };

  const handleCompletePackaging = async () => {
    try {
      console.log('[handleCompletePackaging] Starting with status:', packagingRequest.status);
      console.log('[handleCompletePackaging] Checked products:', Array.from(checkedProducts));
      
      const result = await completePackaging({ variables: { input: { orderId } } });
      
      console.log('[handleCompletePackaging] Mutation result:', result);
    } catch (err) {
      console.error('[handleCompletePackaging] Failed to complete packaging:', err);
      alert(`Failed to complete packaging: ${err instanceof Error ? err.message : String(err)}`);
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (packagingLoading) {
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

  // Early validation: Check if packaging data exists
  if (error || !packagingData || !packagingData.getPackagingRequest) {
    console.error('[PackagingDetailModal] Validation failed:', {
      orderId,
      hasError: !!error,
      errorMessage: error?.message,
      hasPackagingData: !!packagingData,
      hasPackagingRequest: !!packagingData?.getPackagingRequest,
      packagingDataRaw: packagingData
    });
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-red-600 text-center">
            <p className="mb-4">Failed to load packaging request</p>
            {error && <p className="text-sm mb-2">{error.message}</p>}
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const packagingRequestRaw = packagingData.getPackagingRequest;

  console.log('[PackagingDetailModal] Rendering with data:', {
    orderId,
    status: packagingRequestRaw?.status,
    statusType: typeof packagingRequestRaw?.status,
    hasStatus: packagingRequestRaw?.hasOwnProperty('status'),
    hasProducts: !!packagingRequestRaw?.products,
    productsCount: packagingRequestRaw?.products?.length,
    fullPackagingRequest: packagingRequestRaw,
    packagingDataRaw: packagingData
  });

  // Normalize status: treat UNKNOWN, missing, or invalid status as NEW
  const validStatuses = ['NEW', 'IN_PROGRESS', 'COMPLETED'];
  const normalizedStatus = (!packagingRequestRaw.status || !validStatuses.includes(packagingRequestRaw.status))
    ? 'NEW'
    : packagingRequestRaw.status;
  
  if (normalizedStatus !== packagingRequestRaw.status) {
    console.warn('[PackagingDetailModal] Invalid or missing status:', packagingRequestRaw.status, '- treating as NEW');
  }

  // Create a mutable copy with normalized status
  const packagingRequest = {
    ...packagingRequestRaw,
    status: normalizedStatus
  };

  // Defensive: Ensure products is an array, fallback to empty array if not
  // Filter out the __metadata record (it's not a real product)
  const packagingProducts = Array.isArray(packagingRequest.products)
    ? packagingRequest.products.filter(p => p.productId !== '__metadata')
    : [];

  // If products is not array, show error UI
  if (!Array.isArray(packagingRequest.products)) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-red-600 text-center">
            <p className="mb-4">Packaging request data is missing or invalid.</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  // Map packaging products to include checked state
  const productsToPack = packagingProducts.map(packagingProduct => {
    const isChecked = checkedProducts.has(packagingProduct.productId);
    return {
      productId: packagingProduct.productId,
      quantity: packagingProduct.quantity, // This is the target quantity from order
      checked: isChecked,
      name: packagingProduct.productId // Use productId as name since we don't have order data
    };
  });

  console.log('[PackagingDetailModal] Products to pack:', {
    productCount: productsToPack.length,
    products: productsToPack,
    checkedProducts: Array.from(checkedProducts),
    status: packagingRequest.status
  });

  // All products must be checked to complete packaging
  const allProductsChecked = productsToPack.length > 0 && productsToPack.every(
    (product) => product.checked
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Packaging Request</h2>
              <p className="text-sm text-indigo-100 font-mono">{orderId}</p>
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
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(packagingRequest.status)}`}>
              {packagingRequest.status}
            </span>
            {packagingRequest.status === 'NEW' && (
              <Button
                variant="primary"
                onClick={handleStartPackaging}
                isLoading={startLoading}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Packaging
                </span>
              </Button>
            )}
          </div>

          {/* Products List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Products to Pack
              {packagingRequest.status === 'IN_PROGRESS' && (
                <span className="ml-3 text-sm font-normal text-gray-600">
                  ({Array.from(checkedProducts).length} / {productsToPack.length} packed)
                </span>
              )}
            </h3>
            {productsToPack.map((product) => {
              return (
                <div
                  key={product.productId}
                  className={`rounded-lg p-4 border-2 transition-all ${
                    packagingRequest.status === 'IN_PROGRESS' ? 'cursor-pointer' : ''
                  } ${
                    product.checked 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-indigo-300'
                  }`}
                  onClick={() => packagingRequest.status === 'IN_PROGRESS' && handleToggleProduct(product.productId)}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    {packagingRequest.status === 'IN_PROGRESS' && (
                      <div className="flex-shrink-0">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          product.checked 
                            ? 'bg-green-500 border-green-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {product.checked && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">Product ID</p>
                      <p className="text-sm font-mono text-gray-600">{product.productId}</p>
                    </div>
                    
                    {/* Quantity Badge */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-medium text-gray-500">Quantity</p>
                      <p className="text-2xl font-bold text-indigo-600">{product.quantity}</p>
                    </div>
                    
                    {/* Status Icon */}
                    {product.checked && (
                      <div className="flex-shrink-0">
                        <div className="bg-green-500 rounded-full p-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {packagingRequest.status === 'IN_PROGRESS' && (
            <Button
              variant="primary"
              onClick={handleCompletePackaging}
              isLoading={completeLoading}
              disabled={!allProductsChecked}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Packaging
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackagingDetailModal;
