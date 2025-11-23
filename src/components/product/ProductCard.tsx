import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoginPromptModal from '../ui/LoginPromptModal';
import type { Product } from '../../types/graphql';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { isAuthenticated, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleLogin = () => {
    setShowLoginModal(false);
    login();
  };

  return (
    <>
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        message="To add items to your cart"
      />
      
      <Link to={`/products/${product.productId}`}>
        <Card hover className="h-full flex flex-col">
        {/* Product Image */}
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          {product.pictures && product.pictures.length > 0 ? (
            <img
              src={product.pictures[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-grow flex flex-col">
          {product.category && (
            <span className="text-xs text-primary-600 font-semibold uppercase mb-1">
              {product.category}
            </span>
          )}
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>
          
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.slice(0, 3).map((tag: string, index: number) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-gray-900">
                ${product.price}
              </span>
            </div>
            
            <Button
              variant="primary"
              fullWidth
              onClick={handleAddToCart}
              size="sm"
            >
              Add to Cart
            </Button>
          </div>
        </div>
        </Card>
      </Link>
    </>
  );
};

export default ProductCard;
