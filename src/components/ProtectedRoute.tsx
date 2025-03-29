
import React, { useEffect, useState } from 'react';
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
  const [isRehydrating, setIsRehydrating] = useState(true);
  const [rehydrationFailed, setRehydrationFailed] = useState(false);

  useEffect(() => {
    // Check for stored auth state to determine if we're rehydrating
    const storedState = sessionStorage.getItem('auth_state');
    if (storedState) {
      try {
        const { timestamp } = JSON.parse(storedState);
        // If stored state is less than 1 hour old, we're likely rehydrating
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          setIsRehydrating(true);
          // Give a short delay to allow auth state to rehydrate
          const timer = setTimeout(() => {
            if (!user) {
              console.log("Rehydration failed to restore user");
              setRehydrationFailed(true);
            }
            setIsRehydrating(false);
          }, 2000); // Increased timeout to 2 seconds
          return () => clearTimeout(timer);
        } else {
          console.log("Stored auth state expired");
          sessionStorage.removeItem('auth_state');
        }
      } catch (error) {
        console.error('Error checking stored auth state:', error);
        sessionStorage.removeItem('auth_state');
      }
    }
    setIsRehydrating(false);
  }, [user]);

  // If rehydration failed, redirect to auth
  if (rehydrationFailed) {
    console.log("Rehydration failed, redirecting to auth");
    sessionStorage.removeItem('auth_state');
    return <Navigate to="/auth" replace />;
  }

  // Don't redirect while rehydrating
  if (isRehydrating) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Restoring your session...</p>
        </div>
      </div>
    );
  }

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
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
