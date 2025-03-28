
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
    // Handle authentication issues
    if (!isLoading && !user) {
      console.log("No authenticated user found, redirecting to /auth");
      navigate('/auth', { replace: true });
    }
    
    // Handle role-based access
    if (!isLoading && user && requiredRole && userRole !== requiredRole) {
      console.log(`User role (${userRole}) doesn't match required role (${requiredRole}), redirecting`);
      const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, user, userRole, requiredRole, navigate]);

  // Show loading state
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

  // Handle no user case (could happen during auth issues or session timeouts)
  if (!user) {
    console.log("No user in protected route, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // Handle role mismatch
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role mismatch in protected route. User: ${userRole}, Required: ${requiredRole}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
