import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { PlusIcon } from '@heroicons/react/24/outline';
import { GET_PRODUCTS } from '../graphql/queries';
import { CREATE_PRODUCT, GET_PRESIGNED_URL } from '../graphql/queries';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import CreateProductModal from '../components/admin/CreateProductModal';
import type { Product } from '../types/graphql';

const AdminProductsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { data, loading, refetch } = useQuery<{ getProducts: { products: Product[] } }>(GET_PRODUCTS);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const products = data?.getProducts?.products || [];

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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
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
