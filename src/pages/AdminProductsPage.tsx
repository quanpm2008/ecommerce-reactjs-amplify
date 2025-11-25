import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { GET_PRODUCTS } from '../graphql/queries';
import { CREATE_PRODUCT, GET_PRESIGNED_URL } from '../graphql/queries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import CreateProductModal from '../components/admin/CreateProductModal';
import type { Product } from '../types/graphql';

const PRODUCTS_PER_PAGE = 50;

const AdminProductsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, loading, refetch, fetchMore } = useQuery<{ 
    getProducts: { 
      products: Product[];
      nextToken?: string;
    } 
  }>(GET_PRODUCTS, {
    variables: { limit: PRODUCTS_PER_PAGE }
  });

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const products = data?.getProducts?.products || [];
  const hasNextToken = !!data?.getProducts?.nextToken;
  
  // Client-side pagination
  const totalProducts = products.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hasNextToken) {
      // Fetch more from server if we've reached the end of current data
      fetchMore({
        variables: {
          nextToken: data?.getProducts?.nextToken
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            getProducts: {
              ...fetchMoreResult.getProducts,
              products: [...prev.getProducts.products, ...fetchMoreResult.getProducts.products]
            }
          };
        }
      }).then(() => {
        setCurrentPage(currentPage + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Pagination Info */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} - {Math.min(endIndex, totalProducts)} of {totalProducts} products
          {hasNextToken && ' (more available)'}
        </p>
        <p className="text-sm text-gray-600">
          Page {currentPage} of {totalPages || 1}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProducts.map((product) => (
          <Card key={product.productId} className="p-4">
            <div className="aspect-w-16 aspect-h-9 mb-4">
              {product.pictures && product.pictures[0] ? (
                <img
                  src={product.pictures[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-1">Category: {product.category}</p>
            <p className="text-2xl font-bold text-primary-600 mb-2">${product.price}</p>
            <p className="text-sm text-gray-500">Stock: {product.quantity || 0}</p>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products yet. Add your first product!</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalProducts > PRODUCTS_PER_PAGE && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-500">...</span>
                <button
                  onClick={() => {
                    setCurrentPage(totalPages);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages && !hasNextToken}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      )}

      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default AdminProductsPage;
