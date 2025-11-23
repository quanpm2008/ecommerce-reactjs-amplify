import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '../graphql/queries';
import { useCart } from '../contexts/CartContext';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import type { Product, PaginatedProducts } from '../types/graphql';

const ProductsPage: React.FC = () => {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data, loading, error, fetchMore } = useQuery<{ getProducts: PaginatedProducts }>(
    GET_PRODUCTS,
    {
      variables: { nextToken: null },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    }
  );

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  const handleLoadMore = () => {
    if (data?.getProducts.nextToken) {
      fetchMore({
        variables: {
          nextToken: data.getProducts.nextToken,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            getProducts: {
              ...fetchMoreResult.getProducts,
              products: [
                ...prev.getProducts.products,
                ...fetchMoreResult.getProducts.products,
              ],
            },
          };
        },
      });
    }
  };

  const products = data?.getProducts.products || [];
  
  // Get unique categories
  const categories = Array.from(
    new Set(products.map((p: Product) => p.category).filter(Boolean))
  );

  // Filter products by category
  const filteredProducts = selectedCategory
    ? products.filter((p: Product) => p.category === selectedCategory)
    : products;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category as string)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">Error loading products: {error.message}</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
          
          {/* Load More Button */}
          {data?.getProducts.nextToken && (
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
    </div>
  );
};

export default ProductsPage;
