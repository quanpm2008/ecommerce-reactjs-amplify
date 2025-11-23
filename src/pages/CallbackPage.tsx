import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

const CallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        console.error('OAuth error:', error);
        console.error('Error description:', errorDescription);
        console.error('Full URL:', window.location.href);
        navigate('/');
        return;
      }

      if (code && state) {
        try {
          await authService.handleCallback(code, state);
          refreshUser(); // Refresh user state after successful login
          navigate('/');
        } catch (err) {
          console.error('Failed to handle callback:', err);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [location, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
};

export default CallbackPage;
