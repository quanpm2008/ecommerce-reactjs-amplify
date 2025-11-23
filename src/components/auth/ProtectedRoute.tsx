import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UnauthorizedAccess from '../ui/UnauthorizedAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredGroups?: string[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredGroups = [],
  fallback 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <UnauthorizedAccess 
        message="Please sign in to access this page"
        requiredRole={requiredGroups.join(', ')}
      />
    );
  }

  // Check if user has required groups
  if (requiredGroups.length > 0) {
    const userGroups = user?.groups || [];
    const hasRequiredGroup = requiredGroups.some(group => 
      userGroups.includes(group)
    );

    if (!hasRequiredGroup) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <UnauthorizedAccess 
          message="You don't have the required permissions to access this page"
          requiredRole={requiredGroups.join(' or ')}
        />
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
