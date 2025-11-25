import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, fetchMore } = useQuery<{ getProducts: PaginatedProducts }>(
    GET_PRODUCTS,
    {
      variables: { nextToken: null },
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagDropdown]);

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

  // Get unique tags from all products
  const allTags = Array.from(
    new Set(
      products.flatMap((p: Product) => p.tags || []).filter(Boolean)
    )
  ).sort();

  // Filter products by category and tag
  let allFilteredProducts = products;
  
  if (selectedCategory) {
    allFilteredProducts = allFilteredProducts.filter((p: Product) => p.category === selectedCategory);
  }
  
  if (selectedTags.length > 0) {
    allFilteredProducts = allFilteredProducts.filter((p: Product) => 
      p.tags && selectedTags.some(tag => p.tags!.includes(tag))
    );
  }
  
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
  
  // Reset to page 1 when category or tag changes
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };
  
  const handleTagChange = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
    setCurrentPage(1);
  };
  
  const handleClearAllTags = () => {
    setSelectedTags([]);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(null)}
              >
                All Categories
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
          </div>
        )}
        
        {/* Tag Filter Dropdown */}
        {allTags.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Tags</h3>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="flex items-center justify-between w-64 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <span className="truncate">
                {selectedTags.length > 0 
                  ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                  : 'Select tags...'}
              </span>
              <svg
                className={`w-5 h-5 ml-2 transition-transform duration-200 ${showTagDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showTagDropdown && (
              <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-xs text-gray-500">{allTags.length} tags available</p>
                </div>
                <button
                  onClick={() => {
                    handleClearAllTags();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    selectedTags.length === 0 ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  Clear All Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                </button>
                <div className="border-t border-gray-100">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleTagChange(tag)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                          isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className={isSelected ? 'font-medium' : ''}>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Active Filters & Pagination Info */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          {totalProducts > 0 && (
            <p className="text-sm text-gray-600">
              Showing {startIndex + 1} - {Math.min(endIndex, totalProducts)} of {totalProducts} products
              {hasNextToken && !selectedCategory && selectedTags.length === 0 && ' (more available)'}
            </p>
          )}
          {(selectedCategory || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                  Category: {selectedCategory}
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className="hover:text-primary-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {tag}
                  <button
                    onClick={() => handleTagChange(tag)}
                    className="hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
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
