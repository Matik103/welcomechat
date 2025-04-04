
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
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
  const [initialRender, setInitialRender] = useState(true);
  
  // Quick render optimization - only check on initial render
  useEffect(() => {
    if (initialRender) {
      const timer = setTimeout(() => {
        setInitialRender(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialRender]);
  
  // Simplified loading state to prevent blank screens
  if ((isLoading || initialRender) && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Handle no user case
  if (!user) {
    console.log("No user in protected route, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // Handle role mismatch
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role mismatch in protected route. User: ${userRole}, Required: ${requiredRole}`);
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
