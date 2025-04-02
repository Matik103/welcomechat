
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [rehydrationStartTime] = useState<number>(Date.now());
  
  useEffect(() => {
    // Give a short time for auth state to rehydrate, but not too long
    const timer = setTimeout(() => {
      setIsRehydrating(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Safety timeout to prevent infinite rehydration
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isRehydrating) {
        console.warn("Rehydration taking too long, forcing completion");
        setIsRehydrating(false);
        toast.error("Session restoration timed out");
      }
    }, 2000);
    
    return () => clearTimeout(safetyTimeout);
  }, [isRehydrating]);
  
  // Monitor time spent in loading state
  useEffect(() => {
    if (isLoading || isRehydrating) {
      const timeSinceStart = Date.now() - rehydrationStartTime;
      
      // If we've been loading for over 3 seconds, log warning
      if (timeSinceStart > 3000) {
        console.warn(`Protected route has been loading for ${Math.round(timeSinceStart / 1000)}s`);
      }
    }
  }, [isLoading, isRehydrating, rehydrationStartTime]);

  // Don't redirect while rehydrating or loading
  if (isRehydrating || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isRehydrating ? "Restoring your session..." : "Loading..."}
          </p>
          <button 
            className="mt-4 text-sm text-primary underline cursor-pointer"
            onClick={() => window.location.reload()}
          >
            Taking too long? Click to reload
          </button>
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
