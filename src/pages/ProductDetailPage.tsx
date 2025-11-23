import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { GET_PRODUCT } from '../graphql/queries';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import LoginPromptModal from '../components/ui/LoginPromptModal';
import type { Product } from '../types/graphql';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated, login } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { data, loading, error } = useQuery<{ getProduct: Product }>(GET_PRODUCT, {
    variables: { productId: id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data?.getProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <Button onClick={() => navigate('/products')}>Back to Products</Button>
      </div>
    );
  }

  const product = data.getProduct;
  const images = product.pictures || [];

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    addItem(product, quantity);
    navigate('/cart');
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          ← Back
        </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images Section */}
        <div>
          <div className="bg-gray-200 rounded-lg overflow-hidden mb-4">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center">
                <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img: string, index: number) => (
                <div
                  key={index}
                  className={`cursor-pointer border-2 rounded overflow-hidden ${
                    selectedImage === index ? 'border-primary-600' : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          {product.category && (
            <span className="text-sm text-primary-600 font-semibold uppercase">
              {product.category}
            </span>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
            {product.name}
          </h1>

          <div className="text-4xl font-bold text-gray-900 mb-6">
            ${product.price}
          </div>

          {/* Category */}
          {product.category && (
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded">
                {product.category}
              </span>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Package Info */}
          {product.package && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Package Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                {product.package.weight && (
                  <div>Weight: {product.package.weight}g</div>
                )}
                {product.package.width && product.package.length && product.package.height && (
                  <div>
                    Dimensions: {product.package.width} × {product.package.length} × {product.package.height} cm
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <span className="w-16 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;
