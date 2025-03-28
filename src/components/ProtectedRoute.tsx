
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If authentication is complete and no user, redirect to login
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
    
    // If authentication is complete, user exists, but role doesn't match
    if (!isLoading && user && requiredRole && userRole !== requiredRole) {
      const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, user, userRole, requiredRole, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
