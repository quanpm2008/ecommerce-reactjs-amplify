import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';
import type { CartItem } from '../../types/graphql';

const Header: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { items } = useCart();
  
  const cartItemCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">ShopHub</h1>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <>
                <Link to="/products" className="text-gray-700 hover:text-primary-600 font-medium">
                  Products
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-primary-600 font-medium">
                  My Orders
                </Link>
                {/* Show Warehouse link only for admin or warehouse users */}
                {(user?.groups?.includes('admin') || user?.groups?.includes('warehouse')) && (
                  <Link to="/warehouse" className="flex items-center gap-1 text-gray-700 hover:text-primary-600 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Warehouse
                  </Link>
                )}
                {/* Show Delivery link only for admin or delivery users */}
                {(user?.groups?.includes('admin') || user?.groups?.includes('delivery')) && (
                  <Link to="/delivery" className="flex items-center gap-1 text-gray-700 hover:text-primary-600 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Delivery
                  </Link>
                )}
                {/* Show Admin Products link only for admin users */}
                {user?.groups?.includes('admin') && (
                  <Link to="/admin/products" className="flex items-center gap-1 text-gray-700 hover:text-primary-600 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-primary-600">
              <ShoppingCartIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                  <UserCircleIcon className="h-6 w-6 mr-1" />
                  <span className="hidden md:inline text-sm">{user?.name || user?.email || user?.username || 'User'}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={login}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
