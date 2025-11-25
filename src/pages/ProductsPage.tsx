import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { GET_PRODUCTS } from '../graphql/queries';
import { useCart } from '../contexts/CartContext';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import type { Product, PaginatedProducts } from '../types/graphql';

const PRODUCTS_PER_PAGE = 50;

const ProductsPage: React.FC = () => {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
  const hasNextToken = !!data?.getProducts?.nextToken;
  
  // Get unique categories
  const categories = Array.from(
    new Set(products.map((p: Product) => p.category).filter(Boolean))
  );

  // Filter products by category
  const allFilteredProducts = selectedCategory
    ? products.filter((p: Product) => p.category === selectedCategory)
    : products;
  
  // Client-side pagination
  const totalProducts = allFilteredProducts.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const filteredProducts = allFilteredProducts.slice(startIndex, endIndex);
  
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
    } else if (hasNextToken && !selectedCategory) {
      // Fetch more from server if we've reached the end and not filtering by category
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
  
  // Reset to page 1 when category changes
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

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
              onClick={() => handleCategoryChange(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category as string)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination Info */}
      {totalProducts > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {startIndex + 1} - {Math.min(endIndex, totalProducts)} of {totalProducts} products
          {selectedCategory && ` in ${selectedCategory}`}
          {hasNextToken && !selectedCategory && ' (more available)'}
        </div>
      )}

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
        </>
      )}
    </div>
  );
};

export default ProductsPage;
