import React from 'react';
import { ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  message?: string;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  message = 'Please login to continue',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-6">
            <UserCircleIcon className="h-10 w-10 text-primary-600" />
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Login Required
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {message}. Sign in to your account to add items to your cart and complete your purchase.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <UserCircleIcon className="h-5 w-5" />
                Sign In to Continue
              </button>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Maybe Later
              </button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <ShoppingCartIcon className="inline h-4 w-4 mr-1" />
                Your cart items will be saved when you login
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
